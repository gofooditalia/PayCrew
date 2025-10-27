import { NextRequest, NextResponse } from 'next/server'
import { AttivitaLogger } from '@/lib/attivita-logger'

export async function POST(request: NextRequest) {
  try {
    const { userId, aziendaId } = await request.json()
    
    if (!userId || !aziendaId) {
      return NextResponse.json(
        { error: 'userId and aziendaId are required' },
        { status: 400 }
      )
    }

    // Test data
    const testDipendente = {
      id: '8b30df5a-b239-4722-86bf-d1ad309d095f',
      nome: 'antonella',
      cognome: 'elia'
    }

    // Test the specific activity type that was failing
    await AttivitaLogger.logModificaDipendente(
      testDipendente,
      userId,
      aziendaId
    )
    
    return NextResponse.json({
      success: true,
      message: 'Activity logged successfully! The enum casting fix is working.',
      details: {
        activityType: 'MODIFICA_DIPENDENTE',
        dipendente: `${testDipendente.nome} ${testDipendente.cognome}`,
        userId: userId.substring(0, 8) + '...',
        aziendaId: aziendaId.substring(0, 8) + '...'
      }
    })

  } catch (error) {
    console.error('❌ Test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        note: 'If you see a PostgreSQL enum casting error, the fix did not work properly.'
      }
    }, { status: 500 })
  }
}