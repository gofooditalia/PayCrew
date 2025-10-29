import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

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
    const tipoTurno = searchParams.get('tipoTurno') || ''

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
      where.sedeId = sedeId
    }

    if (tipoTurno) {
      where.tipoTurno = tipoTurno
    }

    const [turni, totalCount] = await Promise.all([
      prisma.turni.findMany({
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
          },
          sedi: {
            select: {
              id: true,
              nome: true
            }
          }
        },
        orderBy: { data: 'asc' },
        skip,
        take: limit
      }),
      prisma.turni.count({ where })
    ])

    return NextResponse.json({
      turni,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Errore durante il recupero dei turni:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante il recupero dei turni',
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

    // Get shift data from request
    const turnoData = await request.json()

    // Validate required fields
    const requiredFields = ['dipendenteId', 'data', 'oraInizio', 'oraFine', 'tipoTurno']
    const missingFields = requiredFields.filter(field => !turnoData[field])
    
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
        id: turnoData.dipendenteId,
        aziendaId: userData.aziendaId
      }
    })

    if (!dipendente) {
      return NextResponse.json(
        { error: 'Dipendente non trovato o non autorizzato' },
        { status: 404 }
      )
    }

    // Verify sede belongs to user's company (if provided)
    if (turnoData.sedeId) {
      const sede = await prisma.sedi.findFirst({
        where: {
          id: turnoData.sedeId,
          aziendaId: userData.aziendaId
        }
      })

      if (!sede) {
        return NextResponse.json(
          { error: 'Sede non trovata o non autorizzata' },
          { status: 404 }
        )
      }
    }

    // Check for overlapping shifts for the same employee
    const turnoInizio = new Date(`${turnoData.data}T${turnoData.oraInizio}`)
    const turnoFine = new Date(`${turnoData.data}T${turnoData.oraFine}`)
    
    // Handle overnight shifts
    if (turnoFine < turnoInizio) {
      turnoFine.setDate(turnoFine.getDate() + 1)
    }

    const overlappingTurni = await prisma.turni.findMany({
      where: {
        dipendenteId: turnoData.dipendenteId,
        data: new Date(turnoData.data),
        OR: [
          {
            AND: [
              { oraInizio: { lte: turnoData.oraInizio } },
              { oraFine: { gt: turnoData.oraInizio } }
            ]
          },
          {
            AND: [
              { oraInizio: { lt: turnoData.oraFine } },
              { oraFine: { gte: turnoData.oraFine } }
            ]
          },
          {
            AND: [
              { oraInizio: { gte: turnoData.oraInizio } },
              { oraFine: { lte: turnoData.oraFine } }
            ]
          }
        ]
      }
    })

    if (overlappingTurni.length > 0) {
      return NextResponse.json(
        { error: 'Esiste già un turno sovrapposto per questo dipendente' },
        { status: 409 }
      )
    }

    // Create new shift
    const turno = await prisma.turni.create({
      data: {
        id: crypto.randomUUID(),
        data: new Date(turnoData.data),
        oraInizio: turnoData.oraInizio,
        oraFine: turnoData.oraFine,
        tipoTurno: turnoData.tipoTurno,
        dipendenteId: turnoData.dipendenteId,
        sedeId: turnoData.sedeId || null,
        createdAt: new Date()
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
        },
        sedi: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Turno creato con successo',
      turno
    })

  } catch (error) {
    console.error('Errore durante la creazione del turno:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante la creazione del turno',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}