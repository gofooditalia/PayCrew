'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import { format } from 'date-fns'

interface Dipendente {
  id: string
  nome: string
  cognome: string
}

interface Sede {
  id: string
  nome: string
}

interface PresenzeFiltersProps {
  onFilterChange: (filters: FilterValues) => void
  dipendenti: Dipendente[]
  sedi: Sede[]
}

export interface FilterValues {
  dataDa: string
  dataA: string
  dipendenteId: string
  stato: string
  sedeId: string
}

export function PresenzeFilters({ onFilterChange, dipendenti, sedi }: PresenzeFiltersProps) {
  // Calcola lunedì della settimana corrente
  const oggi = new Date()
  const giornoSettimana = oggi.getDay() // 0 = Domenica, 1 = Lunedì, ...
  const giorniDaLunedi = giornoSettimana === 0 ? 6 : giornoSettimana - 1 // Se domenica, torna a lunedì scorso
  const lunedi = new Date(oggi)
  lunedi.setDate(oggi.getDate() - giorniDaLunedi)

  const lunediStr = format(lunedi, 'yyyy-MM-dd')
  const oggiStr = format(oggi, 'yyyy-MM-dd')

  const [isOpen, setIsOpen] = useState(false)

  const [filters, setFilters] = useState<FilterValues>({
    dataDa: lunediStr,
    dataA: oggiStr,
    dipendenteId: '',
    stato: '',
    sedeId: ''
  })

  useEffect(() => {
    onFilterChange(filters)
  }, [filters, onFilterChange])

  const handleFilterChange = (key: keyof FilterValues, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleReset = () => {
    const resetFilters = {
      dataDa: lunediStr,
      dataA: oggiStr,
      dipendenteId: '',
      stato: '',
      sedeId: ''
    }
    setFilters(resetFilters)
  }

  const hasActiveFilters =
    filters.dataDa !== lunediStr ||
    filters.dataA !== oggiStr ||
    filters.dipendenteId !== '' ||
    filters.stato !== '' ||
    filters.sedeId !== ''

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-500" />
                <h3 className="font-medium text-sm text-gray-700">Filtri</h3>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </Button>
          </CollapsibleTrigger>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 text-gray-600 hover:text-gray-900"
            >
              <X className="h-4 w-4 mr-1" />
              Reimposta
            </Button>
          )}
        </div>

        <CollapsibleContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
        {/* Data Da */}
        <div className="space-y-2">
          <Label htmlFor="dataDa" className="text-xs text-gray-600">
            Data Da
          </Label>
          <Input
            id="dataDa"
            type="date"
            value={filters.dataDa}
            onChange={(e) => handleFilterChange('dataDa', e.target.value)}
            className="h-9"
          />
        </div>

        {/* Data A */}
        <div className="space-y-2">
          <Label htmlFor="dataA" className="text-xs text-gray-600">
            Data A
          </Label>
          <Input
            id="dataA"
            type="date"
            value={filters.dataA}
            onChange={(e) => handleFilterChange('dataA', e.target.value)}
            className="h-9"
          />
        </div>

        {/* Dipendente */}
        <div className="space-y-2">
          <Label htmlFor="dipendente" className="text-xs text-gray-600">
            Dipendente
          </Label>
          <Select
            value={filters.dipendenteId || 'all'}
            onValueChange={(value) => handleFilterChange('dipendenteId', value === 'all' ? '' : value)}
          >
            <SelectTrigger id="dipendente" className="h-9">
              <SelectValue placeholder="Tutti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              {dipendenti.map((dip) => (
                <SelectItem key={dip.id} value={dip.id}>
                  {dip.nome} {dip.cognome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stato */}
        <div className="space-y-2">
          <Label htmlFor="stato" className="text-xs text-gray-600">
            Stato
          </Label>
          <Select
            value={filters.stato || 'all'}
            onValueChange={(value) => handleFilterChange('stato', value === 'all' ? '' : value)}
          >
            <SelectTrigger id="stato" className="h-9">
              <SelectValue placeholder="Tutti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="DA_CONFERMARE">Da Confermare</SelectItem>
              <SelectItem value="CONFERMATA">Confermata</SelectItem>
              <SelectItem value="ASSENTE">Assente</SelectItem>
              <SelectItem value="MODIFICATA">Modificata</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sede */}
        <div className="space-y-2">
          <Label htmlFor="sede" className="text-xs text-gray-600">
            Sede
          </Label>
          <Select
            value={filters.sedeId || 'all'}
            onValueChange={(value) => handleFilterChange('sedeId', value === 'all' ? '' : value)}
          >
            <SelectTrigger id="sede" className="h-9">
              <SelectValue placeholder="Tutte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte</SelectItem>
              {sedi.map((sede) => (
                <SelectItem key={sede.id} value={sede.id}>
                  {sede.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
