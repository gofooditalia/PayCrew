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

    // Esegui operazioni in una transazione Prisma
    await prisma.$transaction(async (tx) => {
      // Processa spostamenti
      for (const spostamento of spostamenti) {
        // Verifica che il turno esista e appartenga all'azienda dell'utente
        const turnoEsistente = await tx.turni.findFirst({
          where: {
            id: spostamento.turnoId,
            dipendenti: {
              aziendaId: dbUser.aziendaId!
            }
          }
        })

        if (!turnoEsistente) {
          throw new Error(`Turno ${spostamento.turnoId} non trovato o non autorizzato`)
        }

        // Aggiorna il turno con nuova data e dipendente
        const turnoAggiornato = await tx.turni.update({
          where: { id: spostamento.turnoId },
          data: {
            data: parseLocalDate(spostamento.toDate),
            dipendenteId: spostamento.toDipendenteId
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

        // Log attività (opzionale, può fallire senza bloccare)
        try {
          const dipendenteNome = `${turnoAggiornato.dipendenti.nome} ${turnoAggiornato.dipendenti.cognome}`
          await AttivitaLogger.logModificaTurno(
            turnoAggiornato as any,
            dipendenteNome,
            user.id,
            dbUser.aziendaId!
          )
        } catch (logError) {
          console.error('Errore logging modifica turno:', logError)
        }
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

        // Crea il nuovo turno duplicato
        const nuovoTurno = await tx.turni.create({
          data: {
            data: parseLocalDate(toDate),
            oraInizio: turnoOriginale.oraInizio,
            oraFine: turnoOriginale.oraFine,
            pausaPranzoInizio: turnoOriginale.pausaPranzoInizio,
            pausaPranzoFine: turnoOriginale.pausaPranzoFine,
            tipoTurno: turnoOriginale.tipoTurno,
            dipendenteId: toDipendenteId
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

        // Log attività (opzionale, può fallire senza bloccare)
        try {
          const dipendenteNome = `${nuovoTurno.dipendenti.nome} ${nuovoTurno.dipendenti.cognome}`
          await AttivitaLogger.logCreazioneTurno(
            nuovoTurno as any,
            dipendenteNome,
            user.id,
            dbUser.aziendaId!
          )
        } catch (logError) {
          console.error('Errore logging creazione turno:', logError)
        }
      }
    })

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
