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
import { CreditCardIcon } from '@heroicons/react/24/outline'

interface PagamentoBonificoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dipendenteId: string
  dipendenteNome: string
  onSuccess: () => void
  limiteBonifico: number | null
  coefficienteMaggiorazione: number | null
  pagamentiBonificoEsistenti: number
}

export default function PagamentoBonificoDialog({
  open,
  onOpenChange,
  dipendenteId,
  dipendenteNome,
  onSuccess,
  limiteBonifico,
  coefficienteMaggiorazione,
  pagamentiBonificoEsistenti,
}: PagamentoBonificoDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    importo: '',
    dataPagamento: new Date().toISOString().split('T')[0],
    note: ''
  })

  // Calcola limite bonifico con maggiorazione
  const limiteBonificoBase = Number(limiteBonifico) || 0
  const coefficiente = Number(coefficienteMaggiorazione) || 0
  const maggiorazione = limiteBonificoBase * (coefficiente / 100)
  const limiteBonificoTotale = limiteBonificoBase + maggiorazione
  const disponibile = Math.max(0, limiteBonificoTotale - pagamentiBonificoEsistenti)

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
        setError(`L'importo supera il limite bonifico disponibile di ${formatCurrency(disponibile)}`)
        setLoading(false)
        return
      }

      const response = await fetch('/api/pagamenti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dipendenteId,
          importo,
          tipoPagamento: 'BONIFICO',
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
            <CreditCardIcon className="h-6 w-6 text-blue-600" />
            Registra Pagamento BONIFICO
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {dipendenteNome}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Riepilogo Limiti Bonifico */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Limite Bonifico Base</p>
                  <p className="text-base font-semibold text-blue-700 dark:text-blue-400">
                    {formatCurrency(limiteBonificoBase)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Maggiorazione ({coefficiente}%)</p>
                  <p className="text-base font-semibold text-blue-700 dark:text-blue-400">
                    {formatCurrency(maggiorazione)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center pt-3 border-t border-blue-200 dark:border-blue-800">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Limite Totale</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                    {formatCurrency(limiteBonificoTotale)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Già Pagato</p>
                  <p className="text-lg font-bold text-muted-foreground">
                    {formatCurrency(pagamentiBonificoEsistenti)}
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
                Importo Bonifico *
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
