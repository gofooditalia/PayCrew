'use client'

/**
 * Pagina Turni - Vista Calendario
 *
 * Vista calendario settimanale/mensile per gestione turni
 * Ispirato a Factorial - griglia dipendente × giorno
 * Include pianificazione multipla per creazione batch turni
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { CalendarioToolbar } from './calendario/_components/CalendarioToolbar'
import { CalendarioGrid } from './calendario/_components/CalendarioGrid'
import { CalendarioMeseGrid } from './calendario/_components/CalendarioMeseGrid'
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

// Tipi per gestione drag & drop
interface TurnoSpostamento {
  turnoId: string
  fromDate: Date
  toDate: Date
  fromDipendenteId: string
  toDipendenteId: string
}

interface TurnoDuplicazione {
  turnoOriginale: Turno
  toDate: Date
  toDipendenteId: string
}

interface TurniPending {
  spostamenti: TurnoSpostamento[]
  duplicazioni: TurnoDuplicazione[]
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
  const [sedeSelezionata, setSedeSelezionata] = useState<string>('tutte')

  // Stato per drag & drop
  const [turniPending, setTurniPending] = useState<TurniPending>({
    spostamenti: [],
    duplicazioni: []
  })
  const [isDragging, setIsDragging] = useState(false)
  const [isCtrlPressed, setIsCtrlPressed] = useState(false)

  // Monitor tasto CTRL per duplicazione
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) { // metaKey per Mac
        setIsCtrlPressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        setIsCtrlPressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

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
      // Vista mese: intero mese con giorni mese precedente/successivo per riempire griglia
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      const inizio = startOfWeek(monthStart, { weekStartsOn: 1 })
      const fine = endOfWeek(monthEnd, { weekStartsOn: 1 })

      return eachDayOfInterval({ start: inizio, end: fine })
    }
  }, [currentDate, vistaAttiva])

  // Filtra dipendenti in base alla sede selezionata
  const dipendentiFiltrati = useMemo(() => {
    if (sedeSelezionata === 'tutte') {
      return dipendenti
    }
    if (sedeSelezionata === 'nessuna') {
      return dipendenti.filter(d => !d.sedeId)
    }
    return dipendenti.filter(d => d.sedeId === sedeSelezionata)
  }, [dipendenti, sedeSelezionata])

  // Calcola se ci sono modifiche pending
  const hasPendingChanges = useMemo(() => {
    return turniPending.spostamenti.length > 0 || turniPending.duplicazioni.length > 0
  }, [turniPending])

  const countPendingChanges = useMemo(() => {
    return turniPending.spostamenti.length + turniPending.duplicazioni.length
  }, [turniPending])

  // Verifica se un turno è in pending (spostato)
  const isTurnoPending = useCallback((turnoId: string) => {
    return turniPending.spostamenti.some(s => s.turnoId === turnoId)
  }, [turniPending.spostamenti])

  // Verifica se una cella è valida per il drop (vuota)
  const isCellaValida = useCallback((dipendenteId: string, data: Date) => {
    const dataKey = format(data, 'yyyy-MM-dd')

    // Controlla turni esistenti
    const hasTurnoEsistente = turni.some(t => {
      const turnoDataKey = format(t.data, 'yyyy-MM-dd')
      return t.dipendenteId === dipendenteId && turnoDataKey === dataKey
    })

    if (hasTurnoEsistente) return false

    // Controlla duplicazioni pending
    const hasDuplicazionePending = turniPending.duplicazioni.some(d => {
      const dupDataKey = format(d.toDate, 'yyyy-MM-dd')
      return d.toDipendenteId === dipendenteId && dupDataKey === dataKey
    })

    if (hasDuplicazionePending) return false

    // Controlla spostamenti pending (destinazione)
    const hasSpostamentoPending = turniPending.spostamenti.some(s => {
      const spostDataKey = format(s.toDate, 'yyyy-MM-dd')
      return s.toDipendenteId === dipendenteId && spostDataKey === dataKey
    })

    return !hasSpostamentoPending
  }, [turni, turniPending])

  // Ottieni turni "virtuali" includendo spostamenti e duplicazioni pending
  const turniVirtuali = useMemo(() => {
    const virtuali = [...turni]

    // Aggiungi spostamenti come turni temporanei nella posizione di destinazione
    turniPending.spostamenti.forEach(spost => {
      // Trova il turno originale
      const turnoOriginale = turni.find(t => t.id === spost.turnoId)
      if (turnoOriginale) {
        virtuali.push({
          ...turnoOriginale,
          id: `temp-move-${spost.turnoId}-${format(spost.toDate, 'yyyy-MM-dd')}`,
          data: spost.toDate,
          dipendenteId: spost.toDipendenteId
        })
      }
    })

    // Aggiungi duplicazioni come turni temporanei
    turniPending.duplicazioni.forEach(dup => {
      virtuali.push({
        ...dup.turnoOriginale,
        id: `temp-dup-${dup.turnoOriginale.id}-${format(dup.toDate, 'yyyy-MM-dd')}`,
        data: dup.toDate,
        dipendenteId: dup.toDipendenteId
      })
    })

    return virtuali
  }, [turni, turniPending.spostamenti, turniPending.duplicazioni])

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
        // Vista mese: intero mese con giorni mese precedente/successivo
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        dataInizio = startOfWeek(monthStart, { weekStartsOn: 1 })
        dataFine = endOfWeek(monthEnd, { weekStartsOn: 1 })
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

  // Gestione click giorno nella vista mese
  const handleDayClick = (data: Date) => {
    // Apre dialog per creare nuovo turno in quella data
    setTurnoInModifica(null)
    setPreFillData({ data })
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

  // Handler drop turno (sposta o duplica)
  const handleDropTurno = useCallback((
    turno: Turno,
    targetDipendenteId: string,
    targetData: Date,
    isDuplica: boolean
  ) => {
    // Verifica se la cella target è valida
    if (!isCellaValida(targetDipendenteId, targetData)) {
      toast.error('Impossibile: cella già occupata')
      return false
    }

    if (isDuplica) {
      // Aggiungi duplicazione
      setTurniPending(prev => ({
        ...prev,
        duplicazioni: [
          ...prev.duplicazioni,
          {
            turnoOriginale: turno,
            toDate: targetData,
            toDipendenteId: targetDipendenteId
          }
        ]
      }))
      toast.success('Turno duplicato. Ricorda di confermare la programmazione.')
    } else {
      // Aggiungi spostamento
      setTurniPending(prev => ({
        ...prev,
        spostamenti: [
          ...prev.spostamenti,
          {
            turnoId: turno.id,
            fromDate: turno.data,
            toDate: targetData,
            fromDipendenteId: turno.dipendenteId,
            toDipendenteId: targetDipendenteId
          }
        ]
      }))
      toast.success('Turno spostato. Ricorda di confermare la programmazione.')
    }

    return true
  }, [isCellaValida])

  // Annulla modifiche pending
  const handleAnnullaModifiche = useCallback(() => {
    setTurniPending({ spostamenti: [], duplicazioni: [] })
    toast.info('Modifiche annullate')
  }, [])

  // Conferma modifiche pending (salva sul server)
  const handleConfermaModifiche = async () => {
    setIsSubmitting(true)
    const loadingToast = toast.loading('Salvataggio modifiche in corso...')

    try {
      // Converti Date in stringhe YYYY-MM-DD per l'API
      const payload = {
        spostamenti: turniPending.spostamenti.map(s => ({
          turnoId: s.turnoId,
          fromDate: format(s.fromDate, 'yyyy-MM-dd'),
          toDate: format(s.toDate, 'yyyy-MM-dd'),
          fromDipendenteId: s.fromDipendenteId,
          toDipendenteId: s.toDipendenteId
        })),
        duplicazioni: turniPending.duplicazioni.map(d => ({
          turnoOriginale: {
            ...d.turnoOriginale,
            data: format(d.turnoOriginale.data, 'yyyy-MM-dd')
          },
          toDate: format(d.toDate, 'yyyy-MM-dd'),
          toDipendenteId: d.toDipendenteId
        }))
      }

      const response = await fetch('/api/turni/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Errore nel salvataggio delle modifiche')
      }

      const result = await response.json()

      toast.dismiss(loadingToast)
      toast.success(result.message || 'Modifiche salvate con successo')

      // Reset pending e ricarica turni
      setTurniPending({ spostamenti: [], duplicazioni: [] })
      await caricaTurni()
    } catch (error: any) {
      console.error('Errore conferma modifiche:', error)
      toast.dismiss(loadingToast)
      toast.error(error.message || 'Impossibile salvare le modifiche')
    } finally {
      setIsSubmitting(false)
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
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Toolbar compatta unica */}
      <CalendarioToolbar
        currentDate={currentDate}
        vistaAttiva={vistaAttiva}
        sedeSelezionata={sedeSelezionata}
        sedi={sedi}
        dipendentiFiltrati={dipendentiFiltrati.length}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        onVistaChange={setVistaAttiva}
        onSedeChange={setSedeSelezionata}
        onPianificazioneClick={() => setPianificazioneDialogOpen(true)}
        hasPendingChanges={hasPendingChanges}
        countPendingChanges={countPendingChanges}
        onAnnullaModifiche={handleAnnullaModifiche}
        onConfermaModifiche={handleConfermaModifiche}
      />

      {/* Griglia calendario - occupa tutto lo spazio rimanente */}
      <div className="flex-1 mt-3 overflow-hidden">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : vistaAttiva === 'settimana' ? (
          <CalendarioGrid
            giorni={giorni}
            dipendenti={dipendentiFiltrati}
            turni={turniVirtuali}
            onTurnoClick={handleTurnoClick}
            onCellaVuotaClick={handleCellaVuotaClick}
            onDropTurno={handleDropTurno}
            isTurnoPending={isTurnoPending}
            isCellaValida={isCellaValida}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            isCtrlPressed={isCtrlPressed}
          />
        ) : (
          <CalendarioMeseGrid
            currentDate={currentDate}
            dipendenti={dipendentiFiltrati}
            turni={turni}
            onDayClick={handleDayClick}
            onTurnoClick={handleTurnoClick}
          />
        )}
      </div>

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
