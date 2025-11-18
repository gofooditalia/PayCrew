'use client'

/**
 * CalendarioMeseGrid - Vista calendario mensile stile Google Calendar
 *
 * Griglia 7 colonne (giorni settimana) × 5-6 righe (settimane)
 * Mostra turni di tutti i dipendenti all'interno delle celle giorno
 */

import { tipo_turno } from '@prisma/client'
import { format, isToday, isSameMonth, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
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

interface CalendarioMeseGridProps {
  currentDate: Date
  dipendenti: Dipendente[]
  turni: Turno[]
  onDayClick: (data: Date) => void
  onTurnoClick: (turno: Turno) => void
}

// Mappa colori per tipo turno
const TIPO_TURNO_COLORS = {
  MATTINA: 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200',
  PRANZO: 'bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200',
  SERA: 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200',
  SPEZZATO: 'bg-pink-100 border-pink-300 text-pink-800 hover:bg-pink-200',
  NOTTE: 'bg-indigo-100 border-indigo-300 text-indigo-800 hover:bg-indigo-200',
}

export function CalendarioMeseGrid({
  currentDate,
  dipendenti,
  turni,
  onDayClick,
  onTurnoClick
}: CalendarioMeseGridProps) {
  // Calcola giorni da visualizzare (include giorni mese precedente/successivo per riempire griglia)
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Lunedì
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const giorni = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Raggruppa turni per data
  const turniPerData = turni.reduce((acc, turno) => {
    const dataKey = format(new Date(turno.data), 'yyyy-MM-dd')
    if (!acc[dataKey]) {
      acc[dataKey] = []
    }
    acc[dataKey].push(turno)
    return acc
  }, {} as Record<string, Turno[]>)

  // Crea mappa dipendenti
  const dipendentiMap = dipendenti.reduce((acc, dip) => {
    acc[dip.id] = dip
    return acc
  }, {} as Record<string, Dipendente>)

  // Organizza giorni in settimane (array di 7 giorni)
  const settimane: Date[][] = []
  for (let i = 0; i < giorni.length; i += 7) {
    settimane.push(giorni.slice(i, i + 7))
  }

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden bg-white h-full">
      {/* Header giorni settimana */}
      <div className="grid grid-cols-7 bg-gray-50 border-b flex-shrink-0">
        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((giorno, idx) => (
          <div
            key={idx}
            className={cn(
              "py-2 px-1 text-center text-xs font-semibold text-muted-foreground border-r last:border-r-0",
              idx >= 5 && "bg-gray-100" // Weekend
            )}
          >
            {giorno}
          </div>
        ))}
      </div>

      {/* Griglia settimane × giorni */}
      <div className="flex flex-col flex-1">
        {settimane.map((settimana, weekIdx) => (
          <div key={weekIdx} className={cn("grid grid-cols-7 border-b last:border-b-0 flex-1")}>
            {settimana.map((giorno, dayIdx) => {
              const dataKey = format(giorno, 'yyyy-MM-dd')
              const turniGiorno = turniPerData[dataKey] || []
              const oggi = isToday(giorno)
              const stessoMese = isSameMonth(giorno, currentDate)
              const weekend = dayIdx >= 5

              return (
                <div
                  key={dataKey}
                  className={cn(
                    "border-r last:border-r-0 p-1 flex flex-col gap-0.5 cursor-pointer transition-colors overflow-hidden",
                    !stessoMese && "bg-gray-50",
                    weekend && stessoMese && "bg-gray-50/50",
                    oggi && "bg-blue-50",
                    "hover:bg-gray-100"
                  )}
                  onClick={() => onDayClick(giorno)}
                >
                  {/* Numero giorno */}
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        !stessoMese && "text-muted-foreground",
                        oggi && "bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold"
                      )}
                    >
                      {format(giorno, 'd')}
                    </span>
                    {turniGiorno.length > 0 && (
                      <span className="text-[9px] text-muted-foreground font-medium">
                        {turniGiorno.length}
                      </span>
                    )}
                  </div>

                  {/* Lista turni - compatta */}
                  {turniGiorno.length > 0 && (
                    <div className="flex-1 overflow-y-auto space-y-0.5">
                      {turniGiorno.slice(0, 4).map((turno) => {
                        const dipendente = dipendentiMap[turno.dipendenteId]
                        if (!dipendente) return null

                        return (
                          <div
                            key={turno.id}
                            className={cn(
                              "text-[9px] px-1 py-0.5 rounded border cursor-pointer transition-colors truncate leading-tight",
                              TIPO_TURNO_COLORS[turno.tipoTurno]
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              onTurnoClick(turno)
                            }}
                            title={`${dipendente.nome} ${dipendente.cognome} - ${turno.oraInizio}-${turno.oraFine}`}
                          >
                            {dipendente.cognome} {turno.oraInizio}
                          </div>
                        )
                      })}
                      {turniGiorno.length > 4 && (
                        <div className="text-[9px] text-muted-foreground px-1 leading-tight">
                          +{turniGiorno.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
