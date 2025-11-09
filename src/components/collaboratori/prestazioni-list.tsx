'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline'
import { formatCurrency } from '@/lib/utils/currency'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import PrestazioneForm from './prestazione-form'

interface Prestazione {
  id: string
  tipo: string
  descrizione: string
  dataInizio: string
  dataFine: string | null
  oreLavorate: number | null
  tariffaOraria: number | null
  nomeProgetto: string | null
  compensoFisso: number | null
  importoTotale: number
  statoPagamento: string
  dataPagamento: string | null
  note: string | null
}

interface PrestazioniListProps {
  collaboratoreId: string
  prestazioni: Prestazione[]
  onRefresh: () => void
}

export default function PrestazioniList({ collaboratoreId, prestazioni, onRefresh }: PrestazioniListProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingPrestazione, setEditingPrestazione] = useState<Prestazione | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa prestazione?')) return

    try {
      const response = await fetch(`/api/prestazioni/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onRefresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Errore durante l\'eliminazione')
      }
    } catch (error) {
      console.error('Errore eliminazione:', error)
      alert('Errore durante l\'eliminazione')
    }
  }

  const handleSegnaPagato = async (id: string) => {
    try {
      const prestazione = prestazioni.find(p => p.id === id)
      if (!prestazione) return

      const updateData: any = {
        collaboratoreId: prestazione.collaboratoreId,
        tipo: prestazione.tipo,
        descrizione: prestazione.descrizione,
        dataInizio: prestazione.dataInizio.split('T')[0],
        importoTotale: prestazione.importoTotale,
        statoPagamento: 'PAGATO',
        dataPagamento: new Date().toISOString().split('T')[0],
      }

      // Aggiungi campi opzionali se presenti
      if (prestazione.dataFine) updateData.dataFine = prestazione.dataFine.split('T')[0]
      if (prestazione.oreLavorate) updateData.oreLavorate = prestazione.oreLavorate
      if (prestazione.tariffaOraria) updateData.tariffaOraria = prestazione.tariffaOraria
      if (prestazione.nomeProgetto) updateData.nomeProgetto = prestazione.nomeProgetto
      if (prestazione.compensoFisso) updateData.compensoFisso = prestazione.compensoFisso
      if (prestazione.note) updateData.note = prestazione.note

      const response = await fetch(`/api/prestazioni/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        onRefresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Errore durante l\'aggiornamento')
      }
    } catch (error) {
      console.error('Errore aggiornamento:', error)
      alert('Errore durante l\'aggiornamento')
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingPrestazione(null)
    onRefresh()
  }

  const getStatoPagamentoBadge = (stato: string) => {
    switch (stato) {
      case 'DA_PAGARE':
        return <Badge variant="destructive">Da Pagare</Badge>
      case 'PAGATO':
        return <Badge variant="default" className="bg-green-600">Pagato</Badge>
      case 'ANNULLATO':
        return <Badge variant="secondary">Annullato</Badge>
      default:
        return <Badge>{stato}</Badge>
    }
  }

  if (showForm) {
    return (
      <PrestazioneForm
        collaboratoreId={collaboratoreId}
        prestazione={editingPrestazione}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false)
          setEditingPrestazione(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Prestazioni</h3>
        <Button onClick={() => setShowForm(true)} size="sm">
          <PlusIcon className="h-4 w-4 mr-2" />
          Nuova Prestazione
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead className="text-right">Ore/Progetto</TableHead>
              <TableHead className="text-right">Importo</TableHead>
              <TableHead className="text-center">Stato</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prestazioni.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nessuna prestazione registrata
                </TableCell>
              </TableRow>
            ) : (
              prestazioni.map((prestazione) => (
                <TableRow key={prestazione.id}>
                  <TableCell>
                    <Badge variant={prestazione.tipo === 'ORARIA' ? 'default' : 'secondary'}>
                      {prestazione.tipo === 'ORARIA' ? 'Oraria' : 'Progetto'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{prestazione.descrizione}</div>
                    {prestazione.nomeProgetto && (
                      <div className="text-sm text-muted-foreground">{prestazione.nomeProgetto}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(prestazione.dataInizio), 'dd MMM yyyy', { locale: it })}
                      {prestazione.dataFine && (
                        <> - {format(new Date(prestazione.dataFine), 'dd MMM yyyy', { locale: it })}</>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {prestazione.tipo === 'ORARIA' ? (
                      <div>
                        <div>{prestazione.oreLavorate} ore</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(prestazione.tariffaOraria || 0)}/h
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Fisso</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(prestazione.importoTotale)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatoPagamentoBadge(prestazione.statoPagamento)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      {prestazione.statoPagamento === 'DA_PAGARE' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSegnaPagato(prestazione.id)}
                          title="Segna come pagato"
                        >
                          <CheckIcon className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingPrestazione(prestazione)
                          setShowForm(true)
                        }}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(prestazione.id)}
                      >
                        <TrashIcon className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
