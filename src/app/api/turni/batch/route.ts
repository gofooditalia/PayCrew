/**
 * API Route per Batch Operations sui Turni
 *
 * Gestisce operazioni batch per spostamenti e duplicazioni turni
 * in modalità drag & drop
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { AttivitaLogger } from '@/lib/attivita-logger'
import { tipo_turno } from '@prisma/client'

/**
 * Helper per parsare una data string in formato YYYY-MM-DD come data locale
 */
function parseLocalDate(dateString: string): Date {
  console.log('parseLocalDate ricevuta:', dateString)
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
  console.log('parseLocalDate risultato:', date)
  return date
}

interface TurnoSpostamento {
  turnoId: string
  fromDate: string
  toDate: string
  fromDipendenteId: string
  toDipendenteId: string
}

interface TurnoDuplicazione {
  turnoOriginale: {
    id: string
    data: string
    oraInizio: string
    oraFine: string
    pausaPranzoInizio?: string | null
    pausaPranzoFine?: string | null
    tipoTurno: tipo_turno
    dipendenteId: string
  }
  toDate: string
  toDipendenteId: string
}

interface BatchRequest {
  spostamenti: TurnoSpostamento[]
  duplicazioni: TurnoDuplicazione[]
}

/**
 * POST /api/turni/batch
 * Esegue operazioni batch di spostamento e duplicazione turni
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    // Recupera i dati dell'utente dal database
    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true, role: true }
    })

    if (!dbUser?.aziendaId) {
      return NextResponse.json(
        { error: 'Utente non associato a nessuna azienda' },
        { status: 403 }
      )
    }

    const body: BatchRequest = await request.json()
    const { spostamenti, duplicazioni } = body

    // Debug: log del payload ricevuto
    console.log('Batch request ricevuta:', JSON.stringify(body, null, 2))

    let countSpostamenti = 0
    let countDuplicazioni = 0

    // Array per raccogliere dati per logging (eseguito dopo la transazione)
    const turniPerLogging: Array<{
      tipo: 'modifica' | 'creazione'
      turno: any
      dipendenteNome: string
    }> = []

    // Esegui operazioni in una transazione Prisma veloce (solo DB operations)
    await prisma.$transaction(async (tx) => {
      // Processa spostamenti (DELETE + CREATE per integrità referenziale)
      for (const spostamento of spostamenti) {
        // Recupera i dati del turno originale (prima di eliminarlo)
        const turnoOriginale = await tx.turni.findFirst({
          where: {
            id: spostamento.turnoId,
            dipendenti: {
              aziendaId: dbUser.aziendaId!
            }
          }
        })

        if (!turnoOriginale) {
          throw new Error(`Turno ${spostamento.turnoId} non trovato o non autorizzato`)
        }

        // Recupera dati del dipendente di destinazione (per sedeId)
        const dipendenteDestinazione = await tx.dipendenti.findUnique({
          where: { id: spostamento.toDipendenteId },
          select: {
            nome: true,
            cognome: true,
            sedeId: true
          }
        })

        if (!dipendenteDestinazione) {
          throw new Error(`Dipendente destinazione non trovato`)
        }

        // ELIMINA il turno originale (CASCADE elimina anche presenze generate)
        await tx.turni.delete({
          where: { id: spostamento.turnoId }
        })

        // CREA nuovo turno nella posizione di destinazione
        const nuovoTurno = await tx.turni.create({
          data: {
            data: parseLocalDate(spostamento.toDate),
            oraInizio: turnoOriginale.oraInizio,
            oraFine: turnoOriginale.oraFine,
            pausaPranzoInizio: turnoOriginale.pausaPranzoInizio,
            pausaPranzoFine: turnoOriginale.pausaPranzoFine,
            tipoTurno: turnoOriginale.tipoTurno,
            dipendenteId: spostamento.toDipendenteId,
            sedeId: dipendenteDestinazione.sedeId // Sede del dipendente di destinazione
          },
          include: {
            dipendenti: {
              select: {
                nome: true,
                cognome: true
              }
            }
          }
        })

        countSpostamenti++

        // Raccogli dati per logging dopo la transazione
        turniPerLogging.push({
          tipo: 'creazione', // Ora è una creazione, non una modifica
          turno: nuovoTurno,
          dipendenteNome: `${nuovoTurno.dipendenti.nome} ${nuovoTurno.dipendenti.cognome}`
        })
      }

      // Processa duplicazioni
      for (const duplicazione of duplicazioni) {
        const { turnoOriginale, toDate, toDipendenteId } = duplicazione

        // Skip verifica se è un turno temporaneo (già duplicato in precedenza)
        // Gli ID temporanei iniziano con "temp-dup-"
        if (!turnoOriginale.id.startsWith('temp-dup-')) {
          // Verifica che il turno originale appartenga all'azienda
          const turnoCheck = await tx.turni.findFirst({
            where: {
              id: turnoOriginale.id,
              dipendenti: {
                aziendaId: dbUser.aziendaId!
              }
            }
          })

          if (!turnoCheck) {
            throw new Error(`Turno originale ${turnoOriginale.id} non trovato o non autorizzato`)
          }
        }

        // Recupera dati del dipendente di destinazione (per sedeId)
        const dipendenteDest = await tx.dipendenti.findUnique({
          where: { id: toDipendenteId },
          select: {
            nome: true,
            cognome: true,
            sedeId: true
          }
        })

        if (!dipendenteDest) {
          throw new Error(`Dipendente destinazione non trovato`)
        }

        // Crea il nuovo turno duplicato con sedeId corretta
        const nuovoTurno = await tx.turni.create({
          data: {
            data: parseLocalDate(toDate),
            oraInizio: turnoOriginale.oraInizio,
            oraFine: turnoOriginale.oraFine,
            pausaPranzoInizio: turnoOriginale.pausaPranzoInizio,
            pausaPranzoFine: turnoOriginale.pausaPranzoFine,
            tipoTurno: turnoOriginale.tipoTurno,
            dipendenteId: toDipendenteId,
            sedeId: dipendenteDest.sedeId // Sede del dipendente di destinazione
          },
          include: {
            dipendenti: {
              select: {
                nome: true,
                cognome: true
              }
            }
          }
        })

        countDuplicazioni++

        // Raccogli dati per logging dopo la transazione
        turniPerLogging.push({
          tipo: 'creazione',
          turno: nuovoTurno,
          dipendenteNome: `${nuovoTurno.dipendenti.nome} ${nuovoTurno.dipendenti.cognome}`
        })
      }
    })

    // Log attività DOPO la transazione (non blocca il commit)
    // Eseguito in parallelo per massimizzare performance
    const loggingPromises = turniPerLogging.map(({ tipo, turno, dipendenteNome }) => {
      // Tutti gli spostamenti e duplicazioni sono ora creazioni (DELETE + CREATE)
      return AttivitaLogger.logCreazioneTurno(
        turno as any,
        dipendenteNome,
        user.id,
        dbUser.aziendaId!
      ).catch(err => console.error('Errore logging creazione turno:', err))
    })

    // Attendi logging in background (non blocca la risposta)
    await Promise.allSettled(loggingPromises)

    return NextResponse.json({
      success: true,
      message: `${countSpostamenti} turni spostati, ${countDuplicazioni} turni duplicati`,
      countSpostamenti,
      countDuplicazioni
    })

  } catch (error: any) {
    console.error('Errore batch turni:', error)
    return NextResponse.json(
      { error: error.message || 'Errore durante l\'operazione batch' },
      { status: 500 }
    )
  }
}
