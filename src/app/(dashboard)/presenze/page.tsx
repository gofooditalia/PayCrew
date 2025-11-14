'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PresenzeList } from '@/components/presenze/presenze-list'
import { PresenzeFilters, FilterValues } from '@/components/presenze/presenze-filters'
import { toast } from 'sonner'
import { Download } from 'lucide-react'

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

  const handleExportCSV = () => {
    if (presenze.length === 0) {
      toast.error('Nessuna presenza da esportare')
      return
    }

    try {
      // Intestazioni CSV
      const headers = [
        'Data',
        'Dipendente',
        'Sede',
        'Entrata',
        'Uscita',
        'Ore Lavorate',
        'Ore Straordinario',
        'Stato',
        'Note'
      ]

      // Converti presenze in righe CSV
      const rows = presenze.map((presenza: any) => {
        const data = new Date(presenza.data).toLocaleDateString('it-IT')
        const dipendente = `${presenza.dipendenti.nome} ${presenza.dipendenti.cognome}`
        const sede = presenza.dipendenti.sedi?.nome || 'Non assegnata'
        const entrata = presenza.entrata
          ? new Date(presenza.entrata).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
          : '-'
        const uscita = presenza.uscita
          ? new Date(presenza.uscita).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
          : '-'
        const oreLavorate = presenza.oreLavorate ? Number(presenza.oreLavorate).toFixed(2) : '0.00'
        const oreStraordinario = presenza.oreStraordinario ? Number(presenza.oreStraordinario).toFixed(2) : '0.00'
        const stato = presenza.stato || 'N/A'
        const note = presenza.nota ? `"${presenza.nota.replace(/"/g, '""')}"` : ''

        return [data, dipendente, sede, entrata, uscita, oreLavorate, oreStraordinario, stato, note]
      })

      // Crea contenuto CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')

      // Crea Blob e scarica
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      const timestamp = new Date().toISOString().split('T')[0]
      link.setAttribute('href', url)
      link.setAttribute('download', `presenze_${timestamp}.csv`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(`Esportate ${presenze.length} presenze`)
    } catch (error) {
      console.error('Errore export CSV:', error)
      toast.error('Errore durante l\'esportazione')
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Presenze</h1>
          <p className="text-gray-600">Gestisci le presenze: modifica orari, registra assenze o aggiungi note</p>
        </div>
      </div>

      <PresenzeFilters
        onFilterChange={fetchPresenze}
        dipendenti={dipendenti}
        sedi={sedi}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Registro Presenze</CardTitle>
          <Button
            onClick={handleExportCSV}
            disabled={presenze.length === 0 || isLoading}
            variant="outline"
            size="sm"
          >
            <Download className="mr-2 h-4 w-4" />
            Esporta CSV
          </Button>
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