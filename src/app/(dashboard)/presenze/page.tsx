'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PresenzeList } from '@/components/presenze/presenze-list'
import { PresenzeFilters, FilterValues } from '@/components/presenze/presenze-filters'
import { toast } from 'sonner'

export default function PresenzePage() {
  const [presenze, setPresenze] = useState([])
  const [dipendenti, setDipendenti] = useState([])
  const [sedi, setSedi] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentFilters, setCurrentFilters] = useState<FilterValues | null>(null)

  const fetchPresenze = useCallback(async (filters: FilterValues) => {
    try {
      setIsLoading(true)
      setCurrentFilters(filters)

      // Costruisci query string
      const params = new URLSearchParams()
      if (filters.dataDa) params.append('dataInizio', filters.dataDa)
      if (filters.dataA) params.append('dataFine', filters.dataA)
      if (filters.dipendenteId) params.append('dipendenteId', filters.dipendenteId)
      if (filters.stato) params.append('stato', filters.stato)
      if (filters.sedeId) params.append('sedeId', filters.sedeId)
      params.append('limit', '100')

      const response = await fetch(`/api/presenze?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setPresenze(data.presenze || [])
      }
    } catch (error) {
      console.error('Errore caricamento presenze:', error)
      toast.error('Errore nel caricamento delle presenze')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshPresenze = useCallback(() => {
    if (currentFilters) {
      fetchPresenze(currentFilters)
    }
  }, [currentFilters, fetchPresenze])

  // Carica dipendenti e sedi per i filtri
  useEffect(() => {
    const fetchDipendentiSedi = async () => {
      try {
        const [dipRes, sediRes] = await Promise.all([
          fetch('/api/dipendenti'),
          fetch('/api/sedi')
        ])

        if (dipRes.ok) {
          const dipData = await dipRes.json()
          setDipendenti(dipData.dipendenti || [])
        }

        if (sediRes.ok) {
          const sediData = await sediRes.json()
          setSedi(sediData.sedi || [])
        }
      } catch (error) {
        console.error('Errore caricamento dati filtri:', error)
      }
    }

    fetchDipendentiSedi()
  }, [])

  const handleConfirm = async (id: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/presenze/${id}/conferma`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ azione: 'CONFERMA' })
      })

      if (response.ok) {
        toast.success('Presenza confermata con successo')
        refreshPresenze()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Errore nella conferma della presenza')
      }
    } catch (error) {
      toast.error('Errore di connessione')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsAbsent = async (id: string) => {
    if (!confirm('Sei sicuro di voler segnare questa presenza come assente?')) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/presenze/${id}/conferma`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ azione: 'ASSENTE' })
      })

      if (response.ok) {
        toast.success('Dipendente segnato come assente')
        refreshPresenze()
      } else{
        const error = await response.json()
        toast.error(error.error || 'Errore nella registrazione dell\'assenza')
      }
    } catch (error) {
      toast.error('Errore di connessione')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async (id: string, currentStatus: string) => {
    const message = currentStatus === 'CONFERMATA'
      ? 'Sei sicuro di voler annullare la conferma? La presenza tornerà in stato "Da Confermare".'
      : 'Sei sicuro di voler annullare l\'assenza? La presenza tornerà in stato "Da Confermare".'

    if (!confirm(message)) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/presenze/${id}/reset`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        toast.success('Stato della presenza ripristinato')
        refreshPresenze()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Errore nel ripristino della presenza')
      }
    } catch (error) {
      toast.error('Errore di connessione')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Presenze</h1>
          <p className="text-gray-600">Conferma le presenze generate dai turni o segna le assenze</p>
        </div>
      </div>

      <PresenzeFilters
        onFilterChange={fetchPresenze}
        dipendenti={dipendenti}
        sedi={sedi}
      />

      <Card>
        <CardHeader>
          <CardTitle>Registro Presenze</CardTitle>
        </CardHeader>
        <CardContent>
          <PresenzeList
            presenze={presenze}
            onConfirm={handleConfirm}
            onMarkAsAbsent={handleMarkAsAbsent}
            onReset={handleReset}
            onRefresh={refreshPresenze}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}