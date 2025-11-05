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
import { useToast } from '@/hooks/use-toast'
import { Plus, Loader2, CalendarDays, CalendarRange } from 'lucide-react'
import { z } from 'zod'
import { turnoCreateSchema, turniMultipliCreateSchema } from '@/lib/validation/turni-validator'

type TurnoFormData = z.infer<typeof turnoCreateSchema>
type TurniMultipliFormData = z.infer<typeof turniMultipliCreateSchema>

export default function TurniPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [turni, setTurni] = useState<Turno[]>([])
  const [dipendenti, setDipendenti] = useState<Array<{ id: string; nome: string; cognome: string }>>([])
  const [sedi, setSedi] = useState<Array<{ id: string; nome: string }>>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [pianificazioneDialogOpen, setPianificazioneDialogOpen] = useState(false)
  const [turnoInModifica, setTurnoInModifica] = useState<Turno | null>(null)

  const [filtri, setFiltri] = useState<{
    dipendenteId?: string
    sedeId?: string
    tipoTurno?: tipo_turno
    dataInizio?: string
    dataFine?: string
  }>({})

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
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i turni',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [filtri, toast])

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

      toast({
        title: 'Successo',
        description: turnoInModifica
          ? 'Turno aggiornato con successo'
          : 'Turno creato con successo'
      })

      setDialogOpen(false)
      setTurnoInModifica(null)
      await caricaTurni()
    } catch (error: any) {
      console.error('Errore salvataggio turno:', error)
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile salvare il turno',
        variant: 'destructive'
      })
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

      toast({
        title: 'Successo',
        description: 'Turno eliminato con successo'
      })

      await caricaTurni()
    } catch (error) {
      console.error('Errore eliminazione turno:', error)
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare il turno',
        variant: 'destructive'
      })
      throw error
    }
  }

  const handlePianificazioneMultipla = async (data: TurniMultipliFormData) => {
    setIsSubmitting(true)
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

      toast({
        title: 'Successo',
        description: result.message || `${result.count} turni creati con successo`
      })

      setPianificazioneDialogOpen(false)
      await caricaTurni()
    } catch (error: any) {
      console.error('Errore pianificazione multipla:', error)
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile creare i turni',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Turni</h1>
          <p className="text-muted-foreground">
            Gestisci i turni e la pianificazione del personale
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPianificazioneDialogOpen(true)}>
            <CalendarRange className="mr-2 h-4 w-4" />
            Pianificazione Multipla
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Turno
          </Button>
        </div>
      </div>

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
