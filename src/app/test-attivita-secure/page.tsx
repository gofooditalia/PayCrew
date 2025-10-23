'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TestResult {
  test: string
  status: 'success' | 'failed' | 'pending'
  message?: string
  error?: string
  duration?: string
}

interface MonitoringStats {
  errors: number
  success: number
  rate: number
  avgDuration: number
  totalOperations: number
  healthStatus: 'HEALTHY' | 'WARNING' | 'UNHEALTHY'
}

export default function TestAttivitaSecurePage() {
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [monitoringStats, setMonitoringStats] = useState<MonitoringStats | null>(null)
  const [availableTests, setAvailableTests] = useState<Array<{
    type: string
    description: string
  }>>([])
  const [attivitaCreate, setAttivitaCreate] = useState<Array<{
    id: string
    tipoAttivita: string
    descrizione: string
    createdAt: string
  }>>([])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/test-attivita-secure')
      if (response.ok) {
        const data = await response.json()
        setMonitoringStats(data.monitoringStats)
        setAvailableTests(data.availableTests)
        setAttivitaCreate(data.attivitaCreate || [])
      }
    } catch (error) {
      console.error('Errore nel recupero delle statistiche:', error)
    }
  }

  const runTest = async (testType: string) => {
    setLoading(true)
    
    // Reset risultati
    setTestResults([])
    
    try {
      const response = await fetch('/api/test-attivita-secure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testType })
      })

      if (response.ok) {
        const data = await response.json()
        setTestResults(data.results || [])
        setAttivitaCreate(data.attivitaCreate || [])
        setMonitoringStats(data.monitoringStats)
      } else {
        setTestResults([{
          test: testType,
          status: 'failed',
          message: 'Errore nella chiamata API',
          error: response.statusText
        }])
      }
    } catch (error) {
      setTestResults([{
        test: testType,
        status: 'failed',
        message: 'Errore di rete',
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      }])
    } finally {
      setLoading(false)
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    const allResults: TestResult[] = []
    
    for (const test of availableTests) {
      try {
        const response = await fetch('/api/test-attivita-secure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ testType: test.type })
        })

        if (response.ok) {
          const data = await response.json()
          allResults.push(...(data.results || []))
        } else {
          allResults.push({
            test: test.type,
            status: 'failed',
            message: 'Errore nella chiamata API',
            error: response.statusText
          })
        }
      } catch (error) {
        allResults.push({
          test: test.type,
          status: 'failed',
          message: 'Errore di rete',
          error: error instanceof Error ? error.message : 'Errore sconosciuto'
        })
      }
    }
    
    setTestResults(allResults)
    await fetchStats()
    setLoading(false)
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'bg-green-100 text-green-800'
      case 'WARNING': return 'bg-yellow-100 text-yellow-800'
      case 'UNHEALTHY': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Test Attività Sicure</h1>
          <p className="text-gray-600">Verifica del sistema di logging attività con validazione</p>
        </div>
        <Button onClick={fetchStats} variant="outline">
          Aggiorna Statistiche
        </Button>
      </div>

      {/* Statistiche di Monitoring */}
      {monitoringStats && (
        <Card>
          <CardHeader>
            <CardTitle>Statistiche di Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{monitoringStats.totalOperations}</div>
                <div className="text-sm text-gray-600">Operazioni Totali</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{monitoringStats.success}</div>
                <div className="text-sm text-gray-600">Successi</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{monitoringStats.errors}</div>
                <div className="text-sm text-gray-600">Errori</div>
              </div>
              <div className="text-center">
                <Badge className={getHealthColor(monitoringStats.healthStatus)}>
                  {monitoringStats.healthStatus}
                </Badge>
                <div className="text-sm text-gray-600 mt-1">
                  {monitoringStats.avgDuration}ms avg
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Disponibili */}
      <Card>
        <CardHeader>
          <CardTitle>Test Disponibili</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {availableTests.map((test) => (
              <div key={test.type} className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">{test.type}</h3>
                <p className="text-sm text-gray-600 mb-3">{test.description}</p>
                <Button 
                  onClick={() => runTest(test.type)}
                  disabled={loading}
                  className="w-full"
                  variant="outline"
                >
                  Esegui Test
                </Button>
              </div>
            ))}
          </div>
          <Button 
            onClick={runAllTests}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Esecuzione in corso...' : 'Esegui Tutti i Test'}
          </Button>
        </CardContent>
      </Card>

      {/* Risultati dei Test */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Risultati dei Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                    <div>
                      <div className="font-medium">{result.test}</div>
                      {result.message && (
                        <div className="text-sm text-gray-600">{result.message}</div>
                      )}
                      {result.error && (
                        <div className="text-sm text-red-600">{result.error}</div>
                      )}
                    </div>
                  </div>
                  {result.duration && (
                    <div className="text-sm text-gray-500">{result.duration}</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attività Recenti Create */}
      {attivitaCreate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attività Recenti Create (Test)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attivitaCreate.map((attivita) => (
                <div key={attivita.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{attivita.tipoAttivita}</div>
                    <div className="text-sm text-gray-600">{attivita.descrizione}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(attivita.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}