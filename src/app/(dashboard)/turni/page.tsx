'use client'

/**
 * Pagina Turni - Vista Calendario
 *
 * Vista calendario settimanale/mensile per gestione turni
 * Ispirato a Factorial - griglia dipendente × giorno
 * Include pianificazione multipla per creazione batch turni
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { CalendarioHeader } from './calendario/_components/CalendarioHeader'
import { CalendarioGrid } from './calendario/_components/CalendarioGrid'
import { TurnoFormDialog } from '@/components/turni/turno-form-dialog'
import { PianificazioneMultiplaDialog } from '@/components/turni/pianificazione-multipla-dialog'
import { tipo_turno } from '@prisma/client'
import { toast } from 'sonner'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addWeeks,
  addMonths,
  subWeeks,
  subMonths,
  format
} from 'date-fns'
import { it } from 'date-fns/locale'
import { z } from 'zod'
import { turnoCreateSchema, turniMultipliCreateSchema } from '@/lib/validation/turni-validator'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { CalendarRange } from 'lucide-react'

type TurnoFormData = z.infer<typeof turnoCreateSchema>
type TurniMultipliFormData = z.infer<typeof turniMultipliCreateSchema>

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
  sedeId: string | null
}

interface Sede {
  id: string
  nome: string
}

export default function TurniPage() {
  // Stato
  const [currentDate, setCurrentDate] = useState(new Date())
  const [vistaAttiva, setVistaAttiva] = useState<'settimana' | 'mese'>('settimana')
  const [turni, setTurni] = useState<Turno[]>([])
  const [dipendenti, setDipendenti] = useState<Dipendente[]>([])
  const [sedi, setSedi] = useState<Sede[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pianificazioneDialogOpen, setPianificazioneDialogOpen] = useState(false)
  const [turnoInModifica, setTurnoInModifica] = useState<any>(null)
  const [preFillData, setPreFillData] = useState<{ dipendenteId?: string; data?: Date } | null>(null)

  // Calcola giorni da mostrare in base alla vista - MEMOIZZATO per evitare re-render infiniti
  const giorni = useMemo(() => {
    if (vistaAttiva === 'settimana') {
      const inizio = startOfWeek(currentDate, { weekStartsOn: 1 }) // Lunedì
      const fine = endOfWeek(currentDate, { weekStartsOn: 1 })
      return eachDayOfInterval({ start: inizio, end: fine })
    } else {
      // Vista mese: mostra solo i primi 7 giorni per ora
      // TODO: implementare vista mese completa con scroll orizzontale
      const inizio = startOfMonth(currentDate)
      const fine = new Date(inizio)
      fine.setDate(fine.getDate() + 6)
      return eachDayOfInterval({ start: inizio, end: fine })
    }
  }, [currentDate, vistaAttiva])

  // Carica dipendenti
  const caricaDipendenti = async () => {
    try {
      const response = await fetch('/api/dipendenti?attivo=true&limit=1000')
      if (!response.ok) throw new Error('Errore caricamento dipendenti')

      const data = await response.json()
      setDipendenti(data.dipendenti || [])
    } catch (error) {
      console.error('Errore caricamento dipendenti:', error)
      toast.error('Impossibile caricare i dipendenti')
    }
  }

  // Carica sedi
  const caricaSedi = async () => {
    try {
      const response = await fetch('/api/sedi')
      if (!response.ok) throw new Error('Errore caricamento sedi')

      const data = await response.json()
      setSedi(data.sedi || [])
    } catch (error) {
      console.error('Errore caricamento sedi:', error)
    }
  }

  // Carica turni per il periodo visualizzato
  const caricaTurni = useCallback(async () => {
    try {
      setLoading(true)

      // Calcola date inizio/fine basate su currentDate e vistaAttiva
      let dataInizio: Date
      let dataFine: Date

      if (vistaAttiva === 'settimana') {
        dataInizio = startOfWeek(currentDate, { weekStartsOn: 1 })
        dataFine = endOfWeek(currentDate, { weekStartsOn: 1 })
      } else {
        dataInizio = startOfMonth(currentDate)
        dataFine = new Date(dataInizio)
        dataFine.setDate(dataFine.getDate() + 6)
      }

      const params = new URLSearchParams({
        dataInizio: dataInizio.toISOString().split('T')[0],
        dataFine: dataFine.toISOString().split('T')[0],
        limit: '100' // Limite massimo API
      })

      const response = await fetch(`/api/turni?${params.toString()}`)
      if (!response.ok) throw new Error('Errore caricamento turni')

      const data = await response.json()

      // Converti le date stringa in oggetti Date
      const turniConDate = (data.turni || []).map((t: any) => ({
        ...t,
        data: new Date(t.data)
      }))

      setTurni(turniConDate)
    } catch (error) {
      console.error('Errore caricamento turni:', error)
      toast.error('Impossibile caricare i turni')
    } finally {
      setLoading(false)
    }
  }, [currentDate, vistaAttiva])

  // Caricamento iniziale
  useEffect(() => {
    caricaDipendenti()
    caricaSedi()
  }, [])

  // Ricarica turni quando cambiano la data o la vista
  useEffect(() => {
    if (dipendenti.length > 0) {
      caricaTurni()
    }
  }, [dipendenti.length, caricaTurni])

  // Navigazione
  const handlePreviousMonth = () => {
    if (vistaAttiva === 'settimana') {
      setCurrentDate(prev => subWeeks(prev, 1))
    } else {
      setCurrentDate(prev => subMonths(prev, 1))
    }
  }

  const handleNextMonth = () => {
    if (vistaAttiva === 'settimana') {
      setCurrentDate(prev => addWeeks(prev, 1))
    } else {
      setCurrentDate(prev => addMonths(prev, 1))
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Gestione turno click
  const handleTurnoClick = (turno: Turno) => {
    // Trova il turno completo con tutti i dati
    const turnoCompleto = {
      id: turno.id,
      data: format(turno.data, 'yyyy-MM-dd'),
      oraInizio: turno.oraInizio,
      oraFine: turno.oraFine,
      pausaPranzoInizio: turno.pausaPranzoInizio || undefined,
      pausaPranzoFine: turno.pausaPranzoFine || undefined,
      tipoTurno: turno.tipoTurno,
      dipendenteId: turno.dipendenteId,
      sedeId: dipendenti.find(d => d.id === turno.dipendenteId)?.sedeId || undefined
    }

    setTurnoInModifica(turnoCompleto)
    setPreFillData(null)
    setDialogOpen(true)
  }

  // Gestione cella vuota click
  const handleCellaVuotaClick = (dipendenteId: string, data: Date) => {
    setTurnoInModifica(null)
    setPreFillData({ dipendenteId, data })
    setDialogOpen(true)
  }

  // Submit form
  const handleSubmit = async (data: TurnoFormData) => {
    setIsSubmitting(true)
    try {
      const url = turnoInModifica
        ? `/api/turni/${turnoInModifica.id}`
        : '/api/turni'

      const method = turnoInModifica ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Errore nel salvataggio')
      }

      toast.success(turnoInModifica
        ? 'Turno aggiornato con successo'
        : 'Turno creato con successo')

      setDialogOpen(false)
      setTurnoInModifica(null)
      setPreFillData(null)
      await caricaTurni()
    } catch (error: any) {
      console.error('Errore salvataggio turno:', error)
      toast.error(error.message || 'Impossibile salvare il turno')
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete turno
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/turni/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Errore nell\'eliminazione del turno')
      }

      toast.success('Turno eliminato con successo')
      await caricaTurni()
    } catch (error) {
      console.error('Errore eliminazione turno:', error)
      toast.error('Impossibile eliminare il turno')
      throw error
    }
  }

  // Pianificazione multipla
  const handlePianificazioneMultipla = async (data: TurniMultipliFormData) => {
    setIsSubmitting(true)

    // Mostra toast di caricamento
    const loadingToast = toast.loading('Generazione turni in corso... Questa operazione potrebbe richiedere alcuni secondi. Non chiudere la pagina.', {
      duration: Infinity, // Non scompare automaticamente
    })

    try {
      const response = await fetch('/api/turni/multipli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Errore nella creazione dei turni')
      }

      const result = await response.json()

      // Dismissi il toast di caricamento e mostra successo
      toast.dismiss(loadingToast)
      toast.success(result.message || `${result.count} turni creati con successo`)

      setPianificazioneDialogOpen(false)
      await caricaTurni()
    } catch (error: any) {
      console.error('Errore pianificazione multipla:', error)
      // Dismissi il toast di caricamento e mostra errore
      toast.dismiss(loadingToast)
      toast.error(error.message || 'Impossibile creare i turni')
      // Rilancia l'errore per impedire il reset del form nel dialog
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header principale */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Turni</h1>
          <p className="text-muted-foreground">
            Gestisci i turni e la pianificazione del personale
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPianificazioneDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <CalendarRange className="mr-2 h-4 w-4" />
            Pianificazione Multipla
          </Button>
        </div>
      </div>

      {/* Header calendario */}
      <CalendarioHeader
        currentDate={currentDate}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        vistaAttiva={vistaAttiva}
        onVistaChange={setVistaAttiva}
      />

      {/* Legenda colori */}
      <div className="flex flex-wrap gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
        <div className="text-sm font-medium text-muted-foreground">Legenda:</div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-300"></div>
          <span className="text-sm">Mattina</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-100 border-2 border-orange-300"></div>
          <span className="text-sm">Pranzo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-300"></div>
          <span className="text-sm">Sera</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-pink-100 border-2 border-pink-300"></div>
          <span className="text-sm">Spezzato</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-indigo-100 border-2 border-indigo-300"></div>
          <span className="text-sm">Notte</span>
        </div>
      </div>

      {/* Griglia calendario */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <CalendarioGrid
          giorni={giorni}
          dipendenti={dipendenti}
          turni={turni}
          onTurnoClick={handleTurnoClick}
          onCellaVuotaClick={handleCellaVuotaClick}
        />
      )}

      {/* Dialog Form Turno Singolo */}
      <TurnoFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        turno={turnoInModifica}
        dipendenti={dipendenti}
        sedi={sedi}
        isSubmitting={isSubmitting}
        preFillDipendenteId={preFillData?.dipendenteId}
        preFillData={preFillData?.data ? format(preFillData.data, 'yyyy-MM-dd') : undefined}
      />

      {/* Dialog Pianificazione Multipla */}
      <PianificazioneMultiplaDialog
        open={pianificazioneDialogOpen}
        onOpenChange={setPianificazioneDialogOpen}
        onSubmit={handlePianificazioneMultipla}
        dipendenti={dipendenti}
        sedi={sedi}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
