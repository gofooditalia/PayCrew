'use client'

/**
 * Pagina Calendario Turni
 *
 * Vista calendario settimanale/mensile per gestione turni
 * Ispirato a Factorial - griglia dipendente × giorno
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { CalendarioHeader } from './_components/CalendarioHeader'
import { CalendarioGrid } from './_components/CalendarioGrid'
import { TurnoFormDialog } from '@/components/turni/turno-form-dialog'
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
import { turnoCreateSchema } from '@/lib/validation/turni-validator'
import { Skeleton } from '@/components/ui/skeleton'

type TurnoFormData = z.infer<typeof turnoCreateSchema>

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

export default function CalendarioPage() {
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
      console.log('[Calendario] Dipendenti caricati:', data.dipendenti?.length || 0, data.dipendenti)
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
        limit: '100' // Limite API massimo (sufficiente per una settimana)
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

  return (
    <div className="space-y-6 p-6">
      {/* Header principale */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendario Turni</h1>
        <p className="text-muted-foreground">
          Vista settimanale/mensile per gestione turni
        </p>
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
      <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg border">
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

      {/* Dialog Form - Riutilizzo componente esistente */}
      <TurnoFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        turno={turnoInModifica}
        dipendenti={dipendenti}
        sedi={sedi}
        isSubmitting={isSubmitting}
        preFillDipendenteId={preFillData?.dipendenteId}
        preFillData={preFillData?.data ? format(preFillData.data, 'yyyy-MM-dd') : undefined}
      />
    </div>
  )
}
