import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { orarioLavoroSchema, calcolaOreTotali } from '@/lib/validation/impostazioni-validator'

// GET - Ottieni singolo orario di lavoro
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

    const orarioLavoro = await prisma.orari_lavoro.findFirst({
      where: {
        id,
        aziendaId: dbUser.aziendaId,
      },
    })

    if (!orarioLavoro) {
      return NextResponse.json({ error: 'Orario di lavoro non trovato' }, { status: 404 })
    }

    return NextResponse.json({
      ...orarioLavoro,
      oreTotali: Number(orarioLavoro.oreTotali),
    })
  } catch (error) {
    console.error('Errore durante il recupero dell\'orario di lavoro:', error)
    return NextResponse.json(
      { error: 'Errore durante il recupero dell\'orario di lavoro' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna orario di lavoro
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

    // Verifica che l'orario appartenga all'azienda
    const existing = await prisma.orari_lavoro.findFirst({
      where: {
        id,
        aziendaId: dbUser.aziendaId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Orario di lavoro non trovato' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = orarioLavoroSchema.parse(body)

    // Calcola ore totali
    const oreTotali = calcolaOreTotali(
      validatedData.oraInizio,
      validatedData.oraFine,
      validatedData.pausaPranzoInizio || undefined,
      validatedData.pausaPranzoFine || undefined
    )

    const orarioLavoro = await prisma.orari_lavoro.update({
      where: { id },
      data: {
        nome: validatedData.nome,
        oraInizio: validatedData.oraInizio,
        oraFine: validatedData.oraFine,
        pausaPranzoInizio: validatedData.pausaPranzoInizio || null,
        pausaPranzoFine: validatedData.pausaPranzoFine || null,
        oreTotali,
        attivo: validatedData.attivo,
      },
    })

    return NextResponse.json({
      ...orarioLavoro,
      oreTotali: Number(orarioLavoro.oreTotali),
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Dati non validi', details: error }, { status: 400 })
    }

    console.error('Errore durante l\'aggiornamento dell\'orario di lavoro:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'aggiornamento dell\'orario di lavoro' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina orario di lavoro
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

    // Verifica che l'orario appartenga all'azienda
    const existing = await prisma.orari_lavoro.findFirst({
      where: {
        id,
        aziendaId: dbUser.aziendaId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Orario di lavoro non trovato' }, { status: 404 })
    }

    await prisma.orari_lavoro.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Orario di lavoro eliminato con successo' })
  } catch (error) {
    console.error('Errore durante l\'eliminazione dell\'orario di lavoro:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'eliminazione dell\'orario di lavoro' },
      { status: 500 }
    )
  }
}
