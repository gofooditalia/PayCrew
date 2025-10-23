import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { AttivitaLogger } from '@/lib/attivita-logger'
import { AttivitaMonitor } from '@/lib/attivita-monitor'
import { TipoAttivita, TipoEntita } from '@prisma/client'

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

    const body = await request.json()
    const { testType = 'basic' } = body

    const results: Array<{
      test: string
      status: string
      message?: string
      error?: string
      duration?: string
      avgPerOperation?: string
      initialStats?: unknown
      finalStats?: unknown
    }> = []

    switch (testType) {
      case 'basic':
        // Test di base con validazione
        await AttivitaLogger.logAttivita({
          tipoAttivita: 'CREAZIONE_DIPENDENTE',
          descrizione: 'Test attività sicura con validazione',
          userId: user.id,
          aziendaId: userData.aziendaId,
          datiAggiuntivi: { 
            test: true, 
            timestamp: new Date().toISOString(),
            validation: 'enabled'
          }
        })
        results.push({ test: 'basic', status: 'success' })
        break

      case 'validation_error':
        // Test validazione tipoAttivita non valido
        try {
          await AttivitaLogger.logAttivita({
            tipoAttivita: 'TIPO_NON_VALIDO',
            descrizione: 'Test con tipo non valido',
            userId: user.id,
            aziendaId: userData.aziendaId
          })
          results.push({ test: 'validation_error', status: 'failed', message: 'Dovrebbe fallire' })
        } catch (error) {
          results.push({ 
            test: 'validation_error', 
            status: 'success', 
            message: 'Validazione funzionante',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
        break

      case 'uuid_validation':
        // Test validazione UUID non valido
        try {
          await AttivitaLogger.logAttivita({
            tipoAttivita: 'CREAZIONE_DIPENDENTE',
            descrizione: 'Test con UUID non valido',
            userId: 'uuid-non-valido',
            aziendaId: userData.aziendaId
          })
          results.push({ test: 'uuid_validation', status: 'failed', message: 'Dovrebbe fallire' })
        } catch (error) {
          results.push({ 
            test: 'uuid_validation', 
            status: 'success', 
            message: 'Validazione UUID funzionante',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
        break

      case 'description_sanitization':
        // Test sanitizzazione descrizione
        await AttivitaLogger.logAttivita({
          tipoAttivita: 'CREAZIONE_DIPENDENTE',
          descrizione: 'Test con <script>alert("xss")</script> e caratteri di controllo \x00\x1F',
          userId: user.id,
          aziendaId: userData.aziendaId,
          datiAggiuntivi: { test: 'sanitization' }
        })
        results.push({ test: 'description_sanitization', status: 'success' })
        break

      case 'performance':
        // Test performance con multiple operazioni
        const startTime = Date.now()
        const promises = []
        
        for (let i = 0; i < 10; i++) {
          promises.push(
            AttivitaLogger.logAttivita({
              tipoAttivita: 'CREAZIONE_DIPENDENTE',
              descrizione: `Test performance ${i + 1}`,
              userId: user.id,
              aziendaId: userData.aziendaId,
              datiAggiuntivi: { test: 'performance', index: i }
            })
          )
        }
        
        await Promise.all(promises)
        const duration = Date.now() - startTime
        
        results.push({ 
          test: 'performance', 
          status: 'success',
          duration: `${duration}ms`,
          avgPerOperation: `${duration / 10}ms`
        })
        break

      case 'retry':
        // Test sistema di retry
        await AttivitaLogger.logAttivitaWithRetry({
          tipoAttivita: 'CREAZIONE_DIPENDENTE',
          descrizione: 'Test con sistema di retry',
          userId: user.id,
          aziendaId: userData.aziendaId,
          datiAggiuntivi: { test: 'retry' }
        }, 3)
        results.push({ test: 'retry', status: 'success' })
        break

      case 'monitoring':
        // Test sistema di monitoring
        const initialStats = AttivitaMonitor.getStats()
        
        // Genera alcune operazioni per testare il monitoring
        for (let i = 0; i < 5; i++) {
          await AttivitaLogger.logAttivita({
            tipoAttivita: 'CREAZIONE_DIPENDENTE',
            descrizione: `Test monitoring ${i + 1}`,
            userId: user.id,
            aziendaId: userData.aziendaId
          })
        }
        
        const finalStats = AttivitaMonitor.getStats()
        AttivitaMonitor.logMetrics()
        
        results.push({ 
          test: 'monitoring', 
          status: 'success',
          initialStats,
          finalStats
        })
        break

      default:
        return NextResponse.json(
          { error: 'Tipo di test non valido' },
          { status: 400 }
        )
    }

    // Recupera le attività create per verificare
    const attivitaCreate = await prisma.attivita.findMany({
      where: {
        userId: user.id,
        aziendaId: userData.aziendaId,
        descrizione: { contains: 'Test' }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return NextResponse.json({ 
      message: 'Test attività sicura completato',
      results,
      attivitaCreate: attivitaCreate.map(a => ({
        id: a.id,
        tipoAttivita: a.tipoAttivita,
        descrizione: a.descrizione,
        createdAt: a.createdAt
      })),
      monitoringStats: AttivitaMonitor.getStats()
    })

  } catch (error) {
    console.error('Errore durante il test dell\'attività sicura:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante il test dell\'attività sicura',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
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

    // Restituisce le statistiche del monitoring e le opzioni di test
    return NextResponse.json({
      monitoringStats: AttivitaMonitor.getStats(),
      availableTests: [
        { type: 'basic', description: 'Test di base con validazione' },
        { type: 'validation_error', description: 'Test validazione tipo non valido' },
        { type: 'uuid_validation', description: 'Test validazione UUID non valido' },
        { type: 'description_sanitization', description: 'Test sanitizzazione descrizione' },
        { type: 'performance', description: 'Test performance con 10 operazioni' },
        { type: 'retry', description: 'Test sistema di retry' },
        { type: 'monitoring', description: 'Test sistema di monitoring' }
      ],
      tipiAttivita: Object.values(TipoAttivita),
      tipiEntita: Object.values(TipoEntita)
    })

  } catch (error) {
    console.error('Errore durante il recupero delle statistiche:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante il recupero delle statistiche',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}