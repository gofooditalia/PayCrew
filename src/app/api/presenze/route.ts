import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { presenzaSchema, presenzeFilterSchema } from '@/lib/validation/presenze-validator'
import { AttivitaLogger } from '@/lib/attivita-logger'
import { calcolaOreTraOrari } from '@/lib/utils/ore-calculator'

/**
 * GET /api/presenze
 * Lista presenze con filtri e paginazione
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Recupera l'azienda dell'utente
    const utente = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })

    if (!utente?.aziendaId) {
      return NextResponse.json({ error: 'Utente non associato ad un\'azienda' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filters = {
      dipendenteId: searchParams.get('dipendenteId') || undefined,
      sedeId: searchParams.get('sedeId') || undefined,
      stato: searchParams.get('stato') || undefined,
      dataInizio: searchParams.get('dataInizio') || undefined,
      dataFine: searchParams.get('dataFine') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50')
    }

    // Validazione filtri
    const validatedFilters = presenzeFilterSchema.parse(filters)

    // Costruisci query con filtri
    const where: any = {
      dipendenti: {
        aziendaId: utente.aziendaId
      }
    }

    if (validatedFilters.dipendenteId) {
      where.dipendenteId = validatedFilters.dipendenteId
    }

    if (validatedFilters.sedeId) {
      where.dipendenti = {
        ...where.dipendenti,
        sedeId: validatedFilters.sedeId
      }
    }

    if (validatedFilters.stato) {
      where.stato = validatedFilters.stato
    }

    if (validatedFilters.dataInizio || validatedFilters.dataFine) {
      where.data = {}
      if (validatedFilters.dataInizio) {
        where.data.gte = new Date(validatedFilters.dataInizio)
      }
      if (validatedFilters.dataFine) {
        where.data.lte = new Date(validatedFilters.dataFine)
      }
    }

    // Paginazione (Zod fornisce defaults ma TypeScript non lo sa)
    const page = validatedFilters.page ?? 1
    const limit = validatedFilters.limit ?? 10
    const skip = (page - 1) * limit
    const take = limit

    // Query presenze
    const [presenze, total] = await Promise.all([
      prisma.presenze.findMany({
        where,
        include: {
          dipendenti: {
            select: {
              id: true,
              nome: true,
              cognome: true,
              sedi: {
                select: {
                  id: true,
                  nome: true
                }
              }
            }
          }
        },
        orderBy: [
          { data: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take
      }),
      prisma.presenze.count({ where })
    ])

    return NextResponse.json({
      presenze,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Errore GET /api/presenze:', error)

    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Parametri non validi', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Errore durante il recupero delle presenze' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/presenze
 * Crea una nuova presenza con calcolo automatico ore
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Recupera l'azienda dell'utente
    const utente = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })

    if (!utente?.aziendaId) {
      return NextResponse.json({ error: 'Utente non associato ad un\'azienda' }, { status: 403 })
    }

    const body = await request.json()

    // Validazione input
    const validatedData = presenzaSchema.parse(body)

    // Verifica che il dipendente appartenga all'azienda dell'utente
    const dipendente = await prisma.dipendenti.findFirst({
      where: {
        id: validatedData.dipendenteId,
        aziendaId: utente.aziendaId
      }
    })

    if (!dipendente) {
      return NextResponse.json(
        { error: 'Dipendente non trovato o non autorizzato' },
        { status: 404 }
      )
    }

    // Calcola ore lavorate e straordinari se entrambi gli orari sono presenti
    let oreLavorate: number | null = null
    let oreStraordinario: number | null = null

    if (validatedData.entrata && validatedData.uscita) {
      // Calcola ore giornaliere da ore settimanali (assumendo 5 giorni lavorativi)
      const oreGiornaliere = Math.round((dipendente.oreSettimanali / 5) * 100) / 100

      // Calcola ore totali tra entrata e uscita
      const oreTotali = calcolaOreTraOrari(validatedData.entrata, validatedData.uscita)

      // Cerca turno associato per recuperare pausa pranzo
      const turnoAssociato = await prisma.turni.findFirst({
        where: {
          dipendenteId: validatedData.dipendenteId,
          data: new Date(validatedData.data)
        }
      })

      // Calcola pausa pranzo: usa quella del turno se presente, altrimenti fallback hardcoded
      let pausaPranzoOre = 0
      if (turnoAssociato && turnoAssociato.pausaPranzoInizio && turnoAssociato.pausaPranzoFine) {
        // Usa pausa pranzo dal turno
        pausaPranzoOre = calcolaOreTraOrari(turnoAssociato.pausaPranzoInizio, turnoAssociato.pausaPranzoFine)
      } else if (oreTotali >= 6) {
        // Fallback: pausa automatica di 30 minuti se lavora più di 6 ore
        pausaPranzoOre = 0.5
      }

      const oreLavorateNette = Math.max(0, oreTotali - pausaPranzoOre)

      // Calcola straordinari
      oreLavorate = Math.min(oreLavorateNette, oreGiornaliere || 8)
      oreStraordinario = Math.max(0, oreLavorateNette - (oreGiornaliere || 8))
    }

    // Crea la presenza
    const presenza = await prisma.presenze.create({
      data: {
        dipendenteId: validatedData.dipendenteId,
        data: new Date(validatedData.data),
        entrata: validatedData.entrata ? new Date(`${validatedData.data}T${validatedData.entrata}:00`) : null,
        uscita: validatedData.uscita ? new Date(`${validatedData.data}T${validatedData.uscita}:00`) : null,
        oreLavorate,
        oreStraordinario,
        nota: validatedData.nota || null
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

    // Log attività
    try {
      await AttivitaLogger.logRegistrazionePresenza(
        {
          id: presenza.id,
          dipendenteId: presenza.dipendenteId,
          data: presenza.data
        },
        `${presenza.dipendenti.nome} ${presenza.dipendenti.cognome}`,
        user.id,
        utente.aziendaId
      )
    } catch (logError) {
      console.error('Errore logging presenza:', logError)
      // Non bloccare l'operazione per errori di logging
    }

    return NextResponse.json(presenza, { status: 201 })
  } catch (error) {
    console.error('Errore POST /api/presenze:', error)

    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Errore durante la creazione della presenza' },
      { status: 500 }
    )
  }
}
