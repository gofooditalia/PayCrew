import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { presenzaUpdateSchema } from '@/lib/validation/presenze-validator'
import { AttivitaLogger } from '@/lib/attivita-logger'
import { calcolaOreTraOrari } from '@/lib/utils/ore-calculator'

/**
 * GET /api/presenze/[id]
 * Recupera una singola presenza
 */
export async function GET(
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

    // Recupera la presenza verificando che appartenga all'azienda
    const presenza = await prisma.presenze.findFirst({
      where: {
        id,
        dipendenti: {
          aziendaId: utente.aziendaId
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
    console.error('Errore GET /api/presenze/[id]:', error)
    return NextResponse.json(
      { error: 'Errore durante il recupero della presenza' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/presenze/[id]
 * Aggiorna una presenza e ricalcola le ore
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
    const validatedData = presenzaUpdateSchema.parse(body)

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
            oreSettimanali: true
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

    // Calcola ore lavorate e straordinari se entrambi gli orari sono presenti
    let oreLavorate: number | null = null
    let oreStraordinario: number | null = null

    const entrata = validatedData.entrata !== undefined ? validatedData.entrata :
      (presenzaEsistente.entrata ? presenzaEsistente.entrata.toISOString().substring(11, 16) : null)
    const uscita = validatedData.uscita !== undefined ? validatedData.uscita :
      (presenzaEsistente.uscita ? presenzaEsistente.uscita.toISOString().substring(11, 16) : null)

    if (entrata && uscita) {
      // Calcola ore giornaliere da ore settimanali (assumendo 5 giorni lavorativi)
      const oreGiornaliere = Math.round((presenzaEsistente.dipendenti.oreSettimanali / 5) * 100) / 100

      // Calcola ore totali tra entrata e uscita
      const oreTotali = calcolaOreTraOrari(entrata, uscita)

      // Applica pausa pranzo automatica se lavora più di 6 ore
      const pausaPranzoOre = oreTotali >= 6 ? 0.5 : 0 // 30 minuti = 0.5 ore
      const oreLavorateNette = Math.max(0, oreTotali - pausaPranzoOre)

      // Calcola straordinari
      oreLavorate = Math.min(oreLavorateNette, oreGiornaliere || 8)
      oreStraordinario = Math.max(0, oreLavorateNette - (oreGiornaliere || 8))
    }

    // Prepara i dati per l'update
    const dataToUpdate: any = {}

    if (validatedData.data !== undefined) {
      dataToUpdate.data = new Date(validatedData.data)
    }

    if (validatedData.entrata !== undefined) {
      const dataBase = validatedData.data || presenzaEsistente.data.toISOString().substring(0, 10)
      dataToUpdate.entrata = validatedData.entrata ? new Date(`${dataBase}T${validatedData.entrata}:00`) : null
    }

    if (validatedData.uscita !== undefined) {
      const dataBase = validatedData.data || presenzaEsistente.data.toISOString().substring(0, 10)
      dataToUpdate.uscita = validatedData.uscita ? new Date(`${dataBase}T${validatedData.uscita}:00`) : null
    }

    if (validatedData.nota !== undefined) {
      dataToUpdate.nota = validatedData.nota || null
    }

    // Aggiorna le ore calcolate
    if (oreLavorate !== null) {
      dataToUpdate.oreLavorate = oreLavorate
    }
    if (oreStraordinario !== null) {
      dataToUpdate.oreStraordinario = oreStraordinario
    }

    // Aggiorna la presenza
    const presenza = await prisma.presenze.update({
      where: { id },
      data: dataToUpdate,
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
      console.error('Errore logging modifica presenza:', logError)
    }

    return NextResponse.json(presenza)
  } catch (error) {
    console.error('Errore PUT /api/presenze/[id]:', error)

    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Errore durante l\'aggiornamento della presenza' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/presenze/[id]
 * Elimina una presenza
 */
export async function DELETE(
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

    // Verifica che la presenza esista e appartenga all'azienda
    const presenza = await prisma.presenze.findFirst({
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

    if (!presenza) {
      return NextResponse.json(
        { error: 'Presenza non trovata' },
        { status: 404 }
      )
    }

    // Elimina la presenza
    await prisma.presenze.delete({
      where: { id }
    })

    // Log attività
    try {
      await AttivitaLogger.logEliminazionePresenza(
        id,
        `${presenza.dipendenti.nome} ${presenza.dipendenti.cognome}`,
        user.id,
        utente.aziendaId
      )
    } catch (logError) {
      console.error('Errore logging eliminazione presenza:', logError)
    }

    return NextResponse.json({ success: true, message: 'Presenza eliminata con successo' })
  } catch (error) {
    console.error('Errore DELETE /api/presenze/[id]:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'eliminazione della presenza' },
      { status: 500 }
    )
  }
}
