import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { festivitaSchema } from '@/lib/validation/impostazioni-validator'

// GET - Ottieni tutte le festività dell'azienda
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true },
    })

    if (!dbUser?.aziendaId) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    // Opzionalmente filtra per anno dalla query string
    const { searchParams } = new URL(request.url)
    const anno = searchParams.get('anno')

    const where: any = { aziendaId: dbUser.aziendaId }

    if (anno) {
      const annoNum = parseInt(anno)
      where.data = {
        gte: new Date(`${annoNum}-01-01`),
        lte: new Date(`${annoNum}-12-31`),
      }
    }

    const festivita = await prisma.festivita.findMany({
      where,
      orderBy: { data: 'asc' },
    })

    // Converti Decimal a number
    const festivitaFormatted = festivita.map((festa) => ({
      ...festa,
      maggiorazione: Number(festa.maggiorazione),
    }))

    return NextResponse.json(festivitaFormatted)
  } catch (error) {
    console.error('Errore durante il recupero delle festività:', error)
    return NextResponse.json(
      { error: 'Errore durante il recupero delle festività' },
      { status: 500 }
    )
  }
}

// POST - Crea nuova festività
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true },
    })

    if (!dbUser?.aziendaId) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = festivitaSchema.parse(body)

    const festivita = await prisma.festivita.create({
      data: {
        nome: validatedData.nome,
        data: new Date(validatedData.data),
        ricorrente: validatedData.ricorrente,
        maggiorazione: validatedData.maggiorazione,
        aziendaId: dbUser.aziendaId,
      },
    })

    return NextResponse.json({
      ...festivita,
      maggiorazione: Number(festivita.maggiorazione),
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Dati non validi', details: error }, { status: 400 })
    }

    console.error('Errore durante la creazione della festività:', error)
    return NextResponse.json(
      { error: 'Errore durante la creazione della festività' },
      { status: 500 }
    )
  }
}
