'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface PagamentoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dipendenteId: string
  onSuccess: () => void
  pagamento?: {
    id: string
    importo: number
    tipoPagamento: string
    dataPagamento: string
    note: string | null
  }
}

export default function PagamentoDialog({
  open,
  onOpenChange,
  dipendenteId,
  onSuccess,
  pagamento
}: PagamentoDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    importo: pagamento?.importo?.toString() || '',
    tipoPagamento: pagamento?.tipoPagamento || 'CONTANTI',
    dataPagamento: pagamento?.dataPagamento
      ? new Date(pagamento.dataPagamento).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    note: pagamento?.note || ''
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = pagamento
        ? `/api/pagamenti/${pagamento.id}`
        : '/api/pagamenti'

      const method = pagamento ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          dipendenteId
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Errore durante il salvataggio del pagamento')
      } else {
        onSuccess()
        onOpenChange(false)
        // Reset form
        setFormData({
          importo: '',
          tipoPagamento: 'CONTANTI',
          dataPagamento: new Date().toISOString().split('T')[0],
          note: ''
        })
      }
    } catch (err) {
      setError('Si è verificato un errore durante il salvataggio')
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {pagamento ? 'Modifica Pagamento' : 'Nuovo Pagamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="importo">Importo (€) *</Label>
            <Input
              type="number"
              id="importo"
              name="importo"
              required
              step="0.01"
              min="0"
              value={formData.importo}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label htmlFor="tipoPagamento">Tipo Pagamento *</Label>
            <select
              id="tipoPagamento"
              name="tipoPagamento"
              required
              value={formData.tipoPagamento}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="CONTANTI">Contanti</option>
              <option value="BONIFICO">Bonifico</option>
            </select>
          </div>

          <div>
            <Label htmlFor="dataPagamento">Data Pagamento *</Label>
            <Input
              type="date"
              id="dataPagamento"
              name="dataPagamento"
              required
              value={formData.dataPagamento}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              name="note"
              rows={3}
              placeholder="Note o descrizione del pagamento..."
              value={formData.note}
              onChange={handleChange}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvataggio...' : 'Salva'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
