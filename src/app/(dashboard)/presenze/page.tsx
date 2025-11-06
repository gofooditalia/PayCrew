'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PresenzaForm } from '@/components/presenze/presenza-form'
import { PresenzeList } from '@/components/presenze/presenze-list'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function PresenzePage() {
  const [presenze, setPresenze] = useState([])
  const [dipendenti, setDipendenti] = useState([])
  const [isLoading, setIsLoading] = useState(true) // Inizia con true per mostrare skeleton
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPresenza, setEditingPresenza] = useState<any>(null)

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

  const fetchDipendenti = async () => {
    try {
      const response = await fetch('/api/dipendenti?limit=100')
      if (response.ok) {
        const data = await response.json()
        setDipendenti(data.dipendenti || [])
      }
    } catch (error) {
      console.error('Errore caricamento dipendenti:', error)
    }
  }

  useEffect(() => {
    fetchPresenze()
    fetchDipendenti()
  }, [])

  const handleCreate = async (data: any) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/presenze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast.success('Presenza creata con successo')
        setDialogOpen(false)
        fetchPresenze()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Errore nella creazione della presenza')
      }
    } catch (error) {
      toast.error('Errore di connessione')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async (data: any) => {
    if (!editingPresenza) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/presenze/${editingPresenza.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast.success('Presenza aggiornata con successo')
        setDialogOpen(false)
        setEditingPresenza(null)
        fetchPresenze()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Errore nell\'aggiornamento della presenza')
      }
    } catch (error) {
      toast.error('Errore di connessione')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa presenza?')) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/presenze/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Presenza eliminata con successo')
        fetchPresenze()
      } else {
        toast.error('Errore nell\'eliminazione della presenza')
      }
    } catch (error) {
      toast.error('Errore di connessione')
    } finally {
      setIsLoading(false)
    }
  }

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Presenze</h1>
          <p className="text-gray-600">Gestione presenze e assenze dei dipendenti</p>
        </div>
        <Button onClick={() => {
          setEditingPresenza(null)
          setDialogOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Nuova Presenza
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registro Presenze</CardTitle>
        </CardHeader>
        <CardContent>
          <PresenzeList
            presenze={presenze}
            onEdit={(presenza) => {
              setEditingPresenza(presenza)
              setDialogOpen(true)
            }}
            onDelete={handleDelete}
            onConfirm={handleConfirm}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) setEditingPresenza(null)
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPresenza ? 'Modifica Presenza' : 'Nuova Presenza'}
            </DialogTitle>
          </DialogHeader>
          <PresenzaForm
            dipendenti={dipendenti}
            presenza={editingPresenza}
            onSubmit={editingPresenza ? handleUpdate : handleCreate}
            onCancel={() => {
              setDialogOpen(false)
              setEditingPresenza(null)
            }}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}