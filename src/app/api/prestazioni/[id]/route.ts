import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { prestazioneSchema, calcolaImportoPrestazione } from '@/lib/validation/collaboratori-validator'

// GET - Singola prestazione
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

    const prestazione = await prisma.prestazioni.findFirst({
      where: {
        id,
        aziendaId: userData.aziendaId,
      },
      include: {
        collaboratori: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            tipo: true,
            codiceFiscale: true,
          }
        }
      }
    })

    if (!prestazione) {
      return NextResponse.json({ error: 'Prestazione non trovata' }, { status: 404 })
    }

    // Converti Decimal a Number
    const prestazioneFormatted = {
      ...prestazione,
      oreLavorate: prestazione.oreLavorate ? Number(prestazione.oreLavorate) : null,
      tariffaOraria: prestazione.tariffaOraria ? Number(prestazione.tariffaOraria) : null,
      compensoFisso: prestazione.compensoFisso ? Number(prestazione.compensoFisso) : null,
      importoTotale: Number(prestazione.importoTotale),
    }

    return NextResponse.json({ prestazione: prestazioneFormatted })
  } catch (error) {
    console.error('Errore GET /api/prestazioni/[id]:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

// PUT - Aggiorna prestazione
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

    // Ricalcola importo se necessario
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

    // Verifica che la prestazione esista e appartenga all'azienda
    const existing = await prisma.prestazioni.findFirst({
      where: {
        id,
        aziendaId: userData.aziendaId,
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Prestazione non trovata' }, { status: 404 })
    }

    // Converti stringhe date in Date objects
    const dataToUpdate = {
      ...validated,
      dataInizio: new Date(validated.dataInizio),
      dataFine: validated.dataFine ? new Date(validated.dataFine) : null,
      dataPagamento: validated.dataPagamento ? new Date(validated.dataPagamento) : null,
    }

    const updated = await prisma.prestazioni.update({
      where: { id },
      data: dataToUpdate,
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
      message: 'Prestazione aggiornata con successo',
      prestazione: {
        ...updated,
        oreLavorate: updated.oreLavorate ? Number(updated.oreLavorate) : null,
        tariffaOraria: updated.tariffaOraria ? Number(updated.tariffaOraria) : null,
        compensoFisso: updated.compensoFisso ? Number(updated.compensoFisso) : null,
        importoTotale: Number(updated.importoTotale),
      }
    })
  } catch (error: any) {
    console.error('Errore PUT /api/prestazioni/[id]:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

// DELETE - Elimina prestazione
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

    // Verifica che la prestazione esista e appartenga all'azienda
    const existing = await prisma.prestazioni.findFirst({
      where: {
        id,
        aziendaId: userData.aziendaId,
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Prestazione non trovata' }, { status: 404 })
    }

    // Verifica se è già stata pagata (opzionale - puoi commentare questa parte)
    if (existing.statoPagamento === 'PAGATO') {
      return NextResponse.json(
        { error: 'Impossibile eliminare una prestazione già pagata' },
        { status: 409 }
      )
    }

    await prisma.prestazioni.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Prestazione eliminata con successo'
    })
  } catch (error) {
    console.error('Errore DELETE /api/prestazioni/[id]:', error)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
