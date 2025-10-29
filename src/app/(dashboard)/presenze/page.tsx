'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

// Import dei componenti
import PresenzeForm from '@/components/presenze/presenze-form'
import PresenzeList from '@/components/presenze/presenze-list'
import TurniForm from '@/components/turni/turni-form'
import TurniList from '@/components/turni/turni-list'
import TurniCalendar from '@/components/turni/turni-calendar'
import PresenzeDashboard from '@/components/presenze/presenze-dashboard'

// Import delle validazioni
import { presenzaSchema, turnoSchema, presenzeFilterSchema, turniFilterSchema } from '@/lib/validation/presenze-validator'

// Tipi per TypeScript
interface Dipendente {
  id: string
  nome: string
  cognome: string
  email: string
  telefono?: string
  dataAssunzione: Date
  tipoContratto: string
  livello: string
  retribuzione: number
  attivo: boolean
  oreSettimanali: number
  sedi?: {
    id: string
    nome: string
  }
}

interface Sede {
  id: string
  nome: string
}

interface Presenza {
  id: string
  data: Date
  entrata?: Date
  uscita?: Date
  oreLavorate?: number
  oreStraordinario?: number
  nota?: string
  dipendenteId: string
  dipendenti: {
    id: string
    nome: string
    cognome: string
    email: string
    telefono?: string
    dataAssunzione: Date
    tipoContratto: string
    livello: string
    retribuzione: number
    attivo: boolean
    oreSettimanali: number
    sedi?: {
      id: string
      nome: string
    }
  }
}

interface Turno {
  id: string
  data: Date
  oraInizio: string
  oraFine: string
  tipoTurno: 'MATTINA' | 'PRANZO' | 'SERA' | 'NOTTE' | 'SPEZZATO'
  dipendenteId: string
  dipendenti: {
    id: string
    nome: string
    cognome: string
    email: string
    telefono?: string
    dataAssunzione: Date
    tipoContratto: string
    livello: string
    retribuzione: number
    attivo: boolean
    oreSettimanali: number
    sedi?: {
      id: string
      nome: string
    }
  }
  sedi?: {
    id: string
    nome: string
  }
}

