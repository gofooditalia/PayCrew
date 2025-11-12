import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { AttivitaLogger } from '@/lib/attivita-logger'

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

    // Get employee details
    const dipendente = await prisma.dipendenti.findFirst({
      where: { 
        id: dipendenteId,
        aziendaId: userData.aziendaId 
      },
      include: {
        sedi: {
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

    // Map sedi to sede for frontend compatibility
    const { sedi, ...dipendenteData } = dipendente
    const responseData = {
      ...dipendenteData,
      sede: sedi
    }

    return NextResponse.json({ dipendente: responseData })

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

    // Check if employee exists and belongs to user's company
    const existingDipendente = await prisma.dipendenti.findFirst({
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

    // Update employee using Prisma with proper type conversion
    const dipendente = await prisma.dipendenti.update({
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
        dataScadenzaContratto: updateData.dataScadenzaContratto ? new Date(updateData.dataScadenzaContratto) : null,
        tipoContratto: updateData.tipoContratto,
        ccnl: updateData.ccnl,
        note: updateData.note || null,
        qualifica: updateData.qualifica || null,
        retribuzione: parseFloat(updateData.retribuzione),
        retribuzioneNetta: updateData.retribuzioneNetta ? parseFloat(updateData.retribuzioneNetta) : null,
        oreSettimanali: parseInt(updateData.oreSettimanali) || 40,
        sedeId: updateData.sedeId || null,
        attivo: updateData.attivo !== undefined ? updateData.attivo : true,
        dataCessazione: updateData.dataCessazione ? new Date(updateData.dataCessazione) : null,
      },
      include: {
        sedi: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    })

    // Log dell'attività di modifica dipendente
    await AttivitaLogger.logModificaDipendente(dipendente, user.id, userData.aziendaId)

    // Map sedi to sede for frontend compatibility
    const { sedi, ...dipendenteData } = dipendente
    const responseData = {
      ...dipendenteData,
      sede: sedi
    }

    return NextResponse.json({
      message: 'Dipendente aggiornato con successo',
      dipendente: responseData
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

    // Check if employee exists and belongs to user's company
    const existingDipendente = await prisma.dipendenti.findFirst({
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

    // Store employee name before deletion for logging
    const dipendenteNome = `${existingDipendente.nome} ${existingDipendente.cognome}`

    // Delete employee using Prisma
    await prisma.dipendenti.delete({
      where: { id: dipendenteId }
    })

    // Log dell'attività di eliminazione dipendente
    await AttivitaLogger.logEliminazioneDipendente(dipendenteId, dipendenteNome, user.id, userData.aziendaId)

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