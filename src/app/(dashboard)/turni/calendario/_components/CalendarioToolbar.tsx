'use client'

/**
 * CalendarioToolbar - Toolbar compatta per gestione turni
 *
 * Integra in una singola riga:
 * - Navigazione mese/settimana
 * - Toggle vista
 * - Filtro sede
 * - Pianificazione multipla
 * - Legenda (popover)
 */

import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarRange, Building2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface Sede {
  id: string
  nome: string
}

interface CalendarioToolbarProps {
  currentDate: Date
  vistaAttiva: 'settimana' | 'mese'
  sedeSelezionata: string
  sedi: Sede[]
  dipendentiFiltrati: number
  onPreviousMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  onVistaChange: (vista: 'settimana' | 'mese') => void
  onSedeChange: (sedeId: string) => void
  onPianificazioneClick: () => void
}

export function CalendarioToolbar({
  currentDate,
  vistaAttiva,
  sedeSelezionata,
  sedi,
  dipendentiFiltrati,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onVistaChange,
  onSedeChange,
  onPianificazioneClick
}: CalendarioToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-white border rounded-lg">
      {/* Sezione sinistra: Navigazione + Vista */}
      <div className="flex items-center gap-2">
        {/* Navigazione */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={onPreviousMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            onClick={onToday}
            className="h-8 px-3 min-w-[80px] font-semibold"
          >
            {format(currentDate, 'MMM yyyy', { locale: it })}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Toggle Vista */}
        <div className="flex items-center gap-1 bg-muted rounded-md p-1">
          <Button
            variant={vistaAttiva === 'settimana' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onVistaChange('settimana')}
            className="h-7 px-3 text-xs"
          >
            Settimana
          </Button>
          <Button
            variant={vistaAttiva === 'mese' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onVistaChange('mese')}
            className="h-7 px-3 text-xs"
          >
            Mese
          </Button>
        </div>
      </div>

      {/* Sezione destra: Filtri + Azioni */}
      <div className="flex items-center gap-2">
        {/* Filtro Sede */}
        <Select value={sedeSelezionata} onValueChange={onSedeChange}>
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <Building2 className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Tutte le sedi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tutte">Tutte le sedi</SelectItem>
            <SelectItem value="nessuna">Senza sede</SelectItem>
            {sedi.map((sede) => (
              <SelectItem key={sede.id} value={sede.id}>
                {sede.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {sedeSelezionata !== 'tutte' && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {dipendentiFiltrati} dip.
          </span>
        )}

        <div className="h-6 w-px bg-border" />

        {/* Pianificazione Multipla */}
        <Button
          variant="outline"
          size="sm"
          onClick={onPianificazioneClick}
          className="h-8 px-3 text-xs"
        >
          <CalendarRange className="h-3 w-3 mr-1" />
          Pianifica
        </Button>

        {/* Legenda (Popover) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Info className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Legenda Turni</h4>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-300"></div>
                  <span className="text-xs">Mattina</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-100 border-2 border-orange-300"></div>
                  <span className="text-xs">Pranzo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-300"></div>
                  <span className="text-xs">Sera</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-pink-100 border-2 border-pink-300"></div>
                  <span className="text-xs">Spezzato</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-indigo-100 border-2 border-indigo-300"></div>
                  <span className="text-xs">Notte</span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
