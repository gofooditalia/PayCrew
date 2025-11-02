import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Utente non autenticato' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get user's company to verify permissions
    const userData = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })

    if (!userData?.aziendaId) {
      return NextResponse.json(
        { error: 'Utente non associato a un\'azienda' },
        { status: 403 }
      )
    }

    // Verify sede belongs to user's company
    const sedeExists = await prisma.sedi.findFirst({
      where: {
        id,
        aziendaId: userData.aziendaId
      }
    })

    if (!sedeExists) {
      return NextResponse.json(
        { error: 'Sede non trovata o non autorizzato' },
        { status: 404 }
      )
    }

    // Get updated sede data from request
    const sedeData = await request.json()

    // Update sede
    const sede = await prisma.sedi.update({
      where: { id },
      data: {
        nome: sedeData.nome,
        indirizzo: sedeData.indirizzo || null,
        citta: sedeData.citta || null
      }
    })

    return NextResponse.json({
      message: 'Sede aggiornata con successo',
      sede
    })

  } catch (error) {
    console.error('Errore durante l\'aggiornamento della sede:', error)

    return NextResponse.json(
      {
        error: 'Errore durante l\'aggiornamento della sede',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Utente non autenticato' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get user's company to verify permissions
    const userData = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })

    if (!userData?.aziendaId) {
      return NextResponse.json(
        { error: 'Utente non associato a un\'azienda' },
        { status: 403 }
      )
    }

    // Verify sede belongs to user's company
    const sedeExists = await prisma.sedi.findFirst({
      where: {
        id,
        aziendaId: userData.aziendaId
      }
    })

    if (!sedeExists) {
      return NextResponse.json(
        { error: 'Sede non trovata o non autorizzato' },
        { status: 404 }
      )
    }

    // Check if sede has employees assigned
    const dipendentiCount = await prisma.dipendenti.count({
      where: { sedeId: id }
    })

    if (dipendentiCount > 0) {
      return NextResponse.json(
        {
          error: `Non è possibile eliminare la sede. Ci sono ${dipendentiCount} dipendenti assegnati a questa sede.`,
          dipendentiCount
        },
        { status: 400 }
      )
    }

    // Delete sede
    await prisma.sedi.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Sede eliminata con successo'
    })

  } catch (error) {
    console.error('Errore durante l\'eliminazione della sede:', error)

    return NextResponse.json(
      {
        error: 'Errore durante l\'eliminazione della sede',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}
