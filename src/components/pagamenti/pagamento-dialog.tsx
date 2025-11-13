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
  retribuzioneNetta: number | null
  limiteContanti: number | null
  limiteBonifico: number | null
  coefficienteMaggiorazione: number | null
  pagamentiEsistenti: {
    tipoPagamento: 'CONTANTI' | 'BONIFICO'
    importo: number
  }[]
  tipoPagamentoPreselezionato?: 'CONTANTI' | 'BONIFICO' | null
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
  retribuzioneNetta,
  limiteContanti,
  limiteBonifico,
  coefficienteMaggiorazione,
  pagamentiEsistenti,
  tipoPagamentoPreselezionato,
  pagamento
}: PagamentoDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    importo: pagamento?.importo?.toString() || '',
    tipoPagamento: pagamento?.tipoPagamento || tipoPagamentoPreselezionato || 'CONTANTI',
    dataPagamento: pagamento?.dataPagamento
      ? new Date(pagamento.dataPagamento).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    note: pagamento?.note || ''
  })

  // Calcola limiti disponibili
  const calcolaLimiti = () => {
    const netto = Number(retribuzioneNetta) || 0
    const contantiLimit = Number(limiteContanti) || 0
    const bonificoLimit = Number(limiteBonifico) || 0
    const coefficiente = Number(coefficienteMaggiorazione) || 0
    const bonificoMaggiorato = bonificoLimit + (bonificoLimit * coefficiente / 100)

    // Calcola totali già pagati (escludendo il pagamento in modifica)
    const pagatoContanti = pagamentiEsistenti
      .filter(p => p.tipoPagamento === 'CONTANTI' && (!pagamento || pagamento.tipoPagamento !== 'CONTANTI'))
      .reduce((sum, p) => sum + p.importo, 0)

    const pagatoBonifico = pagamentiEsistenti
      .filter(p => p.tipoPagamento === 'BONIFICO' && (!pagamento || pagamento.tipoPagamento !== 'BONIFICO'))
      .reduce((sum, p) => sum + p.importo, 0)

    const totalePagato = pagatoContanti + pagatoBonifico

    return {
      retribuzioneNetta: netto,
      limiteContanti: contantiLimit,
      limiteBonifico: bonificoMaggiorato,
      pagatoContanti,
      pagatoBonifico,
      totalePagato,
      disponibileContanti: Math.max(0, contantiLimit - pagatoContanti),
      disponibileBonifico: Math.max(0, bonificoMaggiorato - pagatoBonifico),
      disponibileTotale: Math.max(0, netto - totalePagato),
      saldoMancante: Math.max(0, netto - totalePagato)
    }
  }

  const limiti = calcolaLimiti()

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Validazione in tempo reale
    if (name === 'importo' || name === 'tipoPagamento') {
      const importo = parseFloat(name === 'importo' ? value : formData.importo) || 0
      const tipo = name === 'tipoPagamento' ? value : formData.tipoPagamento

      setError(null)
      setWarning(null)

      if (importo > 0) {
        // Verifica limite tipo pagamento
        if (tipo === 'CONTANTI' && importo > limiti.disponibileContanti) {
          setError(`L'importo supera il limite contanti disponibile di €${limiti.disponibileContanti.toFixed(2)}`)
        } else if (tipo === 'BONIFICO' && importo > limiti.disponibileBonifico) {
          setError(`L'importo supera il limite bonifico disponibile di €${limiti.disponibileBonifico.toFixed(2)}`)
        }

        // Verifica retribuzione netta totale
        if (importo > limiti.disponibileTotale) {
          setError(`L'importo supera il saldo disponibile di €${limiti.disponibileTotale.toFixed(2)}`)
        }

        // Warning se si avvicina al limite
        const percentualeUtilizzo = (importo / (tipo === 'CONTANTI' ? limiti.disponibileContanti : limiti.disponibileBonifico)) * 100
        if (percentualeUtilizzo > 90 && percentualeUtilizzo <= 100 && !error) {
          setWarning(`Attenzione: stai utilizzando il ${percentualeUtilizzo.toFixed(0)}% del limite ${tipo === 'CONTANTI' ? 'contanti' : 'bonifico'}`)
        }
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validazione finale prima del submit
    const importo = parseFloat(formData.importo) || 0
    const tipo = formData.tipoPagamento

    if (tipo === 'CONTANTI' && importo > limiti.disponibileContanti) {
      setError(`L'importo supera il limite contanti disponibile di €${limiti.disponibileContanti.toFixed(2)}`)
      return
    }

    if (tipo === 'BONIFICO' && importo > limiti.disponibileBonifico) {
      setError(`L'importo supera il limite bonifico disponibile di €${limiti.disponibileBonifico.toFixed(2)}`)
      return
    }

    if (importo > limiti.disponibileTotale) {
      setError(`L'importo supera il saldo disponibile di €${limiti.disponibileTotale.toFixed(2)}`)
      return
    }

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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {pagamento ? 'Modifica Pagamento' : 'Nuovo Pagamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Riepilogo Limiti - Compatto */}
          <div className="p-3 bg-muted/50 rounded-lg border border-border">
            <p className="text-xs font-medium mb-2">Riepilogo Limiti:</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <span className="text-muted-foreground">Retribuzione Netta:</span>
              <span className="font-medium text-right">€{limiti.retribuzioneNetta.toFixed(2)}</span>

              <span className="text-muted-foreground">Totale Pagato:</span>
              <span className="font-medium text-right">€{limiti.totalePagato.toFixed(2)}</span>

              <div className="col-span-2 h-px bg-border my-0.5"></div>

              <span className="text-muted-foreground">Disponibile Contanti:</span>
              <span className="font-semibold text-right text-primary">€{limiti.disponibileContanti.toFixed(2)}</span>

              <span className="text-muted-foreground">Disponibile Bonifico:</span>
              <span className="font-semibold text-right text-primary">€{limiti.disponibileBonifico.toFixed(2)}</span>

              <div className="col-span-2 h-px bg-border my-0.5"></div>

              <span className="font-semibold">Saldo Mancante:</span>
              <span className={`font-bold text-right ${limiti.saldoMancante > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                €{limiti.saldoMancante.toFixed(2)}
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded text-xs">
              {error}
            </div>
          )}

          {warning && !error && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 px-3 py-2 rounded text-xs">
              {warning}
            </div>
          )}

          <div>
            <Label htmlFor="importo" className="text-sm">Importo (€) *</Label>
            <Input
              type="number"
              id="importo"
              name="importo"
              required
              step="0.01"
              min="0"
              value={formData.importo}
              onChange={handleChange}
              className="h-9"
            />
          </div>

          <div>
            <Label htmlFor="tipoPagamento" className="text-sm">Tipo Pagamento *</Label>
            <select
              id="tipoPagamento"
              name="tipoPagamento"
              required
              value={formData.tipoPagamento}
              onChange={handleChange}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="CONTANTI">Contanti</option>
              <option value="BONIFICO">Bonifico</option>
            </select>
          </div>

          <div>
            <Label htmlFor="dataPagamento" className="text-sm">Data Pagamento *</Label>
            <Input
              type="date"
              id="dataPagamento"
              name="dataPagamento"
              required
              value={formData.dataPagamento}
              onChange={handleChange}
              className="h-9"
            />
          </div>

          <div>
            <Label htmlFor="note" className="text-sm">Note</Label>
            <Textarea
              id="note"
              name="note"
              rows={2}
              placeholder="Note o descrizione del pagamento..."
              value={formData.note}
              onChange={handleChange}
              className="text-sm"
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
