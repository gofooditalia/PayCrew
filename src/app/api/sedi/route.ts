import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Utente non autenticato' },
        { status: 401 }
      )
    }

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

    // Get company locations
    const sedi = await prisma.sedi.findMany({
      where: { aziendaId: userData.aziendaId },
      select: {
        id: true,
        nome: true,
        indirizzo: true,
        citta: true
      },
      orderBy: { nome: 'asc' }
    })

    return NextResponse.json({ sedi })

  } catch (error) {
    console.error('Errore durante il recupero delle sedi:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante il recupero delle sedi',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Utente non autenticato' },
        { status: 401 }
      )
    }

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

    // Get location data from request
    const sedeData = await request.json()

    // Create new location
    const sede = await prisma.sedi.create({
      data: {
        id: crypto.randomUUID(),
        nome: sedeData.nome,
        indirizzo: sedeData.indirizzo || null,
        citta: sedeData.citta || null,
        aziendaId: userData.aziendaId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'Sede creata con successo',
      sede
    })

  } catch (error) {
    console.error('Errore durante la creazione della sede:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante la creazione della sede',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}