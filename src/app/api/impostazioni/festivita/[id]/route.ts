import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { festivitaSchema } from '@/lib/validation/impostazioni-validator'

// GET - Ottieni singola festività
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

    const festivita = await prisma.festivita.findFirst({
      where: {
        id,
        aziendaId: dbUser.aziendaId,
      },
    })

    if (!festivita) {
      return NextResponse.json({ error: 'Festività non trovata' }, { status: 404 })
    }

    return NextResponse.json({
      ...festivita,
      maggiorazione: Number(festivita.maggiorazione),
    })
  } catch (error) {
    console.error('Errore durante il recupero della festività:', error)
    return NextResponse.json(
      { error: 'Errore durante il recupero della festività' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna festività
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

    const existing = await prisma.festivita.findFirst({
      where: {
        id,
        aziendaId: dbUser.aziendaId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Festività non trovata' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = festivitaSchema.parse(body)

    const festivita = await prisma.festivita.update({
      where: { id },
      data: {
        nome: validatedData.nome,
        data: new Date(validatedData.data),
        ricorrente: validatedData.ricorrente,
        maggiorazione: validatedData.maggiorazione,
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

    console.error('Errore durante l\'aggiornamento della festività:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'aggiornamento della festività' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina festività
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

    const existing = await prisma.festivita.findFirst({
      where: {
        id,
        aziendaId: dbUser.aziendaId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Festività non trovata' }, { status: 404 })
    }

    await prisma.festivita.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Festività eliminata con successo' })
  } catch (error) {
    console.error('Errore durante l\'eliminazione della festività:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'eliminazione della festività' },
      { status: 500 }
    )
  }
}
