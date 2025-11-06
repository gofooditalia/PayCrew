/**
 * API: PUT /api/presenze/[id]/conferma
 * Conferma una presenza generata da turno
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PresenzeFromTurniService } from '@/lib/services/presenze-from-turni.service'
import { z } from 'zod'

const confermaSchema = z.object({
  azione: z.enum(['CONFERMA', 'MODIFICA', 'ASSENTE']),
  entrata: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  uscita: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  nota: z.string().optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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
        id: params.id,
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

    // Parse e valida body
    const body = await request.json()
    const validatedData = confermaSchema.parse(body)

    let result

    switch (validatedData.azione) {
      case 'CONFERMA':
        // Conferma senza modifiche
        result = await PresenzeFromTurniService.confermaPresenza(
          params.id,
          validatedData.nota ? { nota: validatedData.nota } : undefined
        )
        break

      case 'MODIFICA':
        // Conferma con modifiche orari
        if (!validatedData.entrata || !validatedData.uscita) {
          return NextResponse.json(
            { error: 'Per modificare la presenza devi specificare entrata e uscita' },
            { status: 400 }
          )
        }
        result = await PresenzeFromTurniService.confermaPresenza(params.id, {
          entrata: validatedData.entrata,
          uscita: validatedData.uscita,
          nota: validatedData.nota
        })
        break

      case 'ASSENTE':
        // Marca come assente
        result = await PresenzeFromTurniService.marcaAssente(
          params.id,
          validatedData.nota
        )
        break
    }

    return NextResponse.json({
      success: true,
      message: `Presenza ${validatedData.azione.toLowerCase()}`,
      presenza: result
    }, { status: 200 })

  } catch (error) {
    console.error('Errore PUT /api/presenze/[id]/conferma:', error)

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
        error: 'Errore durante la conferma della presenza',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}
