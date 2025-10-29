import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { AttivitaLogger } from '@/lib/attivita-logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Get presence with employee verification
    const presenza = await prisma.presenze.findFirst({
      where: {
        id,
        dipendenti: {
          aziendaId: userData.aziendaId
        }
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

    if (!presenza) {
      return NextResponse.json(
        { error: 'Presenza non trovata' },
        { status: 404 }
      )
    }

    return NextResponse.json(presenza)

  } catch (error) {
    console.error('Errore durante il recupero della presenza:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante il recupero della presenza',
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
    const { id } = await params
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

    // Check if presence exists and belongs to user's company
    const existingPresenza = await prisma.presenze.findFirst({
      where: {
        id,
        dipendenti: {
          aziendaId: userData.aziendaId
        }
      },
      include: {
        dipendenti: true
      }
    })

    if (!existingPresenza) {
      return NextResponse.json(
        { error: 'Presenza non trovata o non autorizzata' },
        { status: 404 }
      )
    }

    // Get update data from request
    const updateData = await request.json()

    // Calculate worked hours if both entry and exit times are provided
    let oreLavorate = updateData.oreLavorate
    let oreStraordinario = updateData.oreStraordinario

    if (updateData.entrata && updateData.uscita) {
      const entrata = new Date(`${existingPresenza.data.toISOString().split('T')[0]}T${updateData.entrata}`)
      const uscita = new Date(`${existingPresenza.data.toISOString().split('T')[0]}T${updateData.uscita}`)
      
      // Handle overnight shifts
      if (uscita < entrata) {
        uscita.setDate(uscita.getDate() + 1)
      }

      const diffMs = uscita.getTime() - entrata.getTime()
      const oreTotali = diffMs / (1000 * 60 * 60)
      
      oreLavorate = Math.round(oreTotali * 100) / 100

      // Calculate overtime (hours beyond weekly contract / 5 working days)
      const oreGiornaliereContratto = existingPresenza.dipendenti.oreSettimanali / 5
      if (oreLavorate > oreGiornaliereContratto) {
        oreStraordinario = Math.round((oreLavorate - oreGiornaliereContratto) * 100) / 100
      } else {
        oreStraordinario = 0
      }
    }

    // Update presence
    const presenza = await prisma.presenze.update({
      where: { id },
      data: {
        entrata: updateData.entrata ? new Date(`${existingPresenza.data.toISOString().split('T')[0]}T${updateData.entrata}`) : null,
        uscita: updateData.uscita ? new Date(`${existingPresenza.data.toISOString().split('T')[0]}T${updateData.uscita}`) : null,
        oreLavorate: oreLavorate,
        oreStraordinario: oreStraordinario,
        nota: updateData.nota !== undefined ? updateData.nota : existingPresenza.nota,
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

    // Log dell'attività di modifica presenza
    await AttivitaLogger.logModificaPresenza(
      {
        id: presenza.id,
        dipendenteId: presenza.dipendenteId,
        data: presenza.data
      },
      `${presenza.dipendenti.nome} ${presenza.dipendenti.cognome}`,
      user.id,
      userData.aziendaId
    )

    return NextResponse.json({
      message: 'Presenza aggiornata con successo',
      presenza
    })

  } catch (error) {
    console.error('Errore durante l\'aggiornamento della presenza:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante l\'aggiornamento della presenza',
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
    const { id } = await params
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

    // Check if presence exists and belongs to user's company
    const existingPresenza = await prisma.presenze.findFirst({
      where: {
        id,
        dipendenti: {
          aziendaId: userData.aziendaId
        }
      },
      include: {
        dipendenti: {
          select: {
            nome: true,
            cognome: true
          }
        }
      }
    })

    if (!existingPresenza) {
      return NextResponse.json(
        { error: 'Presenza non trovata o non autorizzata' },
        { status: 404 }
      )
    }

    // Delete presence
    await prisma.presenze.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Presenza eliminata con successo',
      presenzaId: id
    })

  } catch (error) {
    console.error('Errore durante l\'eliminazione della presenza:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante l\'eliminazione della presenza',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}