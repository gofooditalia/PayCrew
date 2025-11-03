'use client'

/**
 * Turni Filters Component
 *
 * Componente per filtrare i turni per dipendente, sede, tipo e date
 */

import { useState, useEffect } from 'react'
import { tipo_turno } from '@prisma/client'
import { TIPI_TURNO_CONFIG } from '@/types/turni'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'

interface TurniFiltriProps {
  dipendenti: Array<{ id: string; nome: string; cognome: string }>
  sedi: Array<{ id: string; nome: string }>
  onFilterChange: (filters: {
    dipendenteId?: string
    sedeId?: string
    tipoTurno?: tipo_turno
    dataInizio?: string
    dataFine?: string
  }) => void
}

export function TurniFiltri({ dipendenti, sedi, onFilterChange }: TurniFiltriProps) {
  const [dipendenteId, setDipendenteId] = useState<string>('all')
  const [sedeId, setSedeId] = useState<string>('all')
  const [tipoTurno, setTipoTurno] = useState<string>('all')
  const [dataInizio, setDataInizio] = useState<string>('')
  const [dataFine, setDataFine] = useState<string>('')

  // Imposta date di default (settimana corrente)
  useEffect(() => {
    const oggi = new Date()
    const inizioSettimana = new Date(oggi)
    inizioSettimana.setDate(oggi.getDate() - oggi.getDay() + 1) // Lunedì
    const fineSettimana = new Date(inizioSettimana)
    fineSettimana.setDate(inizioSettimana.getDate() + 6) // Domenica

    const dataInizioStr = inizioSettimana.toISOString().split('T')[0]
    const dataFineStr = fineSettimana.toISOString().split('T')[0]

    setDataInizio(dataInizioStr)
    setDataFine(dataFineStr)

    // Applica filtri iniziali
    onFilterChange({
      dataInizio: dataInizioStr,
      dataFine: dataFineStr
    })
  }, []) // Solo al mount

  // Applica filtri quando cambiano
  useEffect(() => {
    const filters: any = {}
    if (dipendenteId && dipendenteId !== 'all') filters.dipendenteId = dipendenteId
    if (sedeId && sedeId !== 'all') filters.sedeId = sedeId
    if (tipoTurno && tipoTurno !== 'all') filters.tipoTurno = tipoTurno as tipo_turno
    if (dataInizio) filters.dataInizio = dataInizio
    if (dataFine) filters.dataFine = dataFine

    onFilterChange(filters)
  }, [dipendenteId, sedeId, tipoTurno, dataInizio, dataFine, onFilterChange])

  const handleReset = () => {
    setDipendenteId('all')
    setSedeId('all')
    setTipoTurno('all')

    // Reset alle date della settimana corrente
    const oggi = new Date()
    const inizioSettimana = new Date(oggi)
    inizioSettimana.setDate(oggi.getDate() - oggi.getDay() + 1)
    const fineSettimana = new Date(inizioSettimana)
    fineSettimana.setDate(inizioSettimana.getDate() + 6)

    const dataInizioStr = inizioSettimana.toISOString().split('T')[0]
    const dataFineStr = fineSettimana.toISOString().split('T')[0]

    setDataInizio(dataInizioStr)
    setDataFine(dataFineStr)
  }

  const setSettimanaCorrente = () => {
    const oggi = new Date()
    const inizioSettimana = new Date(oggi)
    inizioSettimana.setDate(oggi.getDate() - oggi.getDay() + 1)
    const fineSettimana = new Date(inizioSettimana)
    fineSettimana.setDate(inizioSettimana.getDate() + 6)

    setDataInizio(inizioSettimana.toISOString().split('T')[0])
    setDataFine(fineSettimana.toISOString().split('T')[0])
  }

  const setSettimanaProssima = () => {
    const oggi = new Date()
    const inizioSettimana = new Date(oggi)
    inizioSettimana.setDate(oggi.getDate() - oggi.getDay() + 8) // Lunedì prossimo
    const fineSettimana = new Date(inizioSettimana)
    fineSettimana.setDate(inizioSettimana.getDate() + 6)

    setDataInizio(inizioSettimana.toISOString().split('T')[0])
    setDataFine(fineSettimana.toISOString().split('T')[0])
  }

  const setMeseCorrente = () => {
    const oggi = new Date()
    const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1)
    const fineMese = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0)

    setDataInizio(inizioMese.toISOString().split('T')[0])
    setDataFine(fineMese.toISOString().split('T')[0])
  }

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filtri</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 px-2"
        >
          <X className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Dipendente */}
        <div className="space-y-2">
          <Label htmlFor="dipendente">Dipendente</Label>
          <Select value={dipendenteId} onValueChange={setDipendenteId}>
            <SelectTrigger id="dipendente">
              <SelectValue placeholder="Tutti" />
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
        <div className="space-y-2">
          <Label htmlFor="sede">Sede</Label>
          <Select value={sedeId} onValueChange={setSedeId}>
            <SelectTrigger id="sede">
              <SelectValue placeholder="Tutte" />
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

        {/* Tipo Turno */}
        <div className="space-y-2">
          <Label htmlFor="tipoTurno">Tipo Turno</Label>
          <Select value={tipoTurno} onValueChange={setTipoTurno}>
            <SelectTrigger id="tipoTurno">
              <SelectValue placeholder="Tutti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i tipi</SelectItem>
              {Object.values(TIPI_TURNO_CONFIG).map((config) => (
                <SelectItem key={config.value} value={config.value}>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-3 h-3 rounded-full ${config.bgColor}`} />
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data Inizio */}
        <div className="space-y-2">
          <Label htmlFor="dataInizio">Data Inizio</Label>
          <Input
            id="dataInizio"
            type="date"
            value={dataInizio}
            onChange={(e) => setDataInizio(e.target.value)}
          />
        </div>

        {/* Data Fine */}
        <div className="space-y-2">
          <Label htmlFor="dataFine">Data Fine</Label>
          <Input
            id="dataFine"
            type="date"
            value={dataFine}
            onChange={(e) => setDataFine(e.target.value)}
          />
        </div>
      </div>

      {/* Quick filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={setSettimanaCorrente}
        >
          Questa settimana
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={setSettimanaProssima}
        >
          Prossima settimana
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={setMeseCorrente}
        >
          Questo mese
        </Button>
      </div>
    </div>
  )
}
