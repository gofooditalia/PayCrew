/**
 * API Routes per Turni
 *
 * Gestisce le operazioni CRUD sui turni con validazione,
 * controllo autorizzazioni e activity logging
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { turnoCreateSchema, turniFiltriSchema } from '@/lib/validation/turni-validator'
import { AttivitaLogger } from '@/lib/attivita-logger'
import { PresenzeFromTurniService } from '@/lib/services/presenze-from-turni.service'

/**
 * Helper per parsare una data string in formato YYYY-MM-DD come data locale
 * Evita problemi di timezone che causerebbero uno shift del giorno
 * Crea una data UTC a mezzanotte per evitare conversioni di fuso orario
 */
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  // Usa Date.UTC per creare una data UTC a mezzanotte, evitando shift timezone
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}

/**
 * GET /api/turni
 * Ottiene la lista dei turni con filtri opzionali
 */
export async function GET(request: Request) {
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

    // Parsing dei parametri URL
    const { searchParams } = new URL(request.url)
    const dipendenteId = searchParams.get('dipendenteId') || undefined
    const sedeId = searchParams.get('sedeId') || undefined
    const tipoTurno = searchParams.get('tipoTurno') || undefined
    const dataInizio = searchParams.get('dataInizio') || undefined
    const dataFine = searchParams.get('dataFine') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Validazione filtri
    const filtriValidati = turniFiltriSchema.parse({
      dipendenteId,
      sedeId,
      tipoTurno,
      dataInizio,
      dataFine,
      page,
      limit
    })

    // Costruzione query Prisma
    const where: any = {
      dipendenti: {
        aziendaId: dbUser.aziendaId
      }
    }

    if (filtriValidati.dipendenteId) {
      where.dipendenteId = filtriValidati.dipendenteId
    }

    if (filtriValidati.sedeId) {
      where.sedeId = filtriValidati.sedeId
    }

    if (filtriValidati.tipoTurno) {
      where.tipoTurno = filtriValidati.tipoTurno
    }

    if (filtriValidati.dataInizio || filtriValidati.dataFine) {
      where.data = {}
      if (filtriValidati.dataInizio) {
        where.data.gte = parseLocalDate(filtriValidati.dataInizio)
      }
      if (filtriValidati.dataFine) {
        where.data.lte = parseLocalDate(filtriValidati.dataFine)
      }
    }

    // Conteggio totale per paginazione
    const total = await prisma.turni.count({ where })

    // Query turni con paginazione
    const turni = await prisma.turni.findMany({
      where,
      include: {
        dipendenti: {
          select: {
            id: true,
            nome: true,
            cognome: true
          }
        },
        sedi: {
          select: {
            id: true,
            nome: true
          }
        }
      },
      orderBy: [
        { data: 'desc' },
        { oraInizio: 'asc' }
      ],
      skip: (filtriValidati.page! - 1) * filtriValidati.limit!,
      take: filtriValidati.limit
    })

    return NextResponse.json({
      turni,
      pagination: {
        page: filtriValidati.page,
        limit: filtriValidati.limit,
        total,
        pages: Math.ceil(total / filtriValidati.limit!)
      }
    })

  } catch (error: any) {
    console.error('Errore GET /api/turni:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Parametri non validi', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Errore nel recupero dei turni' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/turni
 * Crea un nuovo turno
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
    const validatedData = turnoCreateSchema.parse(body)

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

    // Verifica sovrapposizioni turni per lo stesso dipendente nella stessa data
    const turniEsistenti = await prisma.turni.findMany({
      where: {
        dipendenteId: validatedData.dipendenteId,
        data: parseLocalDate(validatedData.data)
      }
    })

    // Controllo sovrapposizioni
    for (const turnoEsistente of turniEsistenti) {
      const conflitto = verificaSovrapposizioneTurni(
        validatedData.oraInizio,
        validatedData.oraFine,
        turnoEsistente.oraInizio,
        turnoEsistente.oraFine
      )

      if (conflitto) {
        return NextResponse.json(
          {
            error: 'Sovrapposizione turni',
            message: `Il dipendente ha già un turno dalle ${turnoEsistente.oraInizio} alle ${turnoEsistente.oraFine} che si sovrappone con quello che stai cercando di creare. Usa un turno SPEZZATO se vuoi coprire pranzo e sera.`
          },
          { status: 409 }
        )
      }
    }

    // Se esistono turni ma non si sovrappongono, log un warning
    // (Questo non blocca la creazione, ma è utile per analytics/monitoring)
    if (turniEsistenti.length > 0) {
      console.warn(`⚠️  Creazione turno multiplo per dipendente ${dipendente.nome} ${dipendente.cognome} in data ${validatedData.data}. Totale turni nella giornata: ${turniEsistenti.length + 1}`)
    }

    // Creazione turno
    const nuovoTurno = await prisma.turni.create({
      data: {
        data: parseLocalDate(validatedData.data),
        oraInizio: validatedData.oraInizio,
        oraFine: validatedData.oraFine,
        pausaPranzoInizio: validatedData.pausaPranzoInizio || null,
        pausaPranzoFine: validatedData.pausaPranzoFine || null,
        tipoTurno: validatedData.tipoTurno,
        dipendenteId: validatedData.dipendenteId,
        sedeId: (validatedData.sedeId && validatedData.sedeId !== 'none') ? validatedData.sedeId : null
      },
      include: {
        dipendenti: {
          select: {
            id: true,
            nome: true,
            cognome: true
          }
        },
        sedi: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    })

    // Activity logging
    const dipendenteNomeCompleto = `${dipendente.nome} ${dipendente.cognome}`
    await AttivitaLogger.logCreazioneTurno(nuovoTurno, dipendenteNomeCompleto, user.id, dbUser.aziendaId)

    // Auto-genera presenza da turno
    try {
      await PresenzeFromTurniService.generaPresenzaDaTurno(
        {
          ...nuovoTurno,
          dipendenti: {
            ...nuovoTurno.dipendenti,
            oreSettimanali: dipendente.oreSettimanali
          }
        },
        false // Non sovrascrivere se esiste già
      )
    } catch (presenzaError) {
      // Log error ma non bloccare la creazione del turno
      console.error('Errore auto-generazione presenza:', presenzaError)
    }

    return NextResponse.json(nuovoTurno, { status: 201 })

  } catch (error: any) {
    console.error('Errore POST /api/turni:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Errore nella creazione del turno' },
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

  // Sovrapposizione se:
  // - inizio1 è tra inizio2 e fine2
  // - fine1 è tra inizio2 e fine2
  // - inizio1 < inizio2 e fine1 > fine2 (turno1 contiene completamente turno2)
  return (
    (minuti1Start >= minuti2Start && minuti1Start < minuti2End) ||
    (minuti1End > minuti2Start && minuti1End <= minuti2End) ||
    (minuti1Start <= minuti2Start && minuti1End >= minuti2End)
  )
}
