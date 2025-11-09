'use client'

import { useState, useEffect, useCallback } from 'react'
import { FasciaOraria } from '@/types/impostazioni'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Plus, Loader2 } from 'lucide-react'
import { FasceOrarieList } from './fasce-orarie-list'
import { FasciaOrariaFormDialog } from './fascia-oraria-form-dialog'
import { FasciaOrariaInput } from '@/lib/validation/impostazioni-validator'

export function FasceOrarieTab() {
  const { toast } = useToast()
  const [fasceOrarie, setFasceOrarie] = useState<FasciaOraria[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [fasciaInModifica, setFasciaInModifica] = useState<FasciaOraria | null>(null)

  const caricaFasceOrarie = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/impostazioni/fasce-orarie')

      if (!response.ok) {
        throw new Error('Errore nel caricamento delle fasce orarie')
      }

      const data = await response.json()
      setFasceOrarie(data)
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile caricare le fasce orarie',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    caricaFasceOrarie()
  }, [caricaFasceOrarie])

  const handleSubmit = async (data: FasciaOrariaInput) => {
    try {
      setIsSubmitting(true)

      const url = fasciaInModifica
        ? `/api/impostazioni/fasce-orarie/${fasciaInModifica.id}`
        : '/api/impostazioni/fasce-orarie'

      const method = fasciaInModifica ? 'PUT' : 'POST'

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
        description: fasciaInModifica
          ? 'Fascia oraria aggiornata con successo'
          : 'Fascia oraria creata con successo',
      })

      setDialogOpen(false)
      setFasciaInModifica(null)
      caricaFasceOrarie()
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile salvare la fascia oraria',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModifica = (fascia: FasciaOraria) => {
    setFasciaInModifica(fascia)
    setDialogOpen(true)
  }

  const handleElimina = async (id: string) => {
    try {
      const response = await fetch(`/api/impostazioni/fasce-orarie/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Errore nell\'eliminazione')
      }

      toast({
        title: 'Successo',
        description: 'Fascia oraria eliminata con successo',
      })

      caricaFasceOrarie()
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare la fascia oraria',
        variant: 'destructive',
      })
    }
  }

  const handleNuovaFascia = () => {
    setFasciaInModifica(null)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Fasce Orarie Predefinite</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configura le fasce orarie con eventuali maggiorazioni per straordinari
          </p>
        </div>
        <Button onClick={handleNuovaFascia}>
          <Plus className="h-4 w-4 mr-2" />
          Nuova Fascia
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <FasceOrarieList
          fasceOrarie={fasceOrarie}
          onModifica={handleModifica}
          onElimina={handleElimina}
        />
      )}

      <FasciaOrariaFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setFasciaInModifica(null)
        }}
        fasciaOraria={fasciaInModifica}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
