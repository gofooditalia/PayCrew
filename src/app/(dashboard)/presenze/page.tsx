'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PresenzeList } from '@/components/presenze/presenze-list'
import { toast } from 'sonner'

export default function PresenzePage() {
  const [presenze, setPresenze] = useState([])
  const [isLoading, setIsLoading] = useState(true) // Inizia con true per mostrare skeleton

  const fetchPresenze = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/presenze?limit=50')
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
  }

  useEffect(() => {
    fetchPresenze()
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
        fetchPresenze()
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
        fetchPresenze()
      } else {
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
        fetchPresenze()
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
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}