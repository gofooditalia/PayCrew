import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { prestazioneSchema, calcolaImportoPrestazione } from '@/lib/validation/collaboratori-validator'

// GET - Lista prestazioni con filtri
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const userData = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })

    if (!userData?.aziendaId) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const collaboratoreId = searchParams.get('collaboratoreId') || ''
    const tipo = searchParams.get('tipo') || ''
    const statoPagamento = searchParams.get('statoPagamento') || ''
    const dataInizio = searchParams.get('dataInizio') || ''
    const dataFine = searchParams.get('dataFine') || ''

    const where: any = {
      aziendaId: userData.aziendaId,
    }

    if (collaboratoreId) {
      where.collaboratoreId = collaboratoreId
    }

    if (tipo) {
      where.tipo = tipo
    }

    if (statoPagamento) {
      where.statoPagamento = statoPagamento
    }

    if (dataInizio || dataFine) {
      where.dataInizio = {}
      if (dataInizio) {
        where.dataInizio.gte = new Date(dataInizio)
      }
      if (dataFine) {
        where.dataInizio.lte = new Date(dataFine)
      }
    }

    const skip = (page - 1) * limit

    const [prestazioni, total] = await Promise.all([
      prisma.prestazioni.findMany({
        where,
        include: {
          collaboratori: {
            select: {
              id: true,
              nome: true,
              cognome: true,
              tipo: true,
            }
          }
        },
        orderBy: { dataInizio: 'desc' },
        skip,
        take: limit,
      }),
      prisma.prestazioni.count({ where }),
    ])

    // Converti Decimal a Number
    const prestazioniFormatted = prestazioni.map(p => ({
      ...p,
      oreLavorate: p.oreLavorate ? Number(p.oreLavorate) : null,
      tariffaOraria: p.tariffaOraria ? Number(p.tariffaOraria) : null,
      compensoFisso: p.compensoFisso ? Number(p.compensoFisso) : null,
      importoTotale: Number(p.importoTotale),
    }))

    return NextResponse.json({
      prestazioni: prestazioniFormatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Errore GET /api/prestazioni:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

// POST - Crea prestazione
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const userData = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })

    if (!userData?.aziendaId) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    const body = await request.json()

    // Calcola importo automaticamente se non fornito
    if (!body.importoTotale) {
      body.importoTotale = calcolaImportoPrestazione(
        body.tipo,
        body.oreLavorate,
        body.tariffaOraria,
        body.compensoFisso
      )
    }

    // Validazione
    const validated = prestazioneSchema.parse(body)

    // Verifica che il collaboratore esista e appartenga all'azienda
    const collaboratore = await prisma.collaboratori.findFirst({
      where: {
        id: validated.collaboratoreId,
        aziendaId: userData.aziendaId,
      }
    })

    if (!collaboratore) {
      return NextResponse.json(
        { error: 'Collaboratore non trovato o non autorizzato' },
        { status: 404 }
      )
    }

    // Converti stringhe date in Date objects
    const dataToCreate = {
      ...validated,
      dataInizio: new Date(validated.dataInizio),
      dataFine: validated.dataFine ? new Date(validated.dataFine) : null,
      dataPagamento: validated.dataPagamento ? new Date(validated.dataPagamento) : null,
      aziendaId: userData.aziendaId,
    }

    const nuovaPrestazione = await prisma.prestazioni.create({
      data: dataToCreate,
      include: {
        collaboratori: {
          select: {
            nome: true,
            cognome: true,
            tipo: true,
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Prestazione creata con successo',
      prestazione: {
        ...nuovaPrestazione,
        oreLavorate: nuovaPrestazione.oreLavorate ? Number(nuovaPrestazione.oreLavorate) : null,
        tariffaOraria: nuovaPrestazione.tariffaOraria ? Number(nuovaPrestazione.tariffaOraria) : null,
        compensoFisso: nuovaPrestazione.compensoFisso ? Number(nuovaPrestazione.compensoFisso) : null,
        importoTotale: Number(nuovaPrestazione.importoTotale),
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Errore POST /api/prestazioni:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
