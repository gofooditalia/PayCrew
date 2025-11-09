'use client'

import { useState, useEffect, useCallback } from 'react'
import { OrarioLavoro } from '@/types/impostazioni'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Plus, Loader2 } from 'lucide-react'
import { OrariLavoroList } from './orari-lavoro-list'
import { OrarioLavoroFormDialog } from './orario-lavoro-form-dialog'
import { OrarioLavoroInput } from '@/lib/validation/impostazioni-validator'

export function OrariLavoroTab() {
  const { toast } = useToast()
  const [orariLavoro, setOrariLavoro] = useState<OrarioLavoro[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [orarioInModifica, setOrarioInModifica] = useState<OrarioLavoro | null>(null)

  const caricaOrariLavoro = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/impostazioni/orari-lavoro')

      if (!response.ok) {
        throw new Error('Errore nel caricamento degli orari di lavoro')
      }

      const data = await response.json()
      setOrariLavoro(data)
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile caricare gli orari di lavoro',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    caricaOrariLavoro()
  }, [caricaOrariLavoro])

  const handleSubmit = async (data: OrarioLavoroInput) => {
    try {
      setIsSubmitting(true)

      const url = orarioInModifica
        ? `/api/impostazioni/orari-lavoro/${orarioInModifica.id}`
        : '/api/impostazioni/orari-lavoro'

      const method = orarioInModifica ? 'PUT' : 'POST'

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
        description: orarioInModifica
          ? 'Orario di lavoro aggiornato con successo'
          : 'Orario di lavoro creato con successo',
      })

      setDialogOpen(false)
      setOrarioInModifica(null)
      caricaOrariLavoro()
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile salvare l\'orario di lavoro',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModifica = (orario: OrarioLavoro) => {
    setOrarioInModifica(orario)
    setDialogOpen(true)
  }

  const handleElimina = async (id: string) => {
    try {
      const response = await fetch(`/api/impostazioni/orari-lavoro/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Errore nell\'eliminazione')
      }

      toast({
        title: 'Successo',
        description: 'Orario di lavoro eliminato con successo',
      })

      caricaOrariLavoro()
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare l\'orario di lavoro',
        variant: 'destructive',
      })
    }
  }

  const handleNuovoOrario = () => {
    setOrarioInModifica(null)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Orari di Lavoro Standard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configura gli orari di lavoro standard della tua azienda
          </p>
        </div>
        <Button onClick={handleNuovoOrario}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Orario
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <OrariLavoroList
          orariLavoro={orariLavoro}
          onModifica={handleModifica}
          onElimina={handleElimina}
        />
      )}

      <OrarioLavoroFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setOrarioInModifica(null)
        }}
        orarioLavoro={orarioInModifica}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
