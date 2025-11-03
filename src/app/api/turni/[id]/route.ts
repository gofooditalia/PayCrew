/**
 * API Routes per singolo Turno
 *
 * Gestisce GET, PATCH, DELETE di un turno specifico
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { turnoUpdateSchema } from '@/lib/validation/turni-validator'
import { AttivitaLogger } from '@/lib/attivita-logger'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/turni/[id]
 * Ottiene i dettagli di un turno specifico
 */
export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Recupera i dati dell'utente
    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })

    if (!dbUser?.aziendaId) {
      return NextResponse.json(
        { error: 'Utente non associato a nessuna azienda' },
        { status: 403 }
      )
    }

    // Recupera il turno
    const turno = await prisma.turni.findFirst({
      where: {
        id,
        dipendenti: {
          aziendaId: dbUser.aziendaId
        }
      },
      include: {
        dipendenti: {
          select: {
            id: true,
            nome: true,
            cognome: true
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

  } catch (error: any) {
    console.error(`Errore GET /api/turni/[id]:`, error)
    return NextResponse.json(
      { error: 'Errore nel recupero del turno' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/turni/[id]
 * Aggiorna un turno esistente
 */
export async function PATCH(
  request: Request,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Recupera i dati dell'utente
    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })

    if (!dbUser?.aziendaId) {
      return NextResponse.json(
        { error: 'Utente non associato a nessuna azienda' },
        { status: 403 }
      )
    }

    // Verifica esistenza turno e autorizzazione
    const turnoEsistente = await prisma.turni.findFirst({
      where: {
        id,
        dipendenti: {
          aziendaId: dbUser.aziendaId
        }
      }
    })

    if (!turnoEsistente) {
      return NextResponse.json(
        { error: 'Turno non trovato' },
        { status: 404 }
      )
    }

    // Parse e validazione del body
    const body = await request.json()
    const validatedData = turnoUpdateSchema.parse(body)

    // Se sedeId è fornito, verifica che la sede appartenga all'azienda
    if (validatedData.sedeId !== undefined && validatedData.sedeId !== null) {
      const sede = await prisma.sedi.findFirst({
        where: {
          id: validatedData.sedeId,
          aziendaId: dbUser.aziendaId
        }
      })

      if (!sede) {
        return NextResponse.json(
          { error: 'Sede non trovata o non autorizzata' },
          { status: 404 }
        )
      }
    }

    // Verifica sovrapposizioni se data o orari sono modificati
    if (validatedData.data || validatedData.oraInizio || validatedData.oraFine) {
      const dataControllo = validatedData.data ? new Date(validatedData.data) : turnoEsistente.data
      const oraInizioControllo = validatedData.oraInizio || turnoEsistente.oraInizio
      const oraFineControllo = validatedData.oraFine || turnoEsistente.oraFine

      const turniSovrapposti = await prisma.turni.findMany({
        where: {
          id: { not: id }, // Escludi il turno corrente
          dipendenteId: turnoEsistente.dipendenteId,
          data: dataControllo
        }
      })

      for (const turno of turniSovrapposti) {
        const conflitto = verificaSovrapposizioneTurni(
          oraInizioControllo,
          oraFineControllo,
          turno.oraInizio,
          turno.oraFine
        )

        if (conflitto) {
          return NextResponse.json(
            {
              error: 'Sovrapposizione turni',
              message: `Il dipendente ha già un turno dalle ${turno.oraInizio} alle ${turno.oraFine}`
            },
            { status: 409 }
          )
        }
      }
    }

    // Preparazione dati per update
    const updateData: any = {}
    if (validatedData.data) updateData.data = new Date(validatedData.data)
    if (validatedData.oraInizio) updateData.oraInizio = validatedData.oraInizio
    if (validatedData.oraFine) updateData.oraFine = validatedData.oraFine
    if (validatedData.tipoTurno) updateData.tipoTurno = validatedData.tipoTurno
    if (validatedData.sedeId !== undefined) updateData.sedeId = validatedData.sedeId

    // Aggiornamento turno
    const turnoAggiornato = await prisma.turni.update({
      where: { id },
      data: updateData,
      include: {
        dipendenti: {
          select: {
            id: true,
            nome: true,
            cognome: true
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

    // Activity logging
    const dipendenteNomeCompleto = `${turnoAggiornato.dipendenti.nome} ${turnoAggiornato.dipendenti.cognome}`
    await AttivitaLogger.logModificaTurno(turnoAggiornato, dipendenteNomeCompleto, user.id, dbUser.aziendaId)

    return NextResponse.json(turnoAggiornato)

  } catch (error: any) {
    console.error(`Errore PATCH /api/turni/[id]:`, error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento del turno' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/turni/[id]
 * Elimina un turno
 */
export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Recupera i dati dell'utente
    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: { aziendaId: true }
    })

    if (!dbUser?.aziendaId) {
      return NextResponse.json(
        { error: 'Utente non associato a nessuna azienda' },
        { status: 403 }
      )
    }

    // Verifica esistenza e autorizzazione
    const turno = await prisma.turni.findFirst({
      where: {
        id,
        dipendenti: {
          aziendaId: dbUser.aziendaId
        }
      },
      include: {
        dipendenti: {
          select: {
            id: true,
            nome: true,
            cognome: true
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

    // Eliminazione turno
    await prisma.turni.delete({
      where: { id }
    })

    // Activity logging
    const dipendenteNomeCompleto = `${turno.dipendenti.nome} ${turno.dipendenti.cognome}`
    await AttivitaLogger.logEliminazioneTurno(turno.id, dipendenteNomeCompleto, user.id, dbUser.aziendaId)

    return NextResponse.json({ success: true, message: 'Turno eliminato con successo' })

  } catch (error: any) {
    console.error(`Errore DELETE /api/turni/[id]:`, error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione del turno' },
      { status: 500 }
    )
  }
}

/**
 * Utility: Verifica sovrapposizione orari
 */
function verificaSovrapposizioneTurni(
  oraInizio1: string,
  oraFine1: string,
  oraInizio2: string,
  oraFine2: string
): boolean {
  const [h1Start, m1Start] = oraInizio1.split(':').map(Number)
  const [h1End, m1End] = oraFine1.split(':').map(Number)
  const [h2Start, m2Start] = oraInizio2.split(':').map(Number)
  const [h2End, m2End] = oraFine2.split(':').map(Number)

  const minuti1Start = h1Start * 60 + m1Start
  const minuti1End = h1End * 60 + m1End
  const minuti2Start = h2Start * 60 + m2Start
  const minuti2End = h2End * 60 + m2End

  return (
    (minuti1Start >= minuti2Start && minuti1Start < minuti2End) ||
    (minuti1End > minuti2Start && minuti1End <= minuti2End) ||
    (minuti1Start <= minuti2Start && minuti1End >= minuti2End)
  )
}
