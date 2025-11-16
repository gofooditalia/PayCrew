/**
 * API Route per creazione turni multipli
 *
 * Permette di creare più turni in batch (pianificazione settimanale/mensile)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { turniMultipliCreateSchema } from '@/lib/validation/turni-validator'
import { AttivitaLogger } from '@/lib/attivita-logger'
import { PresenzeFromTurniService } from '@/lib/services/presenze-from-turni.service'
import { analizzaStraordinariDaTurni, type TurnoBase } from '@/lib/utils/ore-calculator'

/**
 * POST /api/turni/multipli
 * Crea più turni in batch per un dipendente
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

    // Recupera i dati dell'utente
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

    // Parse e validazione del body
    const body = await request.json()
    const validatedData = turniMultipliCreateSchema.parse(body)

    // Verifica che il dipendente appartenga all'azienda
    const dipendente = await prisma.dipendenti.findFirst({
      where: {
        id: validatedData.dipendenteId,
        aziendaId: dbUser.aziendaId
      }
    })

    if (!dipendente) {
      return NextResponse.json(
        { error: 'Dipendente non trovato o non autorizzato' },
        { status: 404 }
      )
    }

    // Se sedeId è fornito e non è 'none', verifica che la sede appartenga all'azienda
    if (validatedData.sedeId && validatedData.sedeId !== 'none') {
      const sede = await prisma.sedi.findFirst({
        where: {
          id: validatedData.sedeId,
          aziendaId: dbUser.aziendaId
        }
      })

      if (!sede) {
        return NextResponse.json(
          { error: 'Sede non trovata o non autorizzata' },
          { status: 404 }
        )
      }
    }

    // Genera le date per i turni
    const dataInizio = new Date(validatedData.dataInizio)
    const dataFine = new Date(validatedData.dataFine)
    const turniDaCreare: Array<{
      data: Date
      oraInizio: string
      oraFine: string
      pausaPranzoInizio: string | null
      pausaPranzoFine: string | null
      tipoTurno: any
      dipendenteId: string
      sedeId: string | null
    }> = []

    // Itera sulle date nel range
    for (let data = new Date(dataInizio); data <= dataFine; data.setDate(data.getDate() + 1)) {
      const giornoSettimana = data.getDay() // 0=Domenica, 1=Lunedì, ...

      // Verifica se questo giorno è incluso nei giorni selezionati
      if (validatedData.giorni.includes(giornoSettimana)) {
        turniDaCreare.push({
          data: new Date(data),
          oraInizio: validatedData.oraInizio,
          oraFine: validatedData.oraFine,
          pausaPranzoInizio: validatedData.pausaPranzoInizio || null,
          pausaPranzoFine: validatedData.pausaPranzoFine || null,
          tipoTurno: validatedData.tipoTurno,
          dipendenteId: validatedData.dipendenteId,
          sedeId: (validatedData.sedeId && validatedData.sedeId !== 'none') ? validatedData.sedeId : null
        })
      }
    }

    if (turniDaCreare.length === 0) {
      return NextResponse.json(
        { error: 'Nessun turno da creare con i parametri forniti' },
        { status: 400 }
      )
    }

    // ========================================
    // ANALISI STRAORDINARI PREVISTI
    // ========================================

    // Recupera i turni esistenti del dipendente nel periodo
    const turniEsistentiPeriodo = await prisma.turni.findMany({
      where: {
        dipendenteId: validatedData.dipendenteId,
        data: {
          gte: dataInizio,
          lte: dataFine
        }
      }
    })

    // Combina turni esistenti con turni da creare per analisi completa
    const tuttiTurniPeriodo: TurnoBase[] = [
      ...turniEsistentiPeriodo.map(t => ({
        data: t.data,
        oraInizio: t.oraInizio,
        oraFine: t.oraFine,
        pausaPranzoInizio: t.pausaPranzoInizio,
        pausaPranzoFine: t.pausaPranzoFine
      })),
      ...turniDaCreare.map(t => ({
        data: t.data,
        oraInizio: t.oraInizio,
        oraFine: t.oraFine,
        pausaPranzoInizio: t.pausaPranzoInizio,
        pausaPranzoFine: t.pausaPranzoFine
      }))
    ]

    const analisiStraordinari = analizzaStraordinariDaTurni(
      tuttiTurniPeriodo,
      dipendente.oreSettimanali
    )

    // Verifica sovrapposizioni per ogni turno da creare
    for (const nuovoTurno of turniDaCreare) {
      const turniEsistenti = await prisma.turni.findMany({
        where: {
          dipendenteId: validatedData.dipendenteId,
          data: nuovoTurno.data
        }
      })

      for (const turnoEsistente of turniEsistenti) {
        const conflitto = verificaSovrapposizioneTurni(
          nuovoTurno.oraInizio,
          nuovoTurno.oraFine,
          turnoEsistente.oraInizio,
          turnoEsistente.oraFine
        )

        if (conflitto) {
          // Formatta la data in formato italiano (DD/MM/YYYY)
          const dataFormattata = nuovoTurno.data.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })

          return NextResponse.json(
            {
              error: 'Sovrapposizione turni',
              message: `Il dipendente ha già un turno il ${dataFormattata} dalle ${turnoEsistente.oraInizio} alle ${turnoEsistente.oraFine}. Se vuoi pianificare pranzo e sera, usa un turno SPEZZATO con pausa pranzo.`
            },
            { status: 409 }
          )
        }
      }
    }

    // Creazione batch turni
    const turniCreati = await prisma.turni.createMany({
      data: turniDaCreare
    })

    // Activity logging (log singolo per operazione batch)
    const dipendenteNomeCompleto = `${dipendente.nome} ${dipendente.cognome}`
    await AttivitaLogger.logAttivita({
      tipoAttivita: 'CREAZIONE_TURNO',
      descrizione: `Creati ${turniCreati.count} turni per: ${dipendenteNomeCompleto} (pianificazione multipla)`,
      idEntita: validatedData.dipendenteId,
      tipoEntita: 'TURNO',
      userId: user.id,
      aziendaId: dbUser.aziendaId,
      datiAggiuntivi: {
        dipendenteId: validatedData.dipendenteId,
        dataInizio: validatedData.dataInizio,
        dataFine: validatedData.dataFine,
        numeroTurni: turniCreati.count,
        tipoTurno: validatedData.tipoTurno,
        giorni: validatedData.giorni
      }
    })

    // Auto-genera presenze dai turni creati
    try {
      // Recupera i turni appena creati (createMany non li ritorna)
      const turniCreatiRecords = await prisma.turni.findMany({
        where: {
          dipendenteId: validatedData.dipendenteId,
          data: {
            gte: dataInizio,
            lte: dataFine
          },
          oraInizio: validatedData.oraInizio,
          oraFine: validatedData.oraFine,
          tipoTurno: validatedData.tipoTurno
        },
        include: {
          dipendenti: {
            select: {
              id: true,
              nome: true,
              cognome: true,
              oreSettimanali: true
            }
          }
        }
      })

      // Genera presenza per ogni turno
      let presenzeGenerate = 0
      for (const turno of turniCreatiRecords) {
        try {
          const result = await PresenzeFromTurniService.generaPresenzaDaTurno(turno, false)
          if (result === 'generated') {
            presenzeGenerate++
          }
        } catch (presenzaError) {
          // Log ma non bloccare
          console.error(`Errore generazione presenza per turno ${turno.id}:`, presenzaError)
        }
      }

      console.log(`Auto-generate ${presenzeGenerate}/${turniCreati.count} presenze da turni multipli`)
    } catch (autoGenError) {
      // Log error ma non bloccare la risposta
      console.error('Errore auto-generazione presenze batch:', autoGenError)
    }

    return NextResponse.json({
      success: true,
      message: `${turniCreati.count} turni creati con successo`,
      count: turniCreati.count,
      analisiStraordinari
    }, { status: 201 })

  } catch (error: any) {
    console.error('Errore POST /api/turni/multipli:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Errore nella creazione dei turni' },
      { status: 500 }
    )
  }
}

/**
 * Utility: Verifica sovrapposizione orari
 */
function verificaSovrapposizioneTurni(
  oraInizio1: string,
  oraFine1: string,
  oraInizio2: string,
  oraFine2: string
): boolean {
  const [h1Start, m1Start] = oraInizio1.split(':').map(Number)
  const [h1End, m1End] = oraFine1.split(':').map(Number)
  const [h2Start, m2Start] = oraInizio2.split(':').map(Number)
  const [h2End, m2End] = oraFine2.split(':').map(Number)

  const minuti1Start = h1Start * 60 + m1Start
  const minuti1End = h1End * 60 + m1End
  const minuti2Start = h2Start * 60 + m2Start
  const minuti2End = h2End * 60 + m2End

  return (
    (minuti1Start >= minuti2Start && minuti1Start < minuti2End) ||
    (minuti1End > minuti2Start && minuti1End <= minuti2End) ||
    (minuti1Start <= minuti2Start && minuti1End >= minuti2End)
  )
}
