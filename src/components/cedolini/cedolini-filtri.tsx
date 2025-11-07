'use client'

import { useState } from 'react'
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
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react'

interface CedoliniFiltriProps {
  filtri: {
    dipendenteId: string
    mese: number
    anno: number
    sedeId: string
  }
  onFiltriChange: (filtri: any) => void
  dipendenti: any[]
}

export function CedoliniFiltri({
  filtri,
  onFiltriChange,
  dipendenti,
}: CedoliniFiltriProps) {
  const [isOpen, setIsOpen] = useState(false)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const months = [
    { value: 1, label: 'Gennaio' },
    { value: 2, label: 'Febbraio' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Aprile' },
    { value: 5, label: 'Maggio' },
    { value: 6, label: 'Giugno' },
    { value: 7, label: 'Luglio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Settembre' },
    { value: 10, label: 'Ottobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Dicembre' },
  ]

  // Estrai sedi univoche dai dipendenti
  const sedi = Array.from(
    new Set(
      dipendenti
        .filter((d) => d.sedi)
        .map((d) => JSON.stringify({ id: d.sedi.id, nome: d.sedi.nome }))
    )
  ).map((s) => JSON.parse(s))

  const handleReset = () => {
    onFiltriChange({
      dipendenteId: '',
      mese: new Date().getMonth() + 1,
      anno: new Date().getFullYear(),
      sedeId: '',
    })
  }

  const hasActiveFilters =
    filtri.dipendenteId !== '' ||
    filtri.mese !== new Date().getMonth() + 1 ||
    filtri.anno !== new Date().getFullYear() ||
    filtri.sedeId !== ''

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* Mese */}
            <div className="space-y-2">
              <Label htmlFor="mese" className="text-xs text-gray-600">Mese</Label>
              <Select
                value={filtri.mese.toString()}
                onValueChange={(value) =>
                  onFiltriChange({ ...filtri, mese: parseInt(value) })
                }
              >
                <SelectTrigger id="mese" className="h-9">
                  <SelectValue placeholder="Seleziona mese" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Anno */}
            <div className="space-y-2">
              <Label htmlFor="anno" className="text-xs text-gray-600">Anno</Label>
              <Select
                value={filtri.anno.toString()}
                onValueChange={(value) =>
                  onFiltriChange({ ...filtri, anno: parseInt(value) })
                }
              >
                <SelectTrigger id="anno" className="h-9">
                  <SelectValue placeholder="Seleziona anno" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dipendente */}
            <div className="space-y-2">
              <Label htmlFor="dipendente" className="text-xs text-gray-600">Dipendente</Label>
              <Select
                value={filtri.dipendenteId || 'all'}
                onValueChange={(value) =>
                  onFiltriChange({ ...filtri, dipendenteId: value === 'all' ? '' : value })
                }
              >
                <SelectTrigger id="dipendente" className="h-9">
                  <SelectValue placeholder="Tutti i dipendenti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i dipendenti</SelectItem>
                  {dipendenti.map((dip) => (
                    <SelectItem key={dip.id} value={dip.id}>
                      {dip.nome} {dip.cognome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sede */}
            {sedi.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="sede" className="text-xs text-gray-600">Sede</Label>
                <Select
                  value={filtri.sedeId || 'all'}
                  onValueChange={(value) =>
                    onFiltriChange({ ...filtri, sedeId: value === 'all' ? '' : value })
                  }
                >
                  <SelectTrigger id="sede" className="h-9">
                    <SelectValue placeholder="Tutte le sedi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le sedi</SelectItem>
                    {sedi.map((sede) => (
                      <SelectItem key={sede.id} value={sede.id}>
                        {sede.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
