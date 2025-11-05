'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

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

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Mese */}
          <div className="space-y-2">
            <Label>Mese</Label>
            <Select
              value={filtri.mese.toString()}
              onValueChange={(value) =>
                onFiltriChange({ ...filtri, mese: parseInt(value) })
              }
            >
              <SelectTrigger>
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
            <Label>Anno</Label>
            <Select
              value={filtri.anno.toString()}
              onValueChange={(value) =>
                onFiltriChange({ ...filtri, anno: parseInt(value) })
              }
            >
              <SelectTrigger>
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
            <Label>Dipendente</Label>
            <Select
              value={filtri.dipendenteId || 'all'}
              onValueChange={(value) =>
                onFiltriChange({ ...filtri, dipendenteId: value === 'all' ? '' : value })
              }
            >
              <SelectTrigger>
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
              <Label>Sede</Label>
              <Select
                value={filtri.sedeId || 'all'}
                onValueChange={(value) =>
                  onFiltriChange({ ...filtri, sedeId: value === 'all' ? '' : value })
                }
              >
                <SelectTrigger>
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

        {/* Pulsante Reset */}
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <X className="mr-2 h-4 w-4" />
            Reset Filtri
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
