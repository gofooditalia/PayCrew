import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { AttivitaLogger } from '@/lib/attivita-logger'

export async function GET(request: NextRequest) {
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

    // Get company employees with optional filtering
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const sedeId = searchParams.get('sedeId') || ''

    const skip = (page - 1) * limit

    const where: {
      aziendaId: string
      OR?: Array<{
        [key in 'nome' | 'cognome' | 'codiceFiscale' | 'email']?: {
          contains: string
          mode: 'insensitive'
        }
      }>
      sedeId?: string
    } = {
      aziendaId: userData.aziendaId
    }

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { cognome: { contains: search, mode: 'insensitive' } },
        { codiceFiscale: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (sedeId) {
      where.sedeId = sedeId
    }

    const [dipendenti, totalCount] = await Promise.all([
      prisma.dipendenti.findMany({
        where,
        include: {
          sedi: {
            select: {
              id: true,
              nome: true
            }
          }
        },
        orderBy: { cognome: 'asc' },
        skip,
        take: limit
      }),
      prisma.dipendenti.count({ where })
    ])

    return NextResponse.json({
      dipendenti,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Errore durante il recupero dei dipendenti:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante il recupero dei dipendenti',
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

    // Get employee data from request
    const dipendenteData = await request.json()

    // Validate required fields
    const requiredFields = ['nome', 'cognome', 'codiceFiscale', 'dataNascita', 'dataAssunzione', 'tipoContratto', 'ccnl', 'livello', 'retribuzione']
    const missingFields = requiredFields.filter(field => !dipendenteData[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Campi obbligatori mancanti',
          missingFields
        },
        { status: 400 }
      )
    }

    // Check if codiceFiscale already exists for this company
    const existingDipendente = await prisma.dipendenti.findFirst({
      where: {
        codiceFiscale: dipendenteData.codiceFiscale,
        aziendaId: userData.aziendaId
      }
    })

    if (existingDipendente) {
      return NextResponse.json(
        { error: 'Codice fiscale già in uso per questa azienda' },
        { status: 409 }
      )
    }

    // Create new employee using Prisma with proper type conversion
    const dipendente = await prisma.dipendenti.create({
      data: {
        id: crypto.randomUUID(),
        nome: dipendenteData.nome,
        cognome: dipendenteData.cognome,
        codiceFiscale: dipendenteData.codiceFiscale,
        dataNascita: new Date(dipendenteData.dataNascita),
        luogoNascita: dipendenteData.luogoNascita || null,
        indirizzo: dipendenteData.indirizzo || null,
        citta: dipendenteData.citta || null,
        cap: dipendenteData.cap || null,
        telefono: dipendenteData.telefono || null,
        email: dipendenteData.email || null,
        iban: dipendenteData.iban || null,
        dataAssunzione: new Date(dipendenteData.dataAssunzione),
        tipoContratto: dipendenteData.tipoContratto,
        ccnl: dipendenteData.ccnl,
        livello: dipendenteData.livello,
        retribuzione: parseFloat(dipendenteData.retribuzione),
        oreSettimanali: parseInt(dipendenteData.oreSettimanali) || 40,
        sedeId: dipendenteData.sedeId || null,
        attivo: dipendenteData.attivo !== undefined ? dipendenteData.attivo : true,
        aziendaId: userData.aziendaId,
        createdAt: new Date(),
        updatedAt: new Date()
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

    // Log dell'attività di creazione dipendente
    console.log('API Dipendenti - Inizio logging attività per:', dipendente.nome, dipendente.cognome);
    await AttivitaLogger.logCreazioneDipendente(dipendente, user.id, userData.aziendaId)
    console.log('API Dipendenti - Logging attività completato');

    return NextResponse.json({
      message: 'Dipendente creato con successo',
      dipendente
    })

  } catch (error) {
    console.error('Errore durante la creazione del dipendente:', error)
    
    // Handle unique constraint violation for codiceFiscale
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Codice fiscale già in uso' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Errore durante la creazione del dipendente',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}