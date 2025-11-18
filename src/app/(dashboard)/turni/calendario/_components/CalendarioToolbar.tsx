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
import { ChevronLeft, ChevronRight, CalendarRange, Building2, Info, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  // Drag & drop props
  hasPendingChanges?: boolean
  countPendingChanges?: number
  onAnnullaModifiche?: () => void
  onConfermaModifiche?: () => void
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
  onPianificazioneClick,
  hasPendingChanges = false,
  countPendingChanges = 0,
  onAnnullaModifiche,
  onConfermaModifiche
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
        {/* Pulsanti Conferma/Annulla (mostrati solo se ci sono modifiche pending) */}
        {hasPendingChanges && (
          <>
            <Badge variant="outline" className="border-orange-500 text-orange-700 h-8">
              {countPendingChanges} {countPendingChanges === 1 ? 'modifica' : 'modifiche'} in sospeso
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={onAnnullaModifiche}
              className="h-8 px-3 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Annulla
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onConfermaModifiche}
              className="h-8 px-3 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Conferma
            </Button>
            <div className="h-6 w-px bg-border" />
          </>
        )}

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
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 gap-1.5 relative hover:bg-blue-50 transition-colors group"
            >
              <Info className="h-4 w-4 text-blue-600 animate-[pulse_3s_ease-in-out_infinite] group-hover:animate-none" />
              <span className="text-xs font-medium text-blue-600">Leggimi</span>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-[ping_3s_ease-in-out_infinite] absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-50"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-2">Tipi di Turno</h4>
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

              <div className="border-t pt-2">
                <h4 className="font-semibold text-sm mb-2">Drag & Drop</h4>
                <div className="space-y-2">
                  <div className="text-xs">
                    <div className="font-medium text-orange-700 mb-1">🔄 Sposta turno</div>
                    <div className="text-muted-foreground">Trascina un turno su una cella vuota per spostarlo</div>
                  </div>
                  <div className="text-xs">
                    <div className="font-medium text-green-700 mb-1">📋 Duplica turno</div>
                    <div className="text-muted-foreground">Tieni premuto <kbd className="px-1 py-0.5 bg-gray-100 border rounded text-[10px]">CTRL</kbd> mentre trascini per duplicare</div>
                  </div>
                  <div className="text-xs">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-3 h-3 rounded border-2 border-dashed border-orange-500 bg-orange-50"></div>
                      <span className="font-medium text-orange-700">Arancione tratteggiato</span>
                    </div>
                    <div className="text-muted-foreground">Turno in attesa di conferma (sposta)</div>
                  </div>
                  <div className="text-xs">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-3 h-3 rounded border-2 border-dashed border-green-500 bg-green-50"></div>
                      <span className="font-medium text-green-700">Verde tratteggiato</span>
                    </div>
                    <div className="text-muted-foreground">Turno duplicato in attesa di conferma</div>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
