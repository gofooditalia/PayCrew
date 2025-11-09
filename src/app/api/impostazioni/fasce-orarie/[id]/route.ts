import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { fasciaOrariaSchema } from '@/lib/validation/impostazioni-validator'

// GET - Ottieni singola fascia oraria
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
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

    const fasciaOraria = await prisma.fasce_orarie.findFirst({
      where: {
        id,
        aziendaId: dbUser.aziendaId,
      },
    })

    if (!fasciaOraria) {
      return NextResponse.json({ error: 'Fascia oraria non trovata' }, { status: 404 })
    }

    return NextResponse.json({
      ...fasciaOraria,
      maggiorazione: Number(fasciaOraria.maggiorazione),
    })
  } catch (error) {
    console.error('Errore durante il recupero della fascia oraria:', error)
    return NextResponse.json(
      { error: 'Errore durante il recupero della fascia oraria' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna fascia oraria
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
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

    const existing = await prisma.fasce_orarie.findFirst({
      where: {
        id,
        aziendaId: dbUser.aziendaId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Fascia oraria non trovata' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = fasciaOrariaSchema.parse(body)

    const fasciaOraria = await prisma.fasce_orarie.update({
      where: { id },
      data: {
        nome: validatedData.nome,
        tipoTurno: validatedData.tipoTurno,
        oraInizio: validatedData.oraInizio,
        oraFine: validatedData.oraFine,
        maggiorazione: validatedData.maggiorazione,
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

    console.error('Errore durante l\'aggiornamento della fascia oraria:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'aggiornamento della fascia oraria' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina fascia oraria
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
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

    const existing = await prisma.fasce_orarie.findFirst({
      where: {
        id,
        aziendaId: dbUser.aziendaId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Fascia oraria non trovata' }, { status: 404 })
    }

    await prisma.fasce_orarie.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Fascia oraria eliminata con successo' })
  } catch (error) {
    console.error('Errore durante l\'eliminazione della fascia oraria:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'eliminazione della fascia oraria' },
      { status: 500 }
    )
  }
}
