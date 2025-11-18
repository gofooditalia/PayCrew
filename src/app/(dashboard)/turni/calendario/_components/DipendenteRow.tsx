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
import Link from 'next/link'

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
  // Drag & drop props
  onDropTurno?: (turno: Turno, targetDipendenteId: string, targetData: Date, isDuplica: boolean) => boolean
  isTurnoPending?: (turnoId: string) => boolean
  isCellaValida?: (dipendenteId: string, data: Date) => boolean
  isDragging?: boolean
  setIsDragging?: (dragging: boolean) => void
  isCtrlPressed?: boolean
}

export function DipendenteRow({
  dipendente,
  giorni,
  turni,
  onTurnoClick,
  onCellaVuotaClick,
  onDropTurno,
  isTurnoPending,
  isCellaValida,
  isDragging = false,
  setIsDragging,
  isCtrlPressed = false
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
  const gridTemplate = `160px repeat(${numGiorni}, 1fr)`

  return (
    <div
      className="border-b hover:bg-gray-50/50 transition-colors"
      style={{
        display: 'grid',
        gridTemplateColumns: gridTemplate
      }}
    >
      {/* Nome dipendente */}
      <Link
        href={`/dipendenti/${dipendente.id}`}
        className="flex items-center px-2 py-3 sticky left-0 bg-blue-50 border-r font-medium hover:bg-blue-100 transition-colors group"
      >
        <div className="text-sm font-medium truncate group-hover:text-blue-700">
          {dipendente.nome} {dipendente.cognome}
        </div>
      </Link>

      {/* Celle turni */}
      {giorni.map((giorno) => {
        // Usa format per evitare problemi di timezone
        const dataKey = format(giorno, 'yyyy-MM-dd')
        const turniGiorno = turniPerData[dataKey] || []
        const oggi = isToday(giorno)
        const cellaValida = isCellaValida ? isCellaValida(dipendente.id, giorno) : true

        return (
          <div
            key={dataKey}
            className={cn(
              "p-2 border-r",
              oggi && "bg-blue-50 border-blue-400 border-x-2",
              // Evidenzia celle durante drag
              isDragging && cellaValida && "bg-green-100 transition-colors",
              isDragging && !cellaValida && "bg-red-100 transition-colors"
            )}
          >
            {turniGiorno.length > 0 ? (
              <div className="space-y-1">
                {turniGiorno.map((turno) => (
                  <TurnoCell
                    key={turno.id}
                    turno={turno}
                    onClick={() => onTurnoClick(turno)}
                    onDropTurno={onDropTurno}
                    isPending={isTurnoPending ? isTurnoPending(turno.id) : false}
                    setIsDragging={setIsDragging}
                    dipendenteId={dipendente.id}
                    data={giorno}
                  />
                ))}
              </div>
            ) : (
              <CellaVuota
                onClick={() => onCellaVuotaClick(dipendente.id, giorno)}
                onDropTurno={onDropTurno}
                dipendenteId={dipendente.id}
                data={giorno}
                isCellaValida={cellaValida}
                isCtrlPressed={isCtrlPressed}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
