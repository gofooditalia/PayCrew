import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// Interfaccia per il risultato della query raw
interface AttivitaRawResult {
  id: string
  tipoAttivita: string
  descrizione: string
  idEntita: string | null
  tipoEntita: string | null
  datiAggiuntivi: unknown
  createdAt: Date
  userId: string
  userName: string | null
  userEmail: string
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
    const userData = await prisma.user.findUnique({
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

    // Build the WHERE clause conditions
    const whereConditions = [`a."aziendaId" = '${userData.aziendaId}'`]
    
    if (tipoAttivita) {
      whereConditions.push(`a."tipoAttivita" = '${tipoAttivita}'`)
    }
    
    if (giorni) {
      const dataLimite = new Date(Date.now() - giorni * 24 * 60 * 60 * 1000)
      whereConditions.push(`a."createdAt" >= '${dataLimite.toISOString()}'`)
    }
    
    const whereClause = whereConditions.join(' AND ')
    
    // Get recent activities with user info using raw SQL
    const attivita = await prisma.$queryRawUnsafe(`
      SELECT
        a.id,
        a."tipoAttivita",
        a.descrizione,
        a."idEntita",
        a."tipoEntita",
        a."datiAggiuntivi",
        a."createdAt",
        u.id as "userId",
        u.name as "userName",
        u.email as "userEmail"
      FROM attivita a
      JOIN users u ON a."userId" = u.id
      WHERE ${whereClause}
      ORDER BY a."createdAt" DESC
      LIMIT ${limit}
    `)

    // Transform the raw query result to match the expected format
    const attivitaFormattate = (attivita as AttivitaRawResult[]).map(item => ({
      id: item.id,
      tipoAttivita: item.tipoAttivita,
      descrizione: item.descrizione,
      idEntita: item.idEntita,
      tipoEntita: item.tipoEntita,
      datiAggiuntivi: item.datiAggiuntivi,
      createdAt: item.createdAt,
      user: {
        id: item.userId,
        name: item.userName || '',
        email: item.userEmail
      }
    }))

    return NextResponse.json({ attivita: attivitaFormattate })

  } catch (error) {
    console.error('Errore durante il recupero delle attività:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante il recupero delle attività',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}