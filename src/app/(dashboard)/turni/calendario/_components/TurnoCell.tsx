'use client'

/**
 * TurnoCell - Singola cella turno nel calendario
 *
 * Visualizza un turno con colore basato sul tipo
 * Mostra orari e permette click per edit
 * Supporta drag & drop con Pragmatic DnD
 */

import { tipo_turno } from '@prisma/client'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useRef, useEffect, useState } from 'react'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'

interface TurnoCellProps {
  turno: {
    id: string
    data: Date
    oraInizio: string
    oraFine: string
    pausaPranzoInizio?: string | null
    pausaPranzoFine?: string | null
    tipoTurno: tipo_turno
    dipendenteId: string
  }
  onClick: () => void
  // Drag & drop props
  onDropTurno?: (turno: any, targetDipendenteId: string, targetData: Date, isDuplica: boolean) => boolean
  isPending?: boolean
  setIsDragging?: (dragging: boolean) => void
  dipendenteId: string
  data: Date
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

export function TurnoCell({
  turno,
  onClick,
  onDropTurno,
  isPending = false,
  setIsDragging,
  dipendenteId,
  data
}: TurnoCellProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Setup draggable con Pragmatic DnD
  useEffect(() => {
    const element = ref.current
    if (!element || !onDropTurno) return

    return draggable({
      element,
      getInitialData: () => ({
        type: 'turno',
        turno: turno
      }),
      onDragStart: () => {
        setIsDragging?.(true)
      },
      onDrop: () => {
        setIsDragging?.(false)
      }
    })
  }, [turno, onDropTurno, setIsDragging])
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
            ref={ref}
            onClick={onClick}
            className={cn(
              "p-2 rounded-md border-2 cursor-pointer transition-all",
              "hover:shadow-md",
              colorMap[turno.tipoTurno],
              // Bordo tratteggiato arancione se pending (spostamento originale)
              isPending && "border-dashed border-orange-500 opacity-75",
              // Bordo tratteggiato arancione se è un turno spostato temporaneo (destinazione)
              turno.id.startsWith('temp-move-') && "border-dashed border-orange-500 opacity-75 ring-2 ring-orange-200",
              // Bordo tratteggiato verde se è un turno duplicato temporaneo
              turno.id.startsWith('temp-dup-') && "border-dashed border-green-500 opacity-80 ring-2 ring-green-200"
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
            {(isPending || turno.id.startsWith('temp-dup-') || turno.id.startsWith('temp-move-')) && (
              <div className="text-xs text-orange-600 font-medium">
                ⚠️ Da confermare
              </div>
            )}
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
 * Supporta drop per ricevere turni trascinati
 */
interface CellaVuotaProps {
  onClick: () => void
  // Drag & drop props
  onDropTurno?: (turno: any, targetDipendenteId: string, targetData: Date, isDuplica: boolean) => boolean
  dipendenteId: string
  data: Date
  isCellaValida?: boolean
  isCtrlPressed?: boolean
}

export function CellaVuota({
  onClick,
  onDropTurno,
  dipendenteId,
  data,
  isCellaValida = true,
  isCtrlPressed = false
}: CellaVuotaProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isDropping, setIsDropping] = useState(false)

  // Setup drop target con Pragmatic DnD
  useEffect(() => {
    const element = ref.current
    if (!element || !onDropTurno) return

    return dropTargetForElements({
      element,
      canDrop: ({ source }) => {
        const data = source.data
        return data.type === 'turno' && isCellaValida
      },
      onDragEnter: () => setIsDropping(true),
      onDragLeave: () => setIsDropping(false),
      onDrop: ({ source }) => {
        setIsDropping(false)
        const dragData = source.data
        if (dragData.type === 'turno' && dragData.turno) {
          // Usa lo stato isCtrlPressed monitorato globalmente
          onDropTurno(dragData.turno, dipendenteId, data, isCtrlPressed)
        }
      }
    })
  }, [onDropTurno, dipendenteId, data, isCellaValida, isCtrlPressed])

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={cn(
        "p-2 rounded-md border-2 border-dashed cursor-pointer transition-all min-h-[60px] flex items-center justify-center",
        isDropping && isCellaValida ? "border-green-500 bg-green-50" : "border-gray-200",
        isDropping && !isCellaValida && "border-red-500 bg-red-50",
        !isDropping && "hover:border-gray-400 hover:bg-gray-50"
      )}
    >
      <span className="text-xs text-gray-400 hover:text-gray-600">+</span>
    </div>
  )
}
