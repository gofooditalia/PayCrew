import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { AttivitaLogger } from '@/lib/attivita-logger'

const notaSchema = z.object({
  nota: z.string().nullable()
})

/**
 * PUT /api/presenze/[id]/nota
 * Aggiorna solo la nota di una presenza
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Recupera l'azienda dell'utente
    const utente = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })

    if (!utente?.aziendaId) {
      return NextResponse.json({ error: 'Utente non associato ad un\'azienda' }, { status: 403 })
    }

    const body = await request.json()

    // Validazione input
    const validatedData = notaSchema.parse(body)

    // Verifica che la presenza esista e appartenga all'azienda
    const presenzaEsistente = await prisma.presenze.findFirst({
      where: {
        id,
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

    if (!presenzaEsistente) {
      return NextResponse.json(
        { error: 'Presenza non trovata' },
        { status: 404 }
      )
    }

    // Aggiorna solo la nota
    const presenza = await prisma.presenze.update({
      where: { id },
      data: {
        nota: validatedData.nota
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

    // Log attività
    try {
      await AttivitaLogger.logModificaPresenza(
        {
          id: presenza.id,
          dipendenteId: presenza.dipendenteId,
          data: presenza.data
        },
        `${presenza.dipendenti.nome} ${presenza.dipendenti.cognome}`,
        user.id,
        utente.aziendaId
      )
    } catch (logError) {
      console.error('Errore logging modifica nota presenza:', logError)
    }

    return NextResponse.json({
      success: true,
      message: validatedData.nota ? 'Nota salvata con successo' : 'Nota eliminata con successo',
      presenza
    })
  } catch (error) {
    console.error('Errore PUT /api/presenze/[id]/nota:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Errore durante l\'aggiornamento della nota' },
      { status: 500 }
    )
  }
}
