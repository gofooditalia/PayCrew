'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Sede {
  id: string
  nome: string
  indirizzo: string | null
  citta: string | null
  aziendaId: string
}

interface SediManagementProps {
  aziendaId: string
}

export default function SediManagement({ aziendaId }: SediManagementProps) {
  const [sedi, setSedi] = useState<Sede[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSedeId, setEditingSedeId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    nome: '',
    indirizzo: '',
    citta: ''
  })

  useEffect(() => {
    fetchSedi()
  }, [aziendaId])

  const fetchSedi = async () => {
    try {
      const response = await fetch('/api/sedi')
      if (!response.ok) {
        throw new Error('Errore nel caricamento delle sedi')
      }
      const data = await response.json()
      setSedi(data.sedi || [])
    } catch (error) {
      toast.error('Errore nel caricamento delle sedi')
      console.error('Errore:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (sede?: Sede) => {
    if (sede) {
      setEditingSedeId(sede.id)
      setFormData({
        nome: sede.nome,
        indirizzo: sede.indirizzo || '',
        citta: sede.citta || ''
      })
    } else {
      setEditingSedeId(null)
      setFormData({
        nome: '',
        indirizzo: '',
        citta: ''
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingSedeId(null)
    setFormData({
      nome: '',
      indirizzo: '',
      citta: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = editingSedeId ? `/api/sedi/${editingSedeId}` : '/api/sedi'
      const method = editingSedeId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore durante il salvataggio')
      }

      toast.success(editingSedeId ? 'Sede aggiornata con successo!' : 'Sede creata con successo!')
      handleCloseDialog()
      fetchSedi()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore durante il salvataggio')
      console.error('Errore:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (sedeId: string, sedeName: string) => {
    if (!confirm(`Sei sicuro di voler eliminare la sede "${sedeName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/sedi/${sedeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore durante l\'eliminazione')
      }

      toast.success('Sede eliminata con successo!')
      fetchSedi()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore durante l\'eliminazione')
      console.error('Errore:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sedi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Caricamento sedi...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sedi</CardTitle>
          <Button onClick={() => handleOpenDialog()} size="sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            Aggiungi Sede
          </Button>
        </CardHeader>
        <CardContent>
          {sedi.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nessuna sede configurata</p>
              <p className="text-sm mt-2">Clicca su &quot;Aggiungi Sede&quot; per iniziare</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sedi.map((sede) => (
                <div
                  key={sede.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{sede.nome}</h3>
                    {(sede.indirizzo || sede.citta) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {[sede.indirizzo, sede.citta].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(sede)}
                      className="hover:bg-primary/10"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(sede.id, sede.nome)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSedeId ? 'Modifica Sede' : 'Nuova Sede'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="nome">Nome Sede *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="es. Sede Principale, Filiale Roma..."
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="indirizzo">Indirizzo</Label>
                <Input
                  id="indirizzo"
                  value={formData.indirizzo}
                  onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                  placeholder="es. Via Roma 123"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="citta">Città</Label>
                <Input
                  id="citta"
                  value={formData.citta}
                  onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                  placeholder="es. Milano"
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={submitting}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Salvataggio...' : editingSedeId ? 'Aggiorna' : 'Crea'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
