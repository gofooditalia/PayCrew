'use client'

/**
 * Pagina Turni
 *
 * Gestione completa dei turni con filtri, CRUD e visualizzazione lista
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Turno } from '@/types/turni'
import { tipo_turno } from '@prisma/client'
import { TurniList } from '@/components/turni/turni-list'
import { TurniListSkeleton } from '@/components/turni/turni-list-skeleton'
import { TurnoFormDialog } from '@/components/turni/turno-form-dialog'
import { TurniFiltri } from '@/components/turni/turni-filters'
import { PianificazioneMultiplaDialog } from '@/components/turni/pianificazione-multipla-dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Plus, Loader2, CalendarDays, CalendarRange, Sparkles, X } from 'lucide-react'
import { z } from 'zod'
import { turnoCreateSchema, turniMultipliCreateSchema } from '@/lib/validation/turni-validator'
import Link from 'next/link'

type TurnoFormData = z.infer<typeof turnoCreateSchema>
type TurniMultipliFormData = z.infer<typeof turniMultipliCreateSchema>

export default function TurniPage() {
  const router = useRouter()

  const [turni, setTurni] = useState<Turno[]>([])
  const [dipendenti, setDipendenti] = useState<Array<{ id: string; nome: string; cognome: string; sedeId: string | null }>>([])
  const [sedi, setSedi] = useState<Array<{ id: string; nome: string }>>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [pianificazioneDialogOpen, setPianificazioneDialogOpen] = useState(false)
  const [turnoInModifica, setTurnoInModifica] = useState<Turno | null>(null)
  const [showBanner, setShowBanner] = useState(true)

  const [filtri, setFiltri] = useState<{
    dipendenteId?: string
    sedeId?: string
    tipoTurno?: tipo_turno
    dataInizio?: string
    dataFine?: string
  }>({})

  // Controlla se il banner è stato già dismisso
  useEffect(() => {
    const dismissed = localStorage.getItem('turni-fasce-orarie-banner-dismissed')
    if (dismissed === 'true') {
      setShowBanner(false)
    }
  }, [])

  // Funzione per dismissare il banner
  const dismissBanner = () => {
    localStorage.setItem('turni-fasce-orarie-banner-dismissed', 'true')
    setShowBanner(false)
  }

  // Carica turni
  const caricaTurni = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filtri.dipendenteId) params.append('dipendenteId', filtri.dipendenteId)
      if (filtri.sedeId) params.append('sedeId', filtri.sedeId)
      if (filtri.tipoTurno) params.append('tipoTurno', filtri.tipoTurno)
      if (filtri.dataInizio) params.append('dataInizio', filtri.dataInizio)
      if (filtri.dataFine) params.append('dataFine', filtri.dataFine)

      const response = await fetch(`/api/turni?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Errore nel caricamento dei turni')
      }

      const data = await response.json()
      setTurni(data.turni || [])
    } catch (error) {
      console.error('Errore caricamento turni:', error)
      toast.error('Impossibile caricare i turni')
    } finally {
      setLoading(false)
    }
  }, [filtri])

  // Carica dipendenti
  const caricaDipendenti = async () => {
    try {
      const response = await fetch('/api/dipendenti?attivo=true&limit=1000')
      if (!response.ok) throw new Error('Errore caricamento dipendenti')

      const data = await response.json()
      setDipendenti(data.dipendenti || [])
    } catch (error) {
      console.error('Errore caricamento dipendenti:', error)
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

  // Caricamento iniziale
  useEffect(() => {
    caricaDipendenti()
    caricaSedi()
  }, [])

  // Ricarica turni quando cambiano i filtri
  useEffect(() => {
    caricaTurni()
  }, [caricaTurni])

  const handleCreate = () => {
    setTurnoInModifica(null)
    setDialogOpen(true)
  }

  const handleEdit = (turno: Turno) => {
    setTurnoInModifica(turno)
    setDialogOpen(true)
  }

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
      await caricaTurni()
    } catch (error: any) {
      console.error('Errore salvataggio turno:', error)
      toast.error(error.message || 'Impossibile salvare il turno')
      // Rilancia l'errore per impedire il reset del form nel dialog
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Turni</h1>
          <p className="text-muted-foreground">
            Gestisci i turni e la pianificazione del personale
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setPianificazioneDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <CalendarRange className="mr-2 h-4 w-4" />
            Pianificazione Multipla
          </Button>
          <Button
            onClick={handleCreate}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Turno
          </Button>
        </div>
      </div>

      {/* Banner Novità Fasce Orarie */}
      {showBanner && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    Novità: Gestione Fasce Orarie e Pause Pranzo
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    Configura fasce orarie personalizzate e pause pranzo per velocizzare la creazione dei turni.
                    Gli orari si compileranno automaticamente in base al tipo turno selezionato!
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900"
                  onClick={dismissBanner}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Link href="/impostazioni">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Vai alle Impostazioni
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
                  onClick={dismissBanner}
                >
                  Ho capito
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtri */}
      <TurniFiltri
        dipendenti={dipendenti}
        sedi={sedi}
        onFilterChange={setFiltri}
      />

      {/* Contenuto */}
      {loading ? (
        <TurniListSkeleton rows={8} />
      ) : (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Totale Turni
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold">{turni.length}</p>
            </div>
          </div>

          {/* Lista turni */}
          <TurniList
            turni={turni}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      )}

      {/* Dialog Form */}
      <TurnoFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        turno={turnoInModifica}
        dipendenti={dipendenti}
        sedi={sedi}
        isSubmitting={isSubmitting}
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
