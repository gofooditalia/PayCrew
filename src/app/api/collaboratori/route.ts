import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { collaboratoreSchema } from '@/lib/validation/collaboratori-validator'

// GET - Lista collaboratori con filtri
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
    const search = searchParams.get('search') || ''
    const tipo = searchParams.get('tipo') || ''
    const attivo = searchParams.get('attivo')

    const where: any = {
      aziendaId: userData.aziendaId,
    }

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { cognome: { contains: search, mode: 'insensitive' } },
        { codiceFiscale: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (tipo) {
      where.tipo = tipo
    }

    if (attivo !== null && attivo !== '') {
      where.attivo = attivo === 'true'
    }

    const skip = (page - 1) * limit

    const [collaboratori, total] = await Promise.all([
      prisma.collaboratori.findMany({
        where,
        include: {
          prestazioni: {
            select: {
              id: true,
              importoTotale: true,
              statoPagamento: true,
            }
          },
          _count: {
            select: {
              prestazioni: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.collaboratori.count({ where }),
    ])

    // Converti Decimal a Number
    const collaboratoriFormatted = collaboratori.map(c => ({
      ...c,
      tariffaOraria: c.tariffaOraria ? Number(c.tariffaOraria) : null,
      prestazioni: c.prestazioni.map(p => ({
        ...p,
        importoTotale: Number(p.importoTotale),
      })),
    }))

    return NextResponse.json({
      collaboratori: collaboratoriFormatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Errore GET /api/collaboratori:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

// POST - Crea collaboratore
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

    // Validazione
    const validated = collaboratoreSchema.parse(body)

    // Verifica duplicati (stesso CF nella stessa azienda)
    const existing = await prisma.collaboratori.findFirst({
      where: {
        codiceFiscale: validated.codiceFiscale,
        aziendaId: userData.aziendaId,
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Collaboratore con questo codice fiscale già esistente' },
        { status: 409 }
      )
    }

    const nuovoCollaboratore = await prisma.collaboratori.create({
      data: {
        ...validated,
        aziendaId: userData.aziendaId,
      },
      include: {
        _count: {
          select: { prestazioni: true }
        }
      }
    })

    return NextResponse.json({
      message: 'Collaboratore creato con successo',
      collaboratore: {
        ...nuovoCollaboratore,
        tariffaOraria: nuovoCollaboratore.tariffaOraria
          ? Number(nuovoCollaboratore.tariffaOraria)
          : null,
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Errore POST /api/collaboratori:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
