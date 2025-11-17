'use client'

/**
 * TurnoCell - Singola cella turno nel calendario
 *
 * Visualizza un turno con colore basato sul tipo
 * Mostra orari e permette click per edit
 */

import { tipo_turno } from '@prisma/client'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TurnoCellProps {
  turno: {
    id: string
    data: Date
    oraInizio: string
    oraFine: string
    pausaPranzoInizio?: string | null
    pausaPranzoFine?: string | null
    tipoTurno: tipo_turno
  }
  onClick: () => void
}

// Mappa colori per tipo turno
const colorMap: Record<tipo_turno, string> = {
  MATTINA: "bg-yellow-100 border-yellow-300 text-yellow-900 hover:bg-yellow-200",
  PRANZO: "bg-orange-100 border-orange-300 text-orange-900 hover:bg-orange-200",
  SERA: "bg-blue-100 border-blue-300 text-blue-900 hover:bg-blue-200",
  SPEZZATO: "bg-pink-100 border-pink-300 text-pink-900 hover:bg-pink-200",
  NOTTE: "bg-indigo-100 border-indigo-300 text-indigo-900 hover:bg-indigo-200",
}

// Etichette leggibili per tipo turno
const tipoTurnoLabels: Record<tipo_turno, string> = {
  MATTINA: "Mattina",
  PRANZO: "Pranzo",
  SERA: "Sera",
  SPEZZATO: "Spezzato",
  NOTTE: "Notte",
}

export function TurnoCell({ turno, onClick }: TurnoCellProps) {
  // Calcola ore totali
  const calcolaOreTotali = () => {
    const [oraInizioH, oraInizioM] = turno.oraInizio.split(':').map(Number)
    const [oraFineH, oraFineM] = turno.oraFine.split(':').map(Number)

    let minutiTotali = (oraFineH * 60 + oraFineM) - (oraInizioH * 60 + oraInizioM)

    // Se attraversa la mezzanotte
    if (minutiTotali < 0) {
      minutiTotali += 24 * 60
    }

    // Sottrai pausa pranzo se presente
    if (turno.pausaPranzoInizio && turno.pausaPranzoFine) {
      const [pausaInizioH, pausaInizioM] = turno.pausaPranzoInizio.split(':').map(Number)
      const [pausaFineH, pausaFineM] = turno.pausaPranzoFine.split(':').map(Number)
      const minutiPausa = (pausaFineH * 60 + pausaFineM) - (pausaInizioH * 60 + pausaInizioM)
      minutiTotali -= minutiPausa
    }

    const ore = Math.floor(minutiTotali / 60)
    const minuti = minutiTotali % 60

    return minuti > 0 ? `${ore}h ${minuti}m` : `${ore}h`
  }

  const oreTotali = calcolaOreTotali()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={onClick}
            className={cn(
              "p-2 rounded-md border-2 cursor-pointer transition-all",
              "hover:shadow-md",
              colorMap[turno.tipoTurno]
            )}
          >
            <div className="font-medium text-xs mb-1">
              {tipoTurnoLabels[turno.tipoTurno]}
            </div>
            <div className="text-xs">
              {turno.oraInizio} - {turno.oraFine}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <div className="font-semibold">{tipoTurnoLabels[turno.tipoTurno]}</div>
            <div className="text-sm">
              Orario: {turno.oraInizio} - {turno.oraFine}
            </div>
            {turno.pausaPranzoInizio && turno.pausaPranzoFine && (
              <div className="text-sm">
                Pausa: {turno.pausaPranzoInizio} - {turno.pausaPranzoFine}
              </div>
            )}
            <div className="text-sm font-medium">
              Ore totali: {oreTotali}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * CellaVuota - Cella vuota cliccabile per creare nuovo turno
 */
interface CellaVuotaProps {
  onClick: () => void
}

export function CellaVuota({ onClick }: CellaVuotaProps) {
  return (
    <div
      onClick={onClick}
      className="p-2 rounded-md border-2 border-dashed border-gray-200 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all min-h-[60px] flex items-center justify-center"
    >
      <span className="text-xs text-gray-400 hover:text-gray-600">+</span>
    </div>
  )
}
