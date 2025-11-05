'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CedoliniList } from '@/components/cedolini/cedolini-list'
import { CedolinoForm } from '@/components/cedolini/cedolino-form'
import { CedoliniFiltri } from '@/components/cedolini/cedolini-filtri'
import { Plus, FileText } from 'lucide-react'
import { toast } from 'sonner'

export default function CedoliniPage() {
  const [bustePaga, setBustePaga] = useState([])
  const [dipendenti, setDipendenti] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBusta, setEditingBusta] = useState<any>(null)

  // Filtri
  const [filtri, setFiltri] = useState({
    dipendenteId: '',
    mese: new Date().getMonth() + 1,
    anno: new Date().getFullYear(),
    sedeId: '',
  })

  const fetchBustePaga = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filtri.dipendenteId) params.append('dipendenteId', filtri.dipendenteId)
      if (filtri.mese) params.append('mese', filtri.mese.toString())
      if (filtri.anno) params.append('anno', filtri.anno.toString())
      if (filtri.sedeId) params.append('sedeId', filtri.sedeId)

      const response = await fetch(`/api/buste-paga?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setBustePaga(data || [])
      } else {
        toast.error('Errore nel caricamento dei cedolini')
      }
    } catch (error) {
      console.error('Errore caricamento cedolini:', error)
      toast.error('Errore nel caricamento dei cedolini')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDipendenti = async () => {
    try {
      const response = await fetch('/api/dipendenti?limit=1000')
      if (response.ok) {
        const data = await response.json()
        setDipendenti(data.dipendenti || [])
      }
    } catch (error) {
      console.error('Errore caricamento dipendenti:', error)
    }
  }

  useEffect(() => {
    fetchBustePaga()
  }, [filtri])

  useEffect(() => {
    fetchDipendenti()
  }, [])

  const handleCreate = () => {
    setEditingBusta(null)
    setDialogOpen(true)
  }

  const handleEdit = (busta: any) => {
    setEditingBusta(busta)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo cedolino?')) return

    try {
      const response = await fetch(`/api/buste-paga/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Cedolino eliminato con successo')
        fetchBustePaga()
      } else {
        toast.error('Errore nell\'eliminazione del cedolino')
      }
    } catch (error) {
      console.error('Errore eliminazione cedolino:', error)
      toast.error('Errore nell\'eliminazione del cedolino')
    }
  }

  const handleSave = async (data: any) => {
    try {
      const url = editingBusta
        ? `/api/buste-paga/${editingBusta.id}`
        : '/api/buste-paga'
      const method = editingBusta ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success(
          editingBusta
            ? 'Cedolino aggiornato con successo'
            : 'Cedolino creato con successo'
        )
        setDialogOpen(false)
        fetchBustePaga()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Errore nel salvataggio del cedolino')
      }
    } catch (error) {
      console.error('Errore salvataggio cedolino:', error)
      toast.error('Errore nel salvataggio del cedolino')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestione Cedolini
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestisci i pagamenti mensili dei dipendenti
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Cedolino
        </Button>
      </div>

      {/* Filtri */}
      <CedoliniFiltri
        filtri={filtri}
        onFiltriChange={setFiltri}
        dipendenti={dipendenti}
      />

      {/* Lista Cedolini */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cedolini del Mese</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FileText className="h-4 w-4" />
              <span>
                {bustePaga.length} cedolini{' '}
                {filtri.mese && filtri.anno
                  ? `- ${filtri.mese}/${filtri.anno}`
                  : ''}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CedoliniList
            bustePaga={bustePaga}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Dialog Form */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBusta ? 'Modifica Cedolino' : 'Nuovo Cedolino'}
            </DialogTitle>
          </DialogHeader>
          <CedolinoForm
            dipendenti={dipendenti}
            initialData={editingBusta}
            onSave={handleSave}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
