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
  ArrowPathIcon,
  MapPinIcon
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
import { calcolaOreTraOrari } from '@/lib/utils/ore-calculator'

interface Dipendente {
  id: string
  nome: string
  cognome: string
  sedi?: {
    id: string
    nome: string
  }
}

interface Sede {
  id: string
  nome: string
}

interface Turno {
  id: string
  data: Date
  oraInizio: string
  oraFine: string
  tipoTurno: 'MATTINA' | 'PRANZO' | 'SERA' | 'NOTTE' | 'SPEZZATO'
  dipendenti: Dipendente
  sedi?: Sede
}

interface TurniListProps {
  turni: Turno[]
  dipendenti: Dipendente[]
  sedi: Sede[]
  onEdit?: (turno: Turno) => void
  onDelete?: (turno: Turno) => void
  onView?: (turno: Turno) => void
  onRefresh?: () => void
}

const TIPI_TURNO_CONFIG = {
  MATTINA: { label: 'Mattina', icon: '🌅', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  PRANZO: { label: 'Pranzo', icon: '☀️', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  SERA: { label: 'Sera', icon: '🌆', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  NOTTE: { label: 'Notte', icon: '🌙', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  SPEZZATO: { label: 'Spezzato', icon: '🔄', color: 'bg-purple-100 text-purple-800 border-purple-200' }
}

export default function TurniList({ 
  turni, 
  dipendenti, 
  sedi,
  onEdit, 
  onDelete, 
  onView,
  onRefresh
}: TurniListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    dipendenteId: '',
    sedeId: '',
    tipoTurno: '',
    dataDa: '',
    dataA: ''
  })

  // Filtra turni in base a ricerca e filtri
  const filteredTurni = useMemo(() => {
    return turni.filter(turno => {
      // Ricerca testuale
      const searchMatch = searchTerm === '' || 
        `${turno.dipendenti.nome} ${turno.dipendenti.cognome}`.toLowerCase().includes(searchTerm.toLowerCase())

      // Filtri
      const dipendenteMatch = !filters.dipendenteId || turno.dipendenti.id === filters.dipendenteId
      const sedeMatch = !filters.sedeId || 
        (turno.sedi && turno.sedi.id === filters.sedeId)
      const tipoMatch = !filters.tipoTurno || turno.tipoTurno === filters.tipoTurno
      
      const dataMatch = (!filters.dataDa || new Date(turno.data) >= new Date(filters.dataDa)) &&
                     (!filters.dataA || new Date(turno.data) <= new Date(filters.dataA))

      return searchMatch && dipendenteMatch && sedeMatch && tipoMatch && dataMatch
    })
  }, [turni, searchTerm, filters])

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

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      dipendenteId: '',
      sedeId: '',
      tipoTurno: '',
      dataDa: '',
      dataA: ''
    })
    setSearchTerm('')
  }

  // Calcola statistiche
  const stats = useMemo(() => {
    const tipiTurno = filteredTurni.reduce((acc, turno) => {
      acc[turno.tipoTurno] = (acc[turno.tipoTurno] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const oreTotali = filteredTurni.reduce((acc, turno) => {
      return acc + calcolaOreTraOrari(turno.oraInizio, turno.oraFine)
    }, 0)

    return {
      totali: filteredTurni.length,
      tipiTurno,
      oreTotali: Math.round(oreTotali * 100) / 100
    }
  }, [filteredTurni])

  return (
    <div className="animate-fade-in w-full space-y-6">
      {/* Header con statistiche */}
      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Pianificazione Turni ({filteredTurni.length})
            </h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Turni totali:</span>
                <span className="font-semibold text-foreground">{stats.totali}</span>
              </div>
              <div className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Ore totali:</span>
                <span className="font-semibold text-foreground">{stats.oreTotali.toFixed(1)}h</span>
              </div>
            </div>
            
            {/* Statistiche per tipo turno */}
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(stats.tipiTurno).map(([tipo, count]) => {
                const config = TIPI_TURNO_CONFIG[tipo as keyof typeof TIPI_TURNO_CONFIG]
                return (
                  <Badge key={tipo} variant="outline" className="text-xs">
                    {config.icon} {config.label}: {count}
                  </Badge>
                )
              })}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Ricerca testuale */}
            <div className="lg:col-span-2">
              <Label className="flex items-center gap-1 text-sm">
                <MagnifyingGlassIcon className="h-4 w-4" />
                Ricerca
              </Label>
              <Input
                placeholder="Cerca per nome, cognome..."
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

            {/* Filtro tipo turno */}
            <div>
              <Label className="text-sm">Tipo Turno</Label>
              <select
                value={filters.tipoTurno}
                onChange={(e) => handleFilterChange('tipoTurno', e.target.value)}
                className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200"
              >
                <option value="">Tutti i tipi</option>
                {Object.entries(TIPI_TURNO_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.icon} {config.label}
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

      {/* Tabella turni */}
      <Card>
        <CardContent className="p-0">
          {filteredTurni.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || Object.values(filters).some(v => v) 
                  ? 'Nessun turno trovato per i filtri selezionati.'
                  : 'Nessun turno pianificato.'
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Orario</TableHead>
                  <TableHead>Durata</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTurni.map((turno, index) => {
                  const tipoConfig = TIPI_TURNO_CONFIG[turno.tipoTurno]
                  const durata = calcolaOreTraOrari(turno.oraInizio, turno.oraFine)
                  
                  return (
                    <TableRow 
                      key={turno.id} 
                      className="animate-slide-up hover:bg-muted/50 transition-colors"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {formatDate(turno.data)}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-primary/10">
                            <span className="text-primary font-bold text-xs">
                              {turno.dipendenti.nome.charAt(0)}{turno.dipendenti.cognome.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium">
                              {turno.dipendenti.nome} {turno.dipendenti.cognome}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        {turno.sedi ? (
                          <div className="flex items-center gap-1">
                            <MapPinIcon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{turno.sedi.nome}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge className={tipoConfig.color}>
                          {tipoConfig.icon} {tipoConfig.label}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <ClockIcon className="h-3 w-3 text-green-600" />
                          <span>{turno.oraInizio}</span>
                          <span className="text-muted-foreground">-</span>
                          <ClockIcon className="h-3 w-3 text-red-600" />
                          <span>{turno.oraFine}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {durata.toFixed(1)}h
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onView && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onView(turno)}
                              title="Visualizza dettagli"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(turno)}
                              title="Modifica turno"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(turno)}
                              className="text-destructive hover:text-destructive"
                              title="Elimina turno"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}