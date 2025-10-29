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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const dipendenteId = searchParams.get('dipendenteId') || ''
    const dataDa = searchParams.get('dataDa') || ''
    const dataA = searchParams.get('dataA') || ''
    const sedeId = searchParams.get('sedeId') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      dipendenti: {
        aziendaId: userData.aziendaId
      }
    }

    if (dipendenteId) {
      where.dipendenteId = dipendenteId
    }

    if (dataDa || dataA) {
      where.data = {}
      if (dataDa) {
        where.data.gte = new Date(dataDa)
      }
      if (dataA) {
        where.data.lte = new Date(dataA)
      }
    }

    if (sedeId) {
      where.dipendenti.sedeId = sedeId
    }

    const [presenze, totalCount] = await Promise.all([
      prisma.presenze.findMany({
        where,
        include: {
          dipendenti: {
            select: {
              id: true,
              nome: true,
              cognome: true,
              sedi: {
                select: {
                  id: true,
                  nome: true
                }
              }
            }
          }
        },
        orderBy: { data: 'desc' },
        skip,
        take: limit
      }),
      prisma.presenze.count({ where })
    ])

    return NextResponse.json({
      presenze,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Errore durante il recupero delle presenze:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante il recupero delle presenze',
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

    // Get presence data from request
    const presenzaData = await request.json()

    // Validate required fields
    const requiredFields = ['dipendenteId', 'data']
    const missingFields = requiredFields.filter(field => !presenzaData[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Campi obbligatori mancanti',
          missingFields
        },
        { status: 400 }
      )
    }

    // Verify employee belongs to user's company
    const dipendente = await prisma.dipendenti.findFirst({
      where: {
        id: presenzaData.dipendenteId,
        aziendaId: userData.aziendaId
      }
    })

    if (!dipendente) {
      return NextResponse.json(
        { error: 'Dipendente non trovato o non autorizzato' },
        { status: 404 }
      )
    }

    // Check if presence already exists for this employee and date
    const existingPresenza = await prisma.presenze.findFirst({
      where: {
        dipendenteId: presenzaData.dipendenteId,
        data: new Date(presenzaData.data)
      }
    })

    if (existingPresenza) {
      return NextResponse.json(
        { error: 'Presenza già registrata per questa data' },
        { status: 409 }
      )
    }

    // Calculate worked hours if both entry and exit times are provided
    let oreLavorate = null
    let oreStraordinario = null

    if (presenzaData.entrata && presenzaData.uscita) {
      const entrata = new Date(`${presenzaData.data}T${presenzaData.entrata}`)
      const uscita = new Date(`${presenzaData.data}T${presenzaData.uscita}`)
      
      // Handle overnight shifts
      if (uscita < entrata) {
        uscita.setDate(uscita.getDate() + 1)
      }

      const diffMs = uscita.getTime() - entrata.getTime()
      const oreTotali = diffMs / (1000 * 60 * 60)
      
      oreLavorate = Math.round(oreTotali * 100) / 100

      // Calculate overtime (hours beyond weekly contract / 5 working days)
      const oreGiornaliereContratto = dipendente.oreSettimanali / 5
      if (oreLavorate > oreGiornaliereContratto) {
        oreStraordinario = Math.round((oreLavorate - oreGiornaliereContratto) * 100) / 100
      }
    }

    // Create new presence
    const presenza = await prisma.presenze.create({
      data: {
        id: crypto.randomUUID(),
        data: new Date(presenzaData.data),
        entrata: presenzaData.entrata ? new Date(`${presenzaData.data}T${presenzaData.entrata}`) : null,
        uscita: presenzaData.uscita ? new Date(`${presenzaData.data}T${presenzaData.uscita}`) : null,
        oreLavorate: oreLavorate,
        oreStraordinario: oreStraordinario,
        nota: presenzaData.nota || null,
        dipendenteId: presenzaData.dipendenteId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        dipendenti: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            sedi: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        }
      }
    })

    // Log dell'attività di registrazione presenza
    await AttivitaLogger.logRegistrazionePresenza(
      {
        id: presenza.id,
        dipendenteId: presenza.dipendenteId,
        data: presenza.data
      },
      `${dipendente.nome} ${dipendente.cognome}`,
      user.id,
      userData.aziendaId
    )

    return NextResponse.json({
      message: 'Presenza registrata con successo',
      presenza
    })

  } catch (error) {
    console.error('Errore durante la registrazione della presenza:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante la registrazione della presenza',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}