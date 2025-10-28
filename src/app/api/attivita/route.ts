import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// Interfaccia per il risultato della query
interface AttivitaResult {
  id: string
  tipoAttivita: string
  descrizione: string
  idEntita: string | null
  tipoEntita: string | null
  datiAggiuntivi: unknown
  createdAt: Date
  aziendaId: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Utente non autenticato' },
        { status: 401 }
      )
    }

    // Get user's company
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const tipoAttivita = searchParams.get('tipoAttivita')
    const giorni = parseInt(searchParams.get('giorni') || '30')

    // Build where clause
    const where: Record<string, unknown> = {
      aziendaId: userData.aziendaId
    }
    
    if (tipoAttivita) {
      where.tipoAttivita = tipoAttivita
    }
    
    // Filter by date if specified
    if (giorni) {
      const dataLimite = new Date()
      dataLimite.setDate(dataLimite.getDate() - giorni)
      where.createdAt = {
        gte: dataLimite
      }
    }
    
    // Get recent activities with user info using safe Prisma queries
    const attivita = await prisma.attivita.findMany({
      where: where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Transform the result to match the expected format
    const attivitaFormattate = attivita.map(item => ({
      id: item.id,
      tipoAttivita: item.tipoAttivita,
      descrizione: item.descrizione,
      idEntita: item.idEntita,
      tipoEntita: item.tipoEntita,
      datiAggiuntivi: item.datiAggiuntivi,
      createdAt: item.createdAt,
      aziendaId: item.aziendaId,
      user: {
        id: item.users.id,
        name: item.users.name,
        email: item.users.email
      }
    }))

    return NextResponse.json({ attivita: attivitaFormattate })

  } catch (error) {
    console.error('[PRISMA_ERROR] Errore durante il recupero delle attività:', {
      error: error instanceof Error ? error.message : 'Errore sconosciuto',
      stack: error instanceof Error ? error.stack : undefined,
      code: error instanceof Error && (error as any).code ? (error as any).code : 'UNKNOWN'
    })
    
    // Check if it's a prepared statement error
    if (error instanceof Error && error.message.includes('prepared statement')) {
      console.error('[PRISMA_PREPARED_STATEMENT] Detected prepared statement conflict:', {
        message: error.message,
        suggestion: 'This may be a connection pooling issue in serverless environment'
      })
    }
    
    return NextResponse.json(
      {
        error: 'Errore durante il recupero delle attività',
        details: error instanceof Error ? error.message : 'Errore sconosciuto',
        prismaError: error instanceof Error ? {
          isPreparedStatement: error.message.includes('prepared statement'),
          code: (error as any).code || 'UNKNOWN'
        } : null
      },
      { status: 500 }
    )
  }
}