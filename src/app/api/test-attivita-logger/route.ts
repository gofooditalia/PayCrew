import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { AttivitaLogger } from '@/lib/attivita-logger'

export async function POST() {
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

    // Test logging a sample activity
    await AttivitaLogger.logAttivita({
      tipoAttivita: 'CREAZIONE_DIPENDENTE',
      descrizione: 'Test attività di logging',
      idEntita: 'test-id',
      tipoEntita: 'DIPENDENTE',
      userId: user.id,
      aziendaId: userData.aziendaId,
      datiAggiuntivi: { test: true }
    })

    return NextResponse.json({ 
      message: 'Test activity logged successfully' 
    })

  } catch (error) {
    console.error('Errore durante il test del logger:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante il test del logger',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}