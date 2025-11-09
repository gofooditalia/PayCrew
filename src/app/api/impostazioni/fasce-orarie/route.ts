import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { fasciaOrariaSchema } from '@/lib/validation/impostazioni-validator'

// GET - Ottieni tutte le fasce orarie dell'azienda
export async function GET() {
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

    const fasceOrarie = await prisma.fasce_orarie.findMany({
      where: { aziendaId: dbUser.aziendaId },
      orderBy: { tipoTurno: 'asc' },
    })

    // Converti Decimal a number
    const fasceFormatted = fasceOrarie.map((fascia) => ({
      ...fascia,
      maggiorazione: Number(fascia.maggiorazione),
    }))

    return NextResponse.json(fasceFormatted)
  } catch (error) {
    console.error('Errore durante il recupero delle fasce orarie:', error)
    return NextResponse.json(
      { error: 'Errore durante il recupero delle fasce orarie' },
      { status: 500 }
    )
  }
}

// POST - Crea nuova fascia oraria
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
    const validatedData = fasciaOrariaSchema.parse(body)

    const fasciaOraria = await prisma.fasce_orarie.create({
      data: {
        nome: validatedData.nome,
        tipoTurno: validatedData.tipoTurno,
        oraInizio: validatedData.oraInizio,
        oraFine: validatedData.oraFine,
        maggiorazione: validatedData.maggiorazione,
        aziendaId: dbUser.aziendaId,
        attivo: validatedData.attivo,
      },
    })

    return NextResponse.json({
      ...fasciaOraria,
      maggiorazione: Number(fasciaOraria.maggiorazione),
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Dati non validi', details: error }, { status: 400 })
    }

    console.error('Errore durante la creazione della fascia oraria:', error)
    return NextResponse.json(
      { error: 'Errore durante la creazione della fascia oraria' },
      { status: 500 }
    )
  }
}
