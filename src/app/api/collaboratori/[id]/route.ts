import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { collaboratoreSchema } from '@/lib/validation/collaboratori-validator'

// GET - Singolo collaboratore
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const collaboratore = await prisma.collaboratori.findFirst({
      where: {
        id,
        aziendaId: userData.aziendaId,
      },
      include: {
        prestazioni: {
          orderBy: { dataInizio: 'desc' },
        },
        _count: {
          select: { prestazioni: true }
        }
      }
    })

    if (!collaboratore) {
      return NextResponse.json({ error: 'Collaboratore non trovato' }, { status: 404 })
    }

    // Converti Decimal a Number
    const collaboratoreFormatted = {
      ...collaboratore,
      tariffaOraria: collaboratore.tariffaOraria ? Number(collaboratore.tariffaOraria) : null,
      prestazioni: collaboratore.prestazioni.map(p => ({
        ...p,
        oreLavorate: p.oreLavorate ? Number(p.oreLavorate) : null,
        tariffaOraria: p.tariffaOraria ? Number(p.tariffaOraria) : null,
        compensoFisso: p.compensoFisso ? Number(p.compensoFisso) : null,
        importoTotale: Number(p.importoTotale),
      })),
    }

    return NextResponse.json({ collaboratore: collaboratoreFormatted })
  } catch (error) {
    console.error('Errore GET /api/collaboratori/[id]:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

// PUT - Aggiorna collaboratore
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Verifica che il collaboratore esista e appartenga all'azienda
    const existing = await prisma.collaboratori.findFirst({
      where: {
        id,
        aziendaId: userData.aziendaId,
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Collaboratore non trovato' }, { status: 404 })
    }

    // Verifica duplicati CF (escluso se stesso)
    const duplicate = await prisma.collaboratori.findFirst({
      where: {
        codiceFiscale: validated.codiceFiscale,
        aziendaId: userData.aziendaId,
        NOT: { id },
      }
    })

    if (duplicate) {
      return NextResponse.json(
        { error: 'Esiste già un collaboratore con questo codice fiscale' },
        { status: 409 }
      )
    }

    const updated = await prisma.collaboratori.update({
      where: { id },
      data: validated,
      include: {
        _count: {
          select: { prestazioni: true }
        }
      }
    })

    return NextResponse.json({
      message: 'Collaboratore aggiornato con successo',
      collaboratore: {
        ...updated,
        tariffaOraria: updated.tariffaOraria ? Number(updated.tariffaOraria) : null,
      }
    })
  } catch (error: any) {
    console.error('Errore PUT /api/collaboratori/[id]:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

// DELETE - Elimina collaboratore
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Verifica che il collaboratore esista e appartenga all'azienda
    const existing = await prisma.collaboratori.findFirst({
      where: {
        id,
        aziendaId: userData.aziendaId,
      },
      include: {
        _count: {
          select: { prestazioni: true }
        }
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Collaboratore non trovato' }, { status: 404 })
    }

    // Verifica se ha prestazioni
    if (existing._count.prestazioni > 0) {
      return NextResponse.json(
        { error: `Impossibile eliminare: il collaboratore ha ${existing._count.prestazioni} prestazioni associate` },
        { status: 409 }
      )
    }

    await prisma.collaboratori.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Collaboratore eliminato con successo'
    })
  } catch (error) {
    console.error('Errore DELETE /api/collaboratori/[id]:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
