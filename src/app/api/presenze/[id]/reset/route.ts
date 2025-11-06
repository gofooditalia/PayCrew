/**
 * API: PUT /api/presenze/[id]/reset
 * Ripristina una presenza confermata o assente allo stato DA_CONFERMARE
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    // Await params in Next.js 16
    const { id } = await params

    // Recupera l'azienda dell'utente
    const utente = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })

    if (!utente?.aziendaId) {
      return NextResponse.json(
        { error: 'Utente non associato ad un\'azienda' },
        { status: 403 }
      )
    }

    // Verifica che la presenza esista e appartenga all'azienda
    const presenza = await prisma.presenze.findFirst({
      where: {
        id: id,
        dipendenti: {
          aziendaId: utente.aziendaId
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

    if (!presenza) {
      return NextResponse.json(
        { error: 'Presenza non trovata o non autorizzata' },
        { status: 404 }
      )
    }

    // Verifica che la presenza sia CONFERMATA o ASSENTE
    if (presenza.stato !== 'CONFERMATA' && presenza.stato !== 'ASSENTE') {
      return NextResponse.json(
        { error: 'Solo le presenze confermate o assenti possono essere ripristinate' },
        { status: 400 }
      )
    }

    // Ripristina lo stato a DA_CONFERMARE
    const presenzaAggiornata = await prisma.presenze.update({
      where: { id },
      data: {
        stato: 'DA_CONFERMARE'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Presenza ripristinata a "Da Confermare"',
      presenza: presenzaAggiornata
    }, { status: 200 })

  } catch (error: unknown) {
    console.error('Errore PUT /api/presenze/[id]/reset:', error)

    return NextResponse.json(
      {
        error: 'Errore durante il ripristino della presenza',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}
