import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

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

    // Get shift with employee verification
    const turno = await prisma.turni.findFirst({
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
        },
        sedi: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    })

    if (!turno) {
      return NextResponse.json(
        { error: 'Turno non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json(turno)

  } catch (error) {
    console.error('Errore durante il recupero del turno:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante il recupero del turno',
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

    // Check if shift exists and belongs to user's company
    const existingTurno = await prisma.turni.findFirst({
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

    if (!existingTurno) {
      return NextResponse.json(
        { error: 'Turno non trovato o non autorizzato' },
        { status: 404 }
      )
    }

    // Get update data from request
    const updateData = await request.json()

    // Verify sede belongs to user's company (if provided)
    if (updateData.sedeId) {
      const sede = await prisma.sedi.findFirst({
        where: {
          id: updateData.sedeId,
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

    // Check for overlapping shifts (if employee or times are being changed)
    if (updateData.dipendenteId || updateData.oraInizio || updateData.oraFine || updateData.data) {
      const checkDipendenteId = updateData.dipendenteId || existingTurno.dipendenteId
      const checkData = updateData.data ? new Date(updateData.data) : existingTurno.data
      const checkOraInizio = updateData.oraInizio || existingTurno.oraInizio
      const checkOraFine = updateData.oraFine || existingTurno.oraFine

      const turnoInizio = new Date(`${checkData.toISOString().split('T')[0]}T${checkOraInizio}`)
      const turnoFine = new Date(`${checkData.toISOString().split('T')[0]}T${checkOraFine}`)
      
      // Handle overnight shifts
      if (turnoFine < turnoInizio) {
        turnoFine.setDate(turnoFine.getDate() + 1)
      }

      const overlappingTurni = await prisma.turni.findMany({
        where: {
          dipendenteId: checkDipendenteId,
          data: checkData,
          id: { not: id }, // Exclude current shift
          OR: [
            {
              AND: [
                { oraInizio: { lte: checkOraInizio } },
                { oraFine: { gt: checkOraInizio } }
              ]
            },
            {
              AND: [
                { oraInizio: { lt: checkOraFine } },
                { oraFine: { gte: checkOraFine } }
              ]
            },
            {
              AND: [
                { oraInizio: { gte: checkOraInizio } },
                { oraFine: { lte: checkOraFine } }
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
    }

    // Update shift
    const turno = await prisma.turni.update({
      where: { id },
      data: {
        data: updateData.data ? new Date(updateData.data) : existingTurno.data,
        oraInizio: updateData.oraInizio || existingTurno.oraInizio,
        oraFine: updateData.oraFine || existingTurno.oraFine,
        tipoTurno: updateData.tipoTurno || existingTurno.tipoTurno,
        dipendenteId: updateData.dipendenteId || existingTurno.dipendenteId,
        sedeId: updateData.sedeId !== undefined ? updateData.sedeId : existingTurno.sedeId
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
      message: 'Turno aggiornato con successo',
      turno
    })

  } catch (error) {
    console.error('Errore durante l\'aggiornamento del turno:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante l\'aggiornamento del turno',
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

    // Check if shift exists and belongs to user's company
    const existingTurno = await prisma.turni.findFirst({
      where: {
        id,
        dipendenti: {
          aziendaId: userData.aziendaId
        }
      }
    })

    if (!existingTurno) {
      return NextResponse.json(
        { error: 'Turno non trovato o non autorizzato' },
        { status: 404 }
      )
    }

    // Delete shift
    await prisma.turni.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Turno eliminato con successo',
      turnoId: id
    })

  } catch (error) {
    console.error('Errore durante l\'eliminazione del turno:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante l\'eliminazione del turno',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}