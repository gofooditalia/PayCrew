import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
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

    // Insert a test activity directly with raw SQL
    const query = `
      INSERT INTO attivita (
        id, "tipoAttivita", descrizione, "idEntita", "tipoEntita",
        "userId", "aziendaId", "datiAggiuntivi", "createdAt"
      ) VALUES (
        gen_random_uuid(),
        'CREAZIONE_DIPENDENTE',
        'Test attività manuale',
        'test-id-123',
        'DIPENDENTE',
        '${user.id}',
        '${userData.aziendaId}',
        '{"test": true, "manuale": true}',
        NOW()
      )
      RETURNING id, "tipoAttivita", descrizione, "createdAt"
    `;
    
    console.log('Inserimento attività test - Query:', query);
    
    const result = await prisma.$queryRawUnsafe(query);
    console.log('Inserimento attività test - Risultato:', result);

    return NextResponse.json({ 
      message: 'Test activity inserted successfully',
      activity: result
    })

  } catch (error) {
    console.error('Errore durante l\'inserimento dell\'attività di test:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante l\'inserimento dell\'attività di test',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}