export default function PresenzePage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showPresenzaForm, setShowPresenzaForm] = useState(false)
  const [showTurnoForm, setShowTurnoForm] = useState(false)
  const [selectedPresenza, setSelectedPresenza] = useState<Presenza | null>(null)
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Stati per i dati
  const [presenze, setPresenze] = useState<Presenza[]>([])
  const [turni, setTurni] = useState<Turno[]>([])
  const [dipendenti, setDipendenti] = useState<Dipendente[]>([])
  const [sedi, setSedi] = useState<Sede[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Caricamento dati
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Carica dipendenti e sedi
        const [dipendentiRes, sediRes] = await Promise.all([
          fetch('/api/dipendenti').then(res => res.json()),
          fetch('/api/sedi').then(res => res.json())
        ])

        if (dipendentiRes.error || sediRes.error) {
          throw new Error('Errore nel caricamento dei dati')
        }

        setDipendenti(dipendentiRes.dipendenti || [])
        setSedi(sediRes.sedi || [])

        // Carica presenze e turni
        const [presenzeRes, turniRes] = await Promise.all([
          fetch('/api/presenze').then(res => res.json()),
          fetch('/api/turni').then(res => res.json())
        ])

        if (presenzeRes.error || turniRes.error) {
          throw new Error('Errore nel caricamento delle presenze/turni')
        }

        setPresenze(presenzeRes.presenze || [])
        setTurni(turniRes.turni || [])

      } catch (err) {
        console.error('Errore durante il caricamento:', err)
        setError(err instanceof Error ? err.message : 'Errore sconosciuto')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [refreshKey])

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleEditPresenza = (presenza: Presenza) => {
    setSelectedPresenza(presenza)
    setShowPresenzaForm(true)
  }

  const handleEditTurno = (turno: Turno) => {
    setSelectedTurno(turno)
    setShowTurnoForm(true)
  }

  const handleDeletePresenza = async (presenza: Presenza) => {
    if (!confirm(`Sei sicuro di voler eliminare la presenza di ${presenza.dipendenti.nome} ${presenza.dipendenti.cognome}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/presenze/${presenza.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Errore durante l\'eliminazione della presenza')
      }

      // Aggiorna la lista
      setPresenze(prev => prev.filter(p => p.id !== presenza.id))
      handleRefresh()
    } catch (err) {
      console.error('Errore durante l\'eliminazione della presenza:', err)
      alert('Errore durante l\'eliminazione della presenza')
    }
  }

  const handleDeleteTurno = async (turno: Turno) => {
    if (!confirm(`Sei sicuro di voler eliminare il turno di ${turno.dipendenti.nome} ${turno.dipendenti.cognome}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/turni/${turno.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Errore durante l\'eliminazione del turno')
      }

      // Aggiorna la lista
      setTurni(prev => prev.filter(t => t.id !== turno.id))
      handleRefresh()
    } catch (err) {
      console.error('Errore durante l\'eliminazione del turno:', err)
      alert('Errore durante l\'eliminazione del turno')
    }
  }

  const handlePresenzaFormSuccess = () => {
    setShowPresenzaForm(false)
    setSelectedPresenza(null)
    handleRefresh()
  }

  const handleTurnoFormSuccess = () => {
    setShowTurnoForm(false)
    setSelectedTurno(null)
    handleRefresh()
  }

  const handlePresenzaFormCancel = () => {
    setShowPresenzaForm(false)
    setSelectedPresenza(null)
  }

  const handleTurnoFormCancel = () => {
    setShowTurnoForm(false)
    setSelectedTurno(null)
  }

  // Statistiche
  const stats = {
    totalPresenze: presenze.length,
    totalTurni: turni.length,
    totalDipendenti: dipendenti.length,
    totalSedi: sedi.length,
    presenzeOggi: presenze.filter(p => {
      const today = new Date()
      return p.data.toDateString() === today.toDateString()
    }).length,
    turniOggi: turni.filter(t => {
      const today = new Date()
      return t.data.toDateString() === today.toDateString()
    }).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-4 text-muted-foreground">Caricamento dati...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-destructive font-semibold">Errore</p>
              <p className="text-muted-foreground mt-2">{error}</p>
              <Button onClick={handleRefresh} className="mt-4">
                Riprova
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-fade-in w-full space-y-6">
      {/* Header con statistiche */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-primary" />
              Gestione Presenze e Turni
            </CardTitle>
            
            <div className="flex items-center gap-4">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                Aggiorna
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.totalPresenze}</p>
              <p className="text-sm text-muted-foreground">Presenze totali</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.totalTurni}</p>
              <p className="text-sm text-muted-foreground">Turni totali</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.totalDipendenti}</p>
              <p className="text-sm text-muted-foreground">Dipendenti</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.totalSedi}</p>
              <p className="text-sm text-muted-foreground">Sedi</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.presenzeOggi}</p>
              <p className="text-sm text-muted-foreground">Presenze oggi</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.turniOggi}</p>
              <p className="text-sm text-muted-foreground">Turni oggi</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <ChartBarIcon className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="presenze" className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4" />
            Presenze
          </TabsTrigger>
          <TabsTrigger value="turni" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Turni
          </TabsTrigger>
          <TabsTrigger value="calendario" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendario
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value="dashboard" className="mt-6">
          <PresenzeDashboard 
            presenze={presenze}
            turni={turni}
            dipendenti={dipendenti}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="presenze" className="mt-6">
          <div className="space-y-6">
            {/* Header con azioni */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold">Registro Presenze</h2>
              <Button 
                onClick={() => setShowPresenzaForm(true)}
                className="flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Nuova Presenza
              </Button>
            </div>

            {/* Lista presenze */}
            <PresenzeList 
              presenze={presenze}
              dipendenti={dipendenti}
              sedi={sedi}
              onEdit={handleEditPresenza}
              onDelete={handleDeletePresenza}
              onRefresh={handleRefresh}
            />
          </div>
        </TabsContent>

        <TabsContent value="turni" className="mt-6">
          <div className="space-y-6">
            {/* Header con azioni */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold">Pianificazione Turni</h2>
              <Button 
                onClick={() => setShowTurnoForm(true)}
                className="flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Nuovo Turno
              </Button>
            </div>

            {/* Lista turni */}
            <TurniList 
              turni={turni}
              dipendenti={dipendenti}
              sedi={sedi}
              onEdit={handleEditTurno}
              onDelete={handleDeleteTurno}
              onRefresh={handleRefresh}
            />
          </div>
        </TabsContent>

        <TabsContent value="calendario" className="mt-6">
          <div className="space-y-6">
            {/* Header con azioni */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold">Calendario Turni</h2>
              <Button 
                onClick={() => setShowTurnoForm(true)}
                className="flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Nuovo Turno
              </Button>
            </div>

            {/* Calendario turni */}
            <TurniCalendar 
              turni={turni}
              dipendenti={dipendenti}
              sedi={sedi}
              onTurnoClick={handleEditTurno}
              onAddTurno={(date) => {
                setSelectedTurno(null)
                setShowTurnoForm(true)
              }}
              onRefresh={handleRefresh}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Modali per i form */}
      {showPresenzaForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <PresenzeForm 
              initialData={selectedPresenza ? {
                dipendenteId: selectedPresenza.dipendenteId,
                data: selectedPresenza.data.toISOString().split('T')[0],
                entrata: selectedPresenza.entrata ? 
                  new Date(selectedPresenza.entrata).toISOString().split('T')[1].substring(0, 5) : '',
                uscita: selectedPresenza.uscita ? 
                  new Date(selectedPresenza.uscita).toISOString().split('T')[1].substring(0, 5) : '',
                nota: selectedPresenza.nota || ''
              } : {}}
              dipendenti={dipendenti}
              onSuccess={handlePresenzaFormSuccess}
              onCancel={handlePresenzaFormCancel}
            />
          </div>
        </div>
      )}

      {showTurnoForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <TurniForm 
              initialData={selectedTurno ? {
                dipendenteId: selectedTurno.dipendenteId,
                data: selectedTurno.data.toISOString().split('T')[0],
                oraInizio: selectedTurno.oraInizio,
                oraFine: selectedTurno.oraFine,
                tipoTurno: selectedTurno.tipoTurno as any,
                sedeId: selectedTurno.sedi?.id || ''
              } : {}}
              dipendenti={dipendenti}
              sedi={sedi}
              onSuccess={handleTurnoFormSuccess}
              onCancel={handleTurnoFormCancel}
            />
          </div>
        </div>
      )}
    </div>
  )
}