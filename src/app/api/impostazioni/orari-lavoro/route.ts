import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { orarioLavoroSchema, calcolaOreTotali } from '@/lib/validation/impostazioni-validator'

// GET - Ottieni tutti gli orari di lavoro dell'azienda
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Ottieni l'azienda dell'utente
    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true },
    })

    if (!dbUser?.aziendaId) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    const orariLavoro = await prisma.orari_lavoro.findMany({
      where: { aziendaId: dbUser.aziendaId },
      orderBy: { createdAt: 'desc' },
    })

    // Converti Decimal a number per la serializzazione JSON
    const orariFormatted = orariLavoro.map((orario) => ({
      ...orario,
      oreTotali: Number(orario.oreTotali),
    }))

    return NextResponse.json(orariFormatted)
  } catch (error) {
    console.error('Errore durante il recupero degli orari di lavoro:', error)
    return NextResponse.json(
      { error: 'Errore durante il recupero degli orari di lavoro' },
      { status: 500 }
    )
  }
}

// POST - Crea nuovo orario di lavoro
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Ottieni l'azienda dell'utente
    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true },
    })

    if (!dbUser?.aziendaId) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
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

    const orarioLavoro = await prisma.orari_lavoro.create({
      data: {
        nome: validatedData.nome,
        oraInizio: validatedData.oraInizio,
        oraFine: validatedData.oraFine,
        pausaPranzoInizio: validatedData.pausaPranzoInizio || null,
        pausaPranzoFine: validatedData.pausaPranzoFine || null,
        oreTotali,
        aziendaId: dbUser.aziendaId,
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

    console.error('Errore durante la creazione dell\'orario di lavoro:', error)
    return NextResponse.json(
      { error: 'Errore durante la creazione dell\'orario di lavoro' },
      { status: 500 }
    )
  }
}
