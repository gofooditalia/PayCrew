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
import { UserGroupIcon } from '@heroicons/react/24/outline'

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
  const gridTemplate = `160px repeat(${numGiorni}, 1fr)`

  return (
    <div className="flex flex-col border rounded-lg overflow-x-auto bg-white h-full">
      {/* Header giorni */}
      <div
        className="bg-blue-200 border-b border-blue-300 sticky top-0 z-10"
        style={{
          display: 'grid',
          gridTemplateColumns: gridTemplate
        }}
      >
        <div className="px-2 py-2 border-r border-blue-300 flex items-center justify-center bg-blue-50">
          <UserGroupIcon className="h-5 w-5 text-blue-700" />
        </div>
        {giorni.map((giorno) => {
          const oggi = isToday(giorno)
          const weekend = isWeekend(giorno)

          return (
            <div
              key={giorno.toISOString()}
              className={cn(
                "px-2 py-2 border-r border-blue-300 text-center relative",
                oggi && "bg-blue-300 border-blue-400 border-x-2",
                !oggi && weekend && "bg-blue-300/50"
              )}
            >
              <div className={cn(
                "text-[10px] font-semibold uppercase tracking-wide",
                oggi ? "text-blue-900 font-bold" : "text-blue-700"
              )}>
                {oggi ? "OGGI" : format(giorno, 'EEE', { locale: it })}
              </div>
              <div className={cn(
                "text-base font-bold",
                oggi ? "text-blue-900" : "text-blue-800"
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
