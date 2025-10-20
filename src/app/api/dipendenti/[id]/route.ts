import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

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

    const { id: dipendenteId } = await params

    // Get user's company to verify permissions
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })

    if (!userData?.aziendaId) {
      return NextResponse.json(
        { error: 'Utente non associato a un\'azienda' },
        { status: 403 }
      )
    }

    // Get employee details
    const dipendente = await prisma.dipendente.findFirst({
      where: { 
        id: dipendenteId,
        aziendaId: userData.aziendaId 
      },
      include: {
        sede: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    })

    if (!dipendente) {
      return NextResponse.json(
        { error: 'Dipendente non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json({ dipendente })

  } catch (error) {
    console.error('Errore durante il recupero del dipendente:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante il recupero del dipendente',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}

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

    const { id: dipendenteId } = await params

    // Get user's company to verify permissions
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })

    if (!userData?.aziendaId) {
      return NextResponse.json(
        { error: 'Utente non associato a un\'azienda' },
        { status: 403 }
      )
    }

    // Check if employee exists and belongs to user's company
    const existingDipendente = await prisma.dipendente.findFirst({
      where: { 
        id: dipendenteId,
        aziendaId: userData.aziendaId 
      }
    })

    if (!existingDipendente) {
      return NextResponse.json(
        { error: 'Dipendente non trovato' },
        { status: 404 }
      )
    }

    // Get update data from request
    const updateData = await request.json()

    // Update employee using Prisma
    const dipendente = await prisma.dipendente.update({
      where: { id: dipendenteId },
      data: {
        nome: updateData.nome,
        cognome: updateData.cognome,
        codiceFiscale: updateData.codiceFiscale,
        dataNascita: new Date(updateData.dataNascita),
        luogoNascita: updateData.luogoNascita || null,
        indirizzo: updateData.indirizzo || null,
        citta: updateData.citta || null,
        cap: updateData.cap || null,
        telefono: updateData.telefono || null,
        email: updateData.email || null,
        iban: updateData.iban || null,
        dataAssunzione: new Date(updateData.dataAssunzione),
        tipoContratto: updateData.tipoContratto,
        ccnl: updateData.ccnl,
        livello: updateData.livello,
        retribuzione: updateData.retribuzione,
        oreSettimanali: updateData.oreSettimanali || 40,
        sedeId: updateData.sedeId || null,
        attivo: updateData.attivo !== undefined ? updateData.attivo : true,
        dataCessazione: updateData.dataCessazione ? new Date(updateData.dataCessazione) : null,
      },
      include: {
        sede: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Dipendente aggiornato con successo',
      dipendente
    })

  } catch (error) {
    console.error('Errore durante l\'aggiornamento del dipendente:', error)
    
    // Handle unique constraint violation for codiceFiscale
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Codice fiscale già in uso' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Errore durante l\'aggiornamento del dipendente',
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

    const { id: dipendenteId } = await params

    // Get user's company to verify permissions
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })

    if (!userData?.aziendaId) {
      return NextResponse.json(
        { error: 'Utente non associato a un\'azienda' },
        { status: 403 }
      )
    }

    // Check if employee exists and belongs to user's company
    const existingDipendente = await prisma.dipendente.findFirst({
      where: { 
        id: dipendenteId,
        aziendaId: userData.aziendaId 
      }
    })

    if (!existingDipendente) {
      return NextResponse.json(
        { error: 'Dipendente non trovato' },
        { status: 404 }
      )
    }

    // Delete employee using Prisma
    await prisma.dipendente.delete({
      where: { id: dipendenteId }
    })

    return NextResponse.json({
      message: 'Dipendente eliminato con successo'
    })

  } catch (error) {
    console.error('Errore durante l\'eliminazione del dipendente:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante l\'eliminazione del dipendente',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}