'use client'

import { useState, useMemo } from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  UserIcon,
  PlusIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

interface Dipendente {
  id: string
  nome: string
  cognome: string
}

interface Sede {
  id: string
  nome: string
}

interface Turno {
  id: string
  data: Date
  oraInizio: string
  oraFine: string
  tipoTurno: 'MATTINA' | 'PRANZO' | 'SERA' | 'NOTTE' | 'SPEZZATO'
  dipendenti: Dipendente
  sedi?: Sede
}

interface TurniCalendarProps {
  turni: Turno[]
  dipendenti: Dipendente[]
  sedi: Sede[]
  onTurnoClick?: (turno: Turno) => void
  onDateClick?: (date: Date) => void
  onAddTurno?: (date: Date) => void
}

const TIPI_TURNO_CONFIG = {
  MATTINA: { label: 'Mattina', icon: '🌅', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  PRANZO: { label: 'Pranzo', icon: '☀️', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  SERA: { label: 'Sera', icon: '🌆', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  NOTTE: { label: 'Notte', icon: '🌙', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  SPEZZATO: { label: 'Spezzato', icon: '🔄', color: 'bg-purple-100 text-purple-800 border-purple-200' }
}

const GIORNI_SETTIMANA = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const MESI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']

export default function TurniCalendar({ 
  turni, 
  dipendenti, 
  sedi,
  onTurnoClick,
  onDateClick,
  onAddTurno
}: TurniCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [filters, setFilters] = useState({
    dipendenteId: '',
    sedeId: ''
  })

  // Calcola giorni del mese
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Aggiungi giorni vuoti all'inizio
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Aggiungi giorni del mese
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }, [currentDate])

  // Calcola giorni della settimana
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    startOfWeek.setDate(startOfWeek.getDate() - day)

    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      days.push(date)
    }

    return days
  }, [currentDate])

  // Filtra turni in base ai filtri
  const filteredTurni = useMemo(() => {
    return turni.filter(turno => {
      const dipendenteMatch = !filters.dipendenteId || turno.dipendenti.id === filters.dipendenteId
      const sedeMatch = !filters.sedeId || 
        (turno.sedi && turno.sedi.id === filters.sedeId)
      return dipendenteMatch && sedeMatch
    })
  }, [turni, filters])

  // Raggruppa turni per data
  const turniPerData = useMemo(() => {
    return filteredTurni.reduce((acc, turno) => {
      const dateKey = new Date(turno.data).toDateString()
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(turno)
      return acc
    }, {} as Record<string, Turno[]>)
  }, [filteredTurni])

  // Navigazione
  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
  }

  const navigateWeek = (direction: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() + (direction * 7))
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({ dipendenteId: '', sedeId: '' })
  }

  // Renderizza un giorno del calendario
  const renderDay = (date: Date | null, isWeekView = false) => {
    if (!date) {
      return <div className="h-24 sm:h-32 border border-border/50"></div>
    }

    const dateKey = date.toDateString()
    const dayTurni = turniPerData[dateKey] || []
    const isToday = date.toDateString() === new Date().toDateString()
    const isCurrentMonth = date.getMonth() === currentDate.getMonth()

    return (
      <div 
        className={`
          h-24 sm:h-32 border border-border/50 p-1 cursor-pointer transition-colors
          ${isToday ? 'bg-primary/5 border-primary/50' : 'hover:bg-muted/50'}
          ${!isCurrentMonth && viewMode === 'month' ? 'opacity-50' : ''}
        `}
        onClick={() => onDateClick?.(date)}
      >
        <div className="flex justify-between items-start mb-1">
          <span className={`
            text-sm font-medium
            ${isToday ? 'text-primary' : 'text-foreground'}
          `}>
            {date.getDate()}
          </span>
          {onAddTurno && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onAddTurno(date)
              }}
              className="h-6 w-6 p-0"
            >
              <PlusIcon className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <div className="space-y-1 overflow-y-auto max-h-16 sm:max-h-20">
          {dayTurni.map((turno) => {
            const tipoConfig = TIPI_TURNO_CONFIG[turno.tipoTurno]
            return (
              <div
                key={turno.id}
                className={`
                  text-xs p-1 rounded cursor-pointer transition-colors
                  ${tipoConfig.color} hover:opacity-80
                `}
                onClick={(e) => {
                  e.stopPropagation()
                  onTurnoClick?.(turno)
                }}
                title={`${turno.dipendenti.nome} ${turno.dipendenti.cognome} - ${turno.oraInizio}-${turno.oraFine}`}
              >
                <div className="flex items-center gap-1 truncate">
                  <span className="shrink-0">{tipoConfig.icon}</span>
                  <span className="truncate font-medium">
                    {turno.dipendenti.nome.split(' ')[0]}
                  </span>
                </div>
                <div className="text-xs opacity-75">
                  {turno.oraInizio}-{turno.oraFine}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const currentMonth = MESI[currentDate.getMonth()]
  const currentYear = currentDate.getFullYear()

  return (
    <div className="animate-fade-in w-full space-y-6">
      {/* Header con controlli */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                {viewMode === 'month' 
                  ? `${currentMonth} ${currentYear}`
                  : `Settimana del ${weekDays[0]?.getDate()} ${currentMonth}`
                }
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewMode === 'month' ? navigateMonth(-1) : navigateWeek(-1)}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                >
                  Oggi
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewMode === 'month' ? navigateMonth(1) : navigateWeek(1)}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* View mode selector */}
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                >
                  Mese
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                >
                  Settimana
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filtri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FunnelIcon className="h-4 w-4" />
            Filtri Calendario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm">Dipendente</Label>
              <select
                value={filters.dipendenteId}
                onChange={(e) => handleFilterChange('dipendenteId', e.target.value)}
                className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200"
              >
                <option value="">Tutti i dipendenti</option>
                {dipendenti.map((dipendente) => (
                  <option key={dipendente.id} value={dipendente.id}>
                    {dipendente.nome} {dipendente.cognome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-sm">Sede</Label>
              <select
                value={filters.sedeId}
                onChange={(e) => handleFilterChange('sedeId', e.target.value)}
                className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200"
              >
                <option value="">Tutte le sedi</option>
                {sedi.map((sede) => (
                  <option key={sede.id} value={sede.id}>
                    {sede.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                Pulisci filtri
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendario */}
      <Card>
        <CardContent className="p-0">
          {viewMode === 'month' ? (
            /* Vista Mese */
            <div>
              {/* Header giorni settimana */}
              <div className="grid grid-cols-7 border-b border-border">
                {GIORNI_SETTIMANA.map((giorno) => (
                  <div key={giorno} className="p-2 text-center text-sm font-medium text-muted-foreground border-r border-border last:border-r-0">
                    {giorno}
                  </div>
                ))}
              </div>
              
              {/* Griglia giorni */}
              <div className="grid grid-cols-7">
                {monthDays.map((date, index) => (
                  <div key={index}>
                    {renderDay(date)}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Vista Settimana */
            <div>
              {/* Header giorni settimana */}
              <div className="grid grid-cols-7 border-b border-border">
                {weekDays.map((date, index) => (
                  <div key={index} className="p-2 text-center border-r border-border last:border-r-0">
                    <div className="text-sm font-medium text-muted-foreground">
                      {GIORNI_SETTIMANA[index]}
                    </div>
                    <div className="text-lg font-bold text-foreground">
                      {date.getDate()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {date.toLocaleDateString('it-IT', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Griglia giorni */}
              <div className="grid grid-cols-7">
                {weekDays.map((date, index) => (
                  <div key={index}>
                    {renderDay(date, true)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legenda tipi turno */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legenda Turni</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(TIPI_TURNO_CONFIG).map(([tipo, config]) => (
              <Badge key={tipo} className={config.color}>
                {config.icon} {config.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}