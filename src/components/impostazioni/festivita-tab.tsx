'use client'

import { useState, useEffect, useCallback } from 'react'
import { Festivita } from '@/types/impostazioni'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Plus, Loader2 } from 'lucide-react'
import { FestivitaList } from './festivita-list'
import { FestivitaFormDialog } from './festivita-form-dialog'
import { FestivitaInput } from '@/lib/validation/impostazioni-validator'

export function FestivitaTab() {
  const { toast } = useToast()
  const [festivita, setFestivita] = useState<Festivita[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [festivitaInModifica, setFestivitaInModifica] = useState<Festivita | null>(null)

  const caricaFestivita = useCallback(async () => {
    try {
      setLoading(true)
      const currentYear = new Date().getFullYear()
      const response = await fetch(`/api/impostazioni/festivita?anno=${currentYear}`)

      if (!response.ok) {
        throw new Error('Errore nel caricamento delle festività')
      }

      const data = await response.json()
      setFestivita(data)
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile caricare le festività',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    caricaFestivita()
  }, [caricaFestivita])

  const handleSubmit = async (data: FestivitaInput) => {
    try {
      setIsSubmitting(true)

      const url = festivitaInModifica
        ? `/api/impostazioni/festivita/${festivitaInModifica.id}`
        : '/api/impostazioni/festivita'

      const method = festivitaInModifica ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Errore nel salvataggio')
      }

      toast({
        title: 'Successo',
        description: festivitaInModifica
          ? 'Festività aggiornata con successo'
          : 'Festività creata con successo',
      })

      setDialogOpen(false)
      setFestivitaInModifica(null)
      caricaFestivita()
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile salvare la festività',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModifica = (fest: Festivita) => {
    setFestivitaInModifica(fest)
    setDialogOpen(true)
  }

  const handleElimina = async (id: string) => {
    try {
      const response = await fetch(`/api/impostazioni/festivita/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Errore nell\'eliminazione')
      }

      toast({
        title: 'Successo',
        description: 'Festività eliminata con successo',
      })

      caricaFestivita()
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare la festività',
        variant: 'destructive',
      })
    }
  }

  const handleNuovaFestivita = () => {
    setFestivitaInModifica(null)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Festività e Chiusure Aziendali</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configura le festività e le chiusure aziendali con eventuali maggiorazioni
          </p>
        </div>
        <Button onClick={handleNuovaFestivita}>
          <Plus className="h-4 w-4 mr-2" />
          Nuova Festività
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <FestivitaList
          festivita={festivita}
          onModifica={handleModifica}
          onElimina={handleElimina}
        />
      )}

      <FestivitaFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setFestivitaInModifica(null)
        }}
        festivita={festivitaInModifica}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
