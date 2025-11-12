import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

// GET /api/pagamenti/[id] - Get a specific pagamento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id } = await params

    // Get user's company
    const userData = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })

    if (!userData?.aziendaId) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    const pagamento = await prisma.pagamenti_dipendenti.findFirst({
      where: {
        id,
        aziendaId: userData.aziendaId
      },
      include: {
        dipendenti: {
          select: {
            id: true,
            nome: true,
            cognome: true
          }
        }
      }
    })

    if (!pagamento) {
      return NextResponse.json({ error: 'Pagamento non trovato' }, { status: 404 })
    }

    // Convert Decimal to number
    const serializedPagamento = {
      ...pagamento,
      importo: Number(pagamento.importo)
    }

    return NextResponse.json(serializedPagamento)
  } catch (error) {
    console.error('Error fetching pagamento:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero del pagamento' },
      { status: 500 }
    )
  }
}

// PUT /api/pagamenti/[id] - Update a pagamento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id } = await params

    // Get user's company
    const userData = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })

    if (!userData?.aziendaId) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    // Verify pagamento belongs to user's company
    const existingPagamento = await prisma.pagamenti_dipendenti.findFirst({
      where: {
        id,
        aziendaId: userData.aziendaId
      }
    })

    if (!existingPagamento) {
      return NextResponse.json({ error: 'Pagamento non trovato' }, { status: 404 })
    }

    const body = await request.json()
    const { importo, tipoPagamento, dataPagamento, note } = body

    // Update pagamento
    const updatedPagamento = await prisma.pagamenti_dipendenti.update({
      where: { id },
      data: {
        ...(importo !== undefined && { importo: parseFloat(importo) }),
        ...(tipoPagamento && { tipoPagamento }),
        ...(dataPagamento && { dataPagamento: new Date(dataPagamento) }),
        ...(note !== undefined && { note: note || null })
      },
      include: {
        dipendenti: {
          select: {
            id: true,
            nome: true,
            cognome: true
          }
        }
      }
    })

    // Convert Decimal to number
    const serializedPagamento = {
      ...updatedPagamento,
      importo: Number(updatedPagamento.importo)
    }

    return NextResponse.json(serializedPagamento)
  } catch (error) {
    console.error('Error updating pagamento:', error)
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento del pagamento' },
      { status: 500 }
    )
  }
}

// DELETE /api/pagamenti/[id] - Delete a pagamento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { id } = await params

    // Get user's company
    const userData = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })

    if (!userData?.aziendaId) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    // Verify pagamento belongs to user's company
    const existingPagamento = await prisma.pagamenti_dipendenti.findFirst({
      where: {
        id,
        aziendaId: userData.aziendaId
      }
    })

    if (!existingPagamento) {
      return NextResponse.json({ error: 'Pagamento non trovato' }, { status: 404 })
    }

    // Delete pagamento
    await prisma.pagamenti_dipendenti.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Pagamento eliminato con successo' })
  } catch (error) {
    console.error('Error deleting pagamento:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione del pagamento' },
      { status: 500 }
    )
  }
}
