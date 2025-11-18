'use client'

/**
 * CalendarioGrid - Griglia principale calendario turni
 *
 * Visualizza header giorni e righe dipendenti con turni
 */

import { tipo_turno } from '@prisma/client'
import { DipendenteRow } from './DipendenteRow'
import { format, isToday, isWeekend } from 'date-fns'
import { it } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Turno {
  id: string
  data: Date
  oraInizio: string
  oraFine: string
  pausaPranzoInizio?: string | null
  pausaPranzoFine?: string | null
  tipoTurno: tipo_turno
  dipendenteId: string
}

interface Dipendente {
  id: string
  nome: string
  cognome: string
}

interface CalendarioGridProps {
  giorni: Date[]
  dipendenti: Dipendente[]
  turni: Turno[]
  onTurnoClick: (turno: Turno) => void
  onCellaVuotaClick: (dipendenteId: string, data: Date) => void
}

export function CalendarioGrid({
  giorni,
  dipendenti,
  turni,
  onTurnoClick,
  onCellaVuotaClick
}: CalendarioGridProps) {
  // Raggruppa turni per dipendente
  const turniPerDipendente = turni.reduce((acc, turno) => {
    if (!acc[turno.dipendenteId]) {
      acc[turno.dipendenteId] = []
    }
    acc[turno.dipendenteId].push(turno)
    return acc
  }, {} as Record<string, Turno[]>)

  if (dipendenti.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nessun dipendente attivo trovato.</p>
        <p className="text-sm mt-2">Aggiungi dipendenti per iniziare a pianificare i turni.</p>
      </div>
    )
  }

  // Determina dinamicamente il numero di colonne basato sui giorni
  const numGiorni = giorni.length
  const gridTemplate = `200px repeat(${numGiorni}, 1fr)`

  return (
    <div className="flex flex-col border rounded-lg overflow-x-auto bg-white h-full">
      {/* Header giorni */}
      <div
        className="bg-gray-50 border-b sticky top-0 z-10"
        style={{
          display: 'grid',
          gridTemplateColumns: gridTemplate
        }}
      >
        <div className="p-3 border-r font-semibold text-sm">
          Dipendente
        </div>
        {giorni.map((giorno) => {
          const oggi = isToday(giorno)
          const weekend = isWeekend(giorno)

          return (
            <div
              key={giorno.toISOString()}
              className={cn(
                "p-3 border-r text-center relative",
                oggi && "bg-blue-100 border-blue-400 border-x-2",
                !oggi && weekend && "bg-gray-100"
              )}
            >
              {oggi && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
              )}
              <div className={cn(
                "text-xs font-medium uppercase",
                oggi ? "text-blue-700 font-bold" : "text-muted-foreground"
              )}>
                {oggi ? "OGGI" : format(giorno, 'EEE', { locale: it })}
              </div>
              <div className={cn(
                "text-lg font-semibold mt-1",
                oggi && "text-blue-700"
              )}>
                {format(giorno, 'd')}
              </div>
            </div>
          )
        })}
      </div>

      {/* Righe dipendenti */}
      {dipendenti.map((dipendente) => (
        <DipendenteRow
          key={dipendente.id}
          dipendente={dipendente}
          giorni={giorni}
          turni={turniPerDipendente[dipendente.id] || []}
          onTurnoClick={onTurnoClick}
          onCellaVuotaClick={onCellaVuotaClick}
        />
      ))}
    </div>
  )
}
