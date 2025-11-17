'use client'

/**
 * CalendarioHeader - Header navigazione calendario
 *
 * Permette di:
 * - Navigare tra mesi
 * - Scegliere vista settimana/mese
 * - Tornare alla vista lista
 */

import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronLeft, ChevronRight, List } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import Link from 'next/link'

interface CalendarioHeaderProps {
  currentDate: Date
  onPreviousMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  vistaAttiva: 'settimana' | 'mese'
  onVistaChange: (vista: 'settimana' | 'mese') => void
}

export function CalendarioHeader({
  currentDate,
  onPreviousMonth,
  onNextMonth,
  onToday,
  vistaAttiva,
  onVistaChange
}: CalendarioHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
      {/* Navigazione mese */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onPreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h2 className="text-2xl font-semibold min-w-[200px] text-center">
            {format(currentDate, 'MMMM yyyy', { locale: it })}
          </h2>

          <Button
            variant="outline"
            size="icon"
            onClick={onNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
        >
          Oggi
        </Button>
      </div>

      {/* Controlli vista */}
      <div className="flex items-center gap-2">
        <Tabs value={vistaAttiva} onValueChange={(v) => onVistaChange(v as 'settimana' | 'mese')}>
          <TabsList>
            <TabsTrigger value="settimana">Settimana</TabsTrigger>
            <TabsTrigger value="mese">Mese</TabsTrigger>
          </TabsList>
        </Tabs>

        <Link href="/turni">
          <Button variant="outline" size="sm">
            <List className="mr-2 h-4 w-4" />
            Vista Lista
          </Button>
        </Link>
      </div>
    </div>
  )
}
