'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/currency'
import { Pencil, Trash2, Plus, Building2, CreditCard } from 'lucide-react'
import PagamentoDialog from './pagamento-dialog'

interface Pagamento {
  id: string
  importo: number
  tipoPagamento: 'BONUS' | 'BONIFICO'
  dataPagamento: string
  note: string | null
}

interface PagamentiListProps {
  dipendenteId: string
  retribuzioneNetta: number | null
  limiteBonus: number | null
  limiteBonifico: number | null
  coefficienteMaggiorazione: number | null
  mese?: number
  anno?: number
}

export default function PagamentiList({
  dipendenteId,
  retribuzioneNetta,
  limiteBonus,
  limiteBonifico,
  coefficienteMaggiorazione,
  mese,
  anno
}: PagamentiListProps) {
  const [pagamenti, setPagamenti] = useState<Pagamento[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPagamento, setEditingPagamento] = useState<Pagamento | undefined>()

  const loadPagamenti = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ dipendenteId })
      if (mese) params.append('mese', mese.toString())
      if (anno) params.append('anno', anno.toString())

      const response = await fetch(`/api/pagamenti?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPagamenti(data)
      }
    } catch (error) {
      console.error('Error loading pagamenti:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPagamenti()
  }, [dipendenteId, mese, anno])

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo pagamento?')) {
      return
    }

    try {
      const response = await fetch(`/api/pagamenti/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadPagamenti()
      }
    } catch (error) {
      console.error('Error deleting pagamento:', error)
    }
  }

  const handleEdit = (pagamento: Pagamento) => {
    setEditingPagamento(pagamento)
    setDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingPagamento(undefined)
    }
  }

  const handleSuccess = () => {
    loadPagamenti()
  }

  // Calculate totals
  const totalePagato = pagamenti.reduce((sum, p) => sum + p.importo, 0)
  const totaleBonus = pagamenti
    .filter(p => p.tipoPagamento === 'BONUS')
    .reduce((sum, p) => sum + p.importo, 0)
  const totaleBonifici = pagamenti
    .filter(p => p.tipoPagamento === 'BONIFICO')
    .reduce((sum, p) => sum + p.importo, 0)
  const saldoDaPagare = retribuzioneNetta ? retribuzioneNetta - totalePagato : null

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pagamenti</CardTitle>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Pagamento
          </Button>
        </CardHeader>
        <CardContent>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {retribuzioneNetta && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Retribuzione Netta</div>
                <div className="text-2xl font-bold">{formatCurrency(retribuzioneNetta)}</div>
              </div>
            )}

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Totale Pagato</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalePagato)}
              </div>
            </div>

            {retribuzioneNetta && saldoDaPagare !== null && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Saldo da Pagare</div>
                <div className={`text-2xl font-bold ${saldoDaPagare > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatCurrency(saldoDaPagare)}
                </div>
              </div>
            )}

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Bonus / Bonifici</div>
              <div className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {formatCurrency(totaleBonus)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <CreditCard className="h-4 w-4" />
                  {formatCurrency(totaleBonifici)}
                </div>
              </div>
            </div>
          </div>

          {/* Payments list */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Caricamento pagamenti...
            </div>
          ) : pagamenti.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessun pagamento registrato
            </div>
          ) : (
            <div className="space-y-3">
              {pagamenti.map(pagamento => (
                <div
                  key={pagamento.id}
                  className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">
                      {pagamento.tipoPagamento === 'BONUS' ? (
                        <Building2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-lg">
                          {formatCurrency(pagamento.importo)}
                        </span>
                        <Badge variant={pagamento.tipoPagamento === 'BONUS' ? 'default' : 'secondary'}>
                          {pagamento.tipoPagamento === 'BONUS' ? 'Bonus' : 'Bonifico'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(pagamento.dataPagamento).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                      {pagamento.note && (
                        <div className="text-sm mt-2 text-muted-foreground">
                          {pagamento.note}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(pagamento)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(pagamento.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PagamentoDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        dipendenteId={dipendenteId}
        onSuccess={handleSuccess}
        retribuzioneNetta={retribuzioneNetta}
        limiteBonus={limiteBonus}
        limiteBonifico={limiteBonifico}
        coefficienteMaggiorazione={coefficienteMaggiorazione}
        pagamentiEsistenti={pagamenti.map(p => ({
          tipoPagamento: p.tipoPagamento,
          importo: p.importo
        }))}
        pagamento={editingPagamento}
      />
    </>
  )
}
