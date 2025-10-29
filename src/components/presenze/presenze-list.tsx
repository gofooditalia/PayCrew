'use client'

import { useState, useMemo } from 'react'
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formattaOreDecimaliInHHmm } from '@/lib/utils/ore-calculator'

interface Dipendente {
  id: string
  nome: string
  cognome: string
  sedi?: {
    id: string
    nome: string
  }
}

interface Presenza {
  id: string
  data: Date
  entrata?: Date
  uscita?: Date
  oreLavorate?: number
  oreStraordinario?: number
  nota?: string
  dipendenti: Dipendente
}

interface PresenzeListProps {
  presenze: Presenza[]
  dipendenti: Dipendente[]
  sedi: Array<{ id: string; nome: string }>
  onEdit?: (presenza: Presenza) => void
  onDelete?: (presenza: Presenza) => void
  onView?: (presenza: Presenza) => void
  onRefresh?: () => void
}

export default function PresenzeList({ 
  presenze, 
  dipendenti, 
  sedi,
  onEdit, 
  onDelete, 
  onView,
  onRefresh
}: PresenzeListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    dipendenteId: '',
    sedeId: '',
    dataDa: '',
    dataA: ''
  })

  // Filtra presenze in base a ricerca e filtri
  const filteredPresenze = useMemo(() => {
    return presenze.filter(presenza => {
      // Ricerca testuale
      const searchMatch = searchTerm === '' || 
        `${presenza.dipendenti.nome} ${presenza.dipendenti.cognome}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (presenza.nota && presenza.nota.toLowerCase().includes(searchTerm.toLowerCase()))

      // Filtri
      const dipendenteMatch = !filters.dipendenteId || presenza.dipendenti.id === filters.dipendenteId
      const sedeMatch = !filters.sedeId || 
        (presenza.dipendenti.sedi && presenza.dipendenti.sedi.id === filters.sedeId)
      
      const dataMatch = (!filters.dataDa || new Date(presenza.data) >= new Date(filters.dataDa)) &&
                     (!filters.dataA || new Date(presenza.data) <= new Date(filters.dataA))

      return searchMatch && dipendenteMatch && sedeMatch && dataMatch
    })
  }, [presenze, searchTerm, filters])

  // Formattatori
  const formatDate = useMemo(() => {
    return (date: Date) => {
      return new Date(date).toLocaleDateString('it-IT', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }, [])

  const formatTime = useMemo(() => {
    return (date: Date) => {
      return new Date(date).toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }, [])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      dipendenteId: '',
      sedeId: '',
      dataDa: '',
      dataA: ''
    })
    setSearchTerm('')
  }

  // Calcola statistiche
  const stats = useMemo(() => {
    const totali = filteredPresenze.reduce((acc, p) => ({
      ore: acc.ore + (p.oreLavorate || 0),
      straordinari: acc.straordinari + (p.oreStraordinario || 0),
      giorni: acc.giorni + 1
    }), { ore: 0, straordinari: 0, giorni: 0 })

    return {
      ...totali,
      mediaGiornaliera: totali.giorni > 0 ? totali.ore / totali.giorni : 0
    }
  }, [filteredPresenze])

  return (
    <div className="animate-fade-in w-full space-y-6">
      {/* Header con statistiche */}
      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Registro Presenze ({filteredPresenze.length})
            </h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Ore totali:</span>
                <span className="font-semibold text-foreground">
                  {formattaOreDecimaliInHHmm(stats.ore)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-orange-600">●</span>
                <span className="text-muted-foreground">Straordinari:</span>
                <span className="font-semibold text-orange-600">
                  {formattaOreDecimaliInHHmm(stats.straordinari)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Media giornaliera:</span>
                <span className="font-semibold text-foreground">
                  {formattaOreDecimaliInHHmm(stats.mediaGiornaliera)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-1"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Pulisci filtri
            </Button>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="flex items-center gap-1"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Aggiorna
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filtri avanzati */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FunnelIcon className="h-4 w-4" />
            Filtri Ricerca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Ricerca testuale */}
            <div className="lg:col-span-2">
              <Label className="flex items-center gap-1 text-sm">
                <MagnifyingGlassIcon className="h-4 w-4" />
                Ricerca
              </Label>
              <Input
                placeholder="Cerca per nome, cognome o note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Filtro dipendente */}
            <div>
              <Label className="text-sm">Dipendente</Label>
              <select
                value={filters.dipendenteId}
                onChange={(e) => handleFilterChange('dipendenteId', e.target.value)}
                className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200"
              >
                <option value="">Tutti i dipendenti</option>
                {dipendenti.map((dipendente) => (
                  <option key={dipendente.id} value={dipendente.id}>
                    {dipendente.nome} {dipendente.cognome}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro sede */}
            <div>
              <Label className="text-sm">Sede</Label>
              <select
                value={filters.sedeId}
                onChange={(e) => handleFilterChange('sedeId', e.target.value)}
                className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200"
              >
                <option value="">Tutte le sedi</option>
                {sedi.map((sede) => (
                  <option key={sede.id} value={sede.id}>
                    {sede.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro date */}
            <div>
              <Label className="text-sm">Periodo</Label>
              <div className="flex gap-1">
                <Input
                  type="date"
                  value={filters.dataDa}
                  onChange={(e) => handleFilterChange('dataDa', e.target.value)}
                  placeholder="Da"
                  className="text-xs"
                />
                <Input
                  type="date"
                  value={filters.dataA}
                  onChange={(e) => handleFilterChange('dataA', e.target.value)}
                  placeholder="A"
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabella presenze */}
      <Card>
        <CardContent className="p-0">
          {filteredPresenze.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || Object.values(filters).some(v => v) 
                  ? 'Nessuna presenza trovata per i filtri selezionati.'
                  : 'Nessuna presenza registrata.'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Dipendente</TableHead>
                  <TableHead className="hidden sm:table-cell">Sede</TableHead>
                  <TableHead>Entrata</TableHead>
                  <TableHead>Uscita</TableHead>
                  <TableHead>Ore Lavorate</TableHead>
                  <TableHead>Straordinari</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPresenze.map((presenza, index) => (
                  <TableRow 
                    key={presenza.id} 
                    className="animate-slide-up hover:bg-muted/50 transition-colors"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {formatDate(presenza.data)}
                        </span>
                        {presenza.nota && (
                          <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                            {presenza.nota}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-primary/10">
                          <span className="text-primary font-bold text-xs">
                            {presenza.dipendenti.nome.charAt(0)}{presenza.dipendenti.cognome.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {presenza.dipendenti.nome} {presenza.dipendenti.cognome}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="hidden sm:table-cell">
                      {presenza.dipendenti.sedi && (
                        <Badge variant="outline" className="text-xs">
                          {presenza.dipendenti.sedi.nome}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      {presenza.entrata ? (
                        <div className="flex items-center gap-1 text-sm">
                          <ClockIcon className="h-3 w-3 text-green-600" />
                          {formatTime(presenza.entrata)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {presenza.uscita ? (
                        <div className="flex items-center gap-1 text-sm">
                          <ClockIcon className="h-3 w-3 text-red-600" />
                          {formatTime(presenza.uscita)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {presenza.oreLavorate ? (
                        <Badge variant="secondary" className="font-mono">
                          {formattaOreDecimaliInHHmm(presenza.oreLavorate)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {presenza.oreStraordinario && presenza.oreStraordinario > 0 ? (
                        <Badge variant="destructive" className="font-mono">
                          {formattaOreDecimaliInHHmm(presenza.oreStraordinario)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onView && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(presenza)}
                            title="Visualizza dettagli"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        )}
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(presenza)}
                            title="Modifica presenza"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(presenza)}
                            className="text-destructive hover:text-destructive"
                            title="Elimina presenza"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}