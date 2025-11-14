'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const presenzaEditSchema = z.object({
  data: z.string().min(1, 'La data è obbligatoria'),
  entrata: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato orario non valido (HH:mm)').optional().or(z.literal('')),
  uscita: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato orario non valido (HH:mm)').optional().or(z.literal('')),
  nota: z.string().max(500, 'La nota non può superare i 500 caratteri').optional()
}).refine((data) => {
  // Verifica che l'orario di uscita sia successivo a quello di entrata
  if (data.entrata && data.uscita && data.entrata !== '' && data.uscita !== '') {
    const [entraOre, entraMinuti] = data.entrata.split(':').map(Number)
    const [esciOre, esciMinuti] = data.uscita.split(':').map(Number)

    const entraMinutiTotali = entraOre * 60 + entraMinuti
    let esciMinutiTotali = esciOre * 60 + esciMinuti

    // Gestione turni notturni (es. 22:00 - 06:00)
    if (esciMinutiTotali < entraMinutiTotali) {
      esciMinutiTotali += 24 * 60 // Aggiungi 24 ore
    }

    return esciMinutiTotali > entraMinutiTotali
  }
  return true
}, {
  message: "L'orario di uscita deve essere successivo a quello di entrata",
  path: ['uscita']
})

type PresenzaEditFormValues = z.infer<typeof presenzaEditSchema>

interface PresenzaEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  presenza: {
    id: string
    data: string | Date
    entrata: string | Date | null
    uscita: string | Date | null
    nota: string | null
    dipendenti: {
      nome: string
      cognome: string
    }
  } | null
  onSave: () => void
}

export function PresenzaEditDialog({ open, onOpenChange, presenza, onSave }: PresenzaEditDialogProps) {
  const form = useForm<PresenzaEditFormValues>({
    resolver: zodResolver(presenzaEditSchema),
    defaultValues: {
      data: '',
      entrata: '',
      uscita: '',
      nota: ''
    }
  })

  // Popola il form quando viene aperto con i dati della presenza
  useEffect(() => {
    if (presenza && open) {
      const dataStr = presenza.data instanceof Date
        ? presenza.data.toISOString().split('T')[0]
        : new Date(presenza.data).toISOString().split('T')[0]

      const entrataStr = presenza.entrata
        ? (presenza.entrata instanceof Date
          ? presenza.entrata.toTimeString().substring(0, 5)
          : new Date(presenza.entrata).toTimeString().substring(0, 5))
        : ''

      const uscitaStr = presenza.uscita
        ? (presenza.uscita instanceof Date
          ? presenza.uscita.toTimeString().substring(0, 5)
          : new Date(presenza.uscita).toTimeString().substring(0, 5))
        : ''

      form.reset({
        data: dataStr,
        entrata: entrataStr,
        uscita: uscitaStr,
        nota: presenza.nota || ''
      })
    }
  }, [presenza, open, form])

  const onSubmit = async (values: PresenzaEditFormValues) => {
    if (!presenza) return

    try {
      const payload: any = {
        data: values.data,
        nota: values.nota || null
      }

      // Solo se entrata è fornita e non vuota
      if (values.entrata && values.entrata.trim() !== '') {
        payload.entrata = values.entrata
      } else {
        payload.entrata = null
      }

      // Solo se uscita è fornita e non vuota
      if (values.uscita && values.uscita.trim() !== '') {
        payload.uscita = values.uscita
      } else {
        payload.uscita = null
      }

      const response = await fetch(`/api/presenze/${presenza.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Errore durante l\'aggiornamento')
      }

      toast.success('Presenza aggiornata con successo')
      onSave()
      onOpenChange(false)
    } catch (error) {
      console.error('Errore aggiornamento presenza:', error)
      toast.error(error instanceof Error ? error.message : 'Errore durante l\'aggiornamento')
    }
  }

  if (!presenza) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifica Presenza</DialogTitle>
          <DialogDescription>
            Modifica gli orari e le informazioni della presenza per{' '}
            <span className="font-semibold">
              {presenza.dipendenti.nome} {presenza.dipendenti.cognome}
            </span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entrata"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orario Entrata</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        placeholder="HH:mm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="uscita"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orario Uscita</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        placeholder="HH:mm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nota"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Es: ritardo 2 ore, straordinario concordato..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">ℹ️ Calcolo Automatico</p>
              <p>Le ore lavorate e gli straordinari verranno calcolati automaticamente in base agli orari inseriti.</p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Salvataggio...' : 'Salva Modifiche'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
