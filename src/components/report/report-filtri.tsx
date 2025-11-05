'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface ReportFiltriProps {
  filtri: {
    mese: number
    anno: number
    sedeId?: string
    dipendenteId?: string
  }
  onFiltriChange: (filtri: any) => void
  showDipendenteFilter?: boolean
}

export function ReportFiltri({
  filtri,
  onFiltriChange,
  showDipendenteFilter = false,
}: ReportFiltriProps) {
  const [sedi, setSedi] = useState<any[]>([])
  const [dipendenti, setDipendenti] = useState<any[]>([])

  useEffect(() => {
    caricaSedi()
    if (showDipendenteFilter) {
      caricaDipendenti()
    }
  }, [showDipendenteFilter])

  const caricaSedi = async () => {
    try {
      const response = await fetch('/api/sedi')
      if (response.ok) {
        const data = await response.json()
        setSedi(data)
      }
    } catch (error) {
      console.error('Errore nel caricamento sedi:', error)
    }
  }

  const caricaDipendenti = async () => {
    try {
      const response = await fetch('/api/dipendenti')
      if (response.ok) {
        const data = await response.json()
        setDipendenti(data)
      }
    } catch (error) {
      console.error('Errore nel caricamento dipendenti:', error)
    }
  }

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

          {/* Sede */}
          {sedi.length > 0 && (
            <div className="space-y-2">
              <Label>Sede</Label>
              <Select
                value={filtri.sedeId || 'all'}
                onValueChange={(value) =>
                  onFiltriChange({
                    ...filtri,
                    sedeId: value === 'all' ? '' : value,
                  })
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

          {/* Dipendente (opzionale) */}
          {showDipendenteFilter && dipendenti.length > 0 && (
            <div className="space-y-2">
              <Label>Dipendente</Label>
              <Select
                value={filtri.dipendenteId || 'all'}
                onValueChange={(value) =>
                  onFiltriChange({
                    ...filtri,
                    dipendenteId: value === 'all' ? '' : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tutti i dipendenti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i dipendenti</SelectItem>
                  {dipendenti.map((dip) => (
                    <SelectItem key={dip.id} value={dip.id}>
                      {dip.cognome} {dip.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
