'use client'

/**
 * DipendenteRow - Riga dipendente nel calendario
 *
 * Mostra il nome del dipendente e le celle turni per ogni giorno
 */

import { tipo_turno } from '@prisma/client'
import { TurnoCell, CellaVuota } from './TurnoCell'
import { format, isToday } from 'date-fns'
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

interface DipendenteRowProps {
  dipendente: {
    id: string
    nome: string
    cognome: string
  }
  giorni: Date[]
  turni: Turno[]
  onTurnoClick: (turno: Turno) => void
  onCellaVuotaClick: (dipendenteId: string, data: Date) => void
}

export function DipendenteRow({
  dipendente,
  giorni,
  turni,
  onTurnoClick,
  onCellaVuotaClick
}: DipendenteRowProps) {
  // Crea una mappa turni per data per accesso veloce
  const turniPerData = turni.reduce((acc, turno) => {
    // Usa format per evitare problemi di timezone
    const dataKey = format(new Date(turno.data), 'yyyy-MM-dd')
    if (!acc[dataKey]) {
      acc[dataKey] = []
    }
    acc[dataKey].push(turno)
    return acc
  }, {} as Record<string, Turno[]>)

  // Determina dinamicamente il numero di colonne basato sui giorni
  const numGiorni = giorni.length
  const gridTemplate = `200px repeat(${numGiorni}, 1fr)`

  return (
    <div
      className="border-b hover:bg-gray-50/50 transition-colors"
      style={{
        display: 'grid',
        gridTemplateColumns: gridTemplate
      }}
    >
      {/* Nome dipendente */}
      <div className="flex items-center p-3 sticky left-0 bg-white border-r font-medium">
        <div className="text-sm font-medium truncate">
          {dipendente.nome} {dipendente.cognome}
        </div>
      </div>

      {/* Celle turni */}
      {giorni.map((giorno) => {
        // Usa format per evitare problemi di timezone
        const dataKey = format(giorno, 'yyyy-MM-dd')
        const turniGiorno = turniPerData[dataKey] || []
        const oggi = isToday(giorno)

        return (
          <div
            key={dataKey}
            className={cn(
              "p-2 border-r",
              oggi && "bg-blue-50 border-blue-400 border-x-2"
            )}
          >
            {turniGiorno.length > 0 ? (
              <div className="space-y-1">
                {turniGiorno.map((turno) => (
                  <TurnoCell
                    key={turno.id}
                    turno={turno}
                    onClick={() => onTurnoClick(turno)}
                  />
                ))}
              </div>
            ) : (
              <CellaVuota onClick={() => onCellaVuotaClick(dipendente.id, giorno)} />
            )}
          </div>
        )
      })}
    </div>
  )
}
