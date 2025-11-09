'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PlusIcon, MagnifyingGlassIcon, EyeIcon, PencilIcon, TrashIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import CollaboratoreForm from './collaboratore-form'
import ReportCollaboratori from './report-collaboratori'
import { formatCurrency } from '@/lib/utils/currency'

interface Collaboratore {
  id: string
  nome: string
  cognome: string
  codiceFiscale: string
  partitaIva: string | null
  email: string | null
  telefono: string | null
  tipo: string
  tariffaOraria: number | null
  attivo: boolean
  _count: {
    prestazioni: number
  }
  prestazioni: {
    importoTotale: number
    statoPagamento: string
  }[]
}

export default function CollaboratoriList() {
  const router = useRouter()
  const [collaboratori, setCollaboratori] = useState<Collaboratore[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [editingCollaboratore, setEditingCollaboratore] = useState<Collaboratore | null>(null)
  const [filtroAttivo, setFiltroAttivo] = useState<'tutti' | 'attivi' | 'non-attivi'>('attivi')

  const fetchCollaboratori = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (filtroAttivo === 'attivi') params.append('attivo', 'true')
      if (filtroAttivo === 'non-attivi') params.append('attivo', 'false')

      const response = await fetch(`/api/collaboratori?${params}`)
      const data = await response.json()
      setCollaboratori(data.collaboratori || [])
    } catch (error) {
      console.error('Errore caricamento collaboratori:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCollaboratori()
  }, [search, filtroAttivo])

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo collaboratore?')) return

    try {
      const response = await fetch(`/api/collaboratori/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchCollaboratori()
      } else {
        const data = await response.json()
        alert(data.error || 'Errore durante l\'eliminazione')
      }
    } catch (error) {
      console.error('Errore eliminazione:', error)
      alert('Errore durante l\'eliminazione')
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingCollaboratore(null)
    fetchCollaboratori()
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'PRESTAZIONE_OCCASIONALE': return 'Prest. Occasionale'
      case 'PARTITA_IVA': return 'Partita IVA'
      case 'CONSULENTE': return 'Consulente'
      default: return tipo
    }
  }

  const getTotaleCompensi = (prestazioni: any[]) => {
    return prestazioni.reduce((sum, p) => sum + p.importoTotale, 0)
  }

  if (showReport) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setShowReport(false)}>
          ← Torna alla Lista
        </Button>
        <ReportCollaboratori />
      </div>
    )
  }

  if (showForm) {
    return (
      <CollaboratoreForm
        collaboratore={editingCollaboratore}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false)
          setEditingCollaboratore(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header con azioni */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-sm">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cerca per nome, cognome o CF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowReport(true)}>
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Report
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuovo Collaboratore
          </Button>
        </div>
      </div>

      {/* Filtri stato */}
      <div className="flex gap-2">
        <Button
          variant={filtroAttivo === 'tutti' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltroAttivo('tutti')}
        >
          Tutti
        </Button>
        <Button
          variant={filtroAttivo === 'attivi' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltroAttivo('attivi')}
        >
          Attivi
        </Button>
        <Button
          variant={filtroAttivo === 'non-attivi' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltroAttivo('non-attivi')}
        >
          Non Attivi
        </Button>
      </div>

      {/* Tabella */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Collaboratore</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Contatti</TableHead>
                <TableHead className="text-right">Tariffa Oraria</TableHead>
                <TableHead className="text-center">Prestazioni</TableHead>
                <TableHead className="text-right">Totale Compensi</TableHead>
                <TableHead className="text-center">Stato</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collaboratori.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nessun collaboratore trovato
                  </TableCell>
                </TableRow>
              ) : (
                collaboratori.map((collaboratore) => (
                  <TableRow key={collaboratore.id}>
                    <TableCell>
                      <div className="font-medium">{collaboratore.nome} {collaboratore.cognome}</div>
                      <div className="text-sm text-muted-foreground">{collaboratore.codiceFiscale}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTipoLabel(collaboratore.tipo)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {collaboratore.email && <div>{collaboratore.email}</div>}
                        {collaboratore.telefono && <div className="text-muted-foreground">{collaboratore.telefono}</div>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {collaboratore.tariffaOraria ? formatCurrency(collaboratore.tariffaOraria) : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{collaboratore._count.prestazioni}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(getTotaleCompensi(collaboratore.prestazioni))}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={collaboratore.attivo ? 'default' : 'secondary'}>
                        {collaboratore.attivo ? 'Attivo' : 'Non Attivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/collaboratori/${collaboratore.id}`)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingCollaboratore(collaboratore)
                            setShowForm(true)
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(collaboratore.id)}
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
      )}
    </div>
  )
}
