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

    const { id: aziendaId } = await params

    // Check if user has permission to update this company
    const userData = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true, role: true }
    })

    if (!userData?.aziendaId || userData.aziendaId !== aziendaId) {
      return NextResponse.json(
        { error: 'Non hai i permessi per modificare questa azienda' },
        { status: 403 }
      )
    }

    // Get update data from request
    const updateData = await request.json()

    // Update company using Prisma
    const azienda = await prisma.aziende.update({
      where: { id: aziendaId },
      data: {
        nome: updateData.nome,
        partitaIva: updateData.partitaIva,
        codiceFiscale: updateData.codiceFiscale || null,
        indirizzo: updateData.indirizzo || null,
        citta: updateData.citta || null,
        cap: updateData.cap || null,
        email: updateData.email || null,
        telefono: updateData.telefono || null,
      }
    })

    return NextResponse.json({
      message: 'Azienda aggiornata con successo',
      azienda
    })

  } catch (error) {
    console.error('Errore durante l\'aggiornamento dell\'azienda:', error)
    
    // Handle unique constraint violation for partitaIva
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Partita IVA già in uso' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Errore durante l\'aggiornamento dell\'azienda',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}

export async function GET(
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

    const { id: aziendaId } = await params

    // Check if user has permission to view this company
    const userData = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })

    if (!userData?.aziendaId || userData.aziendaId !== aziendaId) {
      return NextResponse.json(
        { error: 'Non hai i permessi per visualizzare questa azienda' },
        { status: 403 }
      )
    }

    // Get company details
    const azienda = await prisma.aziende.findUnique({
      where: { id: aziendaId },
      select: {
        id: true,
        nome: true,
        partitaIva: true,
        codiceFiscale: true,
        indirizzo: true,
        citta: true,
        cap: true,
        email: true,
        telefono: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!azienda) {
      return NextResponse.json(
        { error: 'Azienda non trovata' },
        { status: 404 }
      )
    }

    return NextResponse.json({ azienda })

  } catch (error) {
    console.error('Errore durante il recupero dell\'azienda:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante il recupero dell\'azienda',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}