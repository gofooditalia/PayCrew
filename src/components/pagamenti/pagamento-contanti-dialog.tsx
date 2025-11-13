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
import { formatCurrency } from '@/lib/utils/currency'
import { BanknotesIcon } from '@heroicons/react/24/outline'

interface PagamentoContantiDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dipendenteId: string
  dipendenteNome: string
  onSuccess: () => void
  limiteContanti: number | null
  pagamentiContantiEsistenti: number
}

export default function PagamentoContantiDialog({
  open,
  onOpenChange,
  dipendenteId,
  dipendenteNome,
  onSuccess,
  limiteContanti,
  pagamentiContantiEsistenti,
}: PagamentoContantiDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    importo: '',
    dataPagamento: new Date().toISOString().split('T')[0],
    note: ''
  })

  // Calcola disponibilità contanti
  const limiteContantiValue = Number(limiteContanti) || 0
  const disponibile = Math.max(0, limiteContantiValue - pagamentiContantiEsistenti)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const importo = parseFloat(formData.importo)

      if (isNaN(importo) || importo <= 0) {
        setError('Inserisci un importo valido')
        setLoading(false)
        return
      }

      if (importo > disponibile) {
        setError(`L'importo supera il limite contanti disponibile di ${formatCurrency(disponibile)}`)
        setLoading(false)
        return
      }

      const response = await fetch('/api/pagamenti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dipendenteId,
          importo,
          tipoPagamento: 'CONTANTI',
          dataPagamento: formData.dataPagamento,
          note: formData.note || null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Errore durante la registrazione del pagamento')
      }

      // Reset form
      setFormData({
        importo: '',
        dataPagamento: new Date().toISOString().split('T')[0],
        note: ''
      })

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BanknotesIcon className="h-6 w-6 text-green-600" />
            Registra Pagamento CONTANTI
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {dipendenteNome}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Riepilogo Limiti Contanti */}
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Limite Contanti</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">
                    {formatCurrency(limiteContantiValue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Già Pagato</p>
                  <p className="text-lg font-bold text-muted-foreground">
                    {formatCurrency(pagamentiContantiEsistenti)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Disponibile</p>
                  <p className={`text-lg font-bold ${disponibile > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {formatCurrency(disponibile)}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="importo">
                Importo Contanti *
              </Label>
              <Input
                type="number"
                id="importo"
                name="importo"
                step="0.01"
                min="0"
                max={disponibile}
                value={formData.importo}
                onChange={handleChange}
                placeholder={`Max: ${formatCurrency(disponibile)}`}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="dataPagamento">
                Data Pagamento *
              </Label>
              <Input
                type="date"
                id="dataPagamento"
                name="dataPagamento"
                value={formData.dataPagamento}
                onChange={handleChange}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="note">
                Note
              </Label>
              <Textarea
                id="note"
                name="note"
                value={formData.note}
                onChange={handleChange}
                placeholder="Note aggiuntive sul pagamento..."
                rows={3}
                className="mt-1"
              />
            </div>
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
              {loading ? 'Registrazione...' : 'Registra Pagamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
