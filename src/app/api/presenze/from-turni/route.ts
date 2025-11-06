/**
 * API: POST /api/presenze/from-turni
 * Genera presenze automaticamente dai turni pianificati
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PresenzeFromTurniService } from '@/lib/services/presenze-from-turni.service'
import { z } from 'zod'

const generazioneSchema = z.object({
  dataInizio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data non valido (YYYY-MM-DD)'),
  dataFine: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data non valido (YYYY-MM-DD)'),
  dipendenteId: z.string().uuid().optional(),
  sedeId: z.string().uuid().optional(),
  sovrascriviEsistenti: z.boolean().default(false)
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

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

    // Parse e valida body
    const body = await request.json()
    const validatedData = generazioneSchema.parse(body)

    // Converti date
    const dataInizio = new Date(validatedData.dataInizio)
    const dataFine = new Date(validatedData.dataFine)

    // Validazioni business logic
    if (dataInizio > dataFine) {
      return NextResponse.json(
        { error: 'La data inizio deve essere precedente alla data fine' },
        { status: 400 }
      )
    }

    // Calcola differenza giorni per evitare generazioni troppo grandi
    const diffGiorni = Math.ceil((dataFine.getTime() - dataInizio.getTime()) / (1000 * 60 * 60 * 24))
    if (diffGiorni > 90) {
      return NextResponse.json(
        { error: 'Il range massimo consentito è 90 giorni' },
        { status: 400 }
      )
    }

    // Se specificato dipendenteId, verifica che appartenga all'azienda
    if (validatedData.dipendenteId) {
      const dipendente = await prisma.dipendenti.findFirst({
        where: {
          id: validatedData.dipendenteId,
          aziendaId: utente.aziendaId
        }
      })

      if (!dipendente) {
        return NextResponse.json(
          { error: 'Dipendente non trovato o non autorizzato' },
          { status: 404 }
        )
      }
    }

    // Se specificato sedeId, verifica che appartenga all'azienda
    if (validatedData.sedeId) {
      const sede = await prisma.sedi.findFirst({
        where: {
          id: validatedData.sedeId,
          aziendaId: utente.aziendaId
        }
      })

      if (!sede) {
        return NextResponse.json(
          { error: 'Sede non trovata o non autorizzata' },
          { status: 404 }
        )
      }
    }

    // Genera presenze
    const result = await PresenzeFromTurniService.generaPresenzeRange({
      dataInizio,
      dataFine,
      dipendenteId: validatedData.dipendenteId,
      sedeId: validatedData.sedeId,
      sovrascriviEsistenti: validatedData.sovrascriviEsistenti,
      userId: user.id,
      aziendaId: utente.aziendaId
    })

    return NextResponse.json({
      success: true,
      message: `Generazione completata`,
      result: {
        generated: result.generated,
        updated: result.updated,
        skipped: result.skipped,
        total: result.generated + result.updated + result.skipped,
        errors: result.errors.length > 0 ? result.errors : undefined
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Errore POST /api/presenze/from-turni:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Dati non validi',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Errore durante la generazione delle presenze',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}
