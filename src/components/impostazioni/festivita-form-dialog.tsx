'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Festivita } from '@/types/impostazioni'
import { festivitaSchema, FestivitaInput } from '@/lib/validation/impostazioni-validator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface FestivitaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  festivita: Festivita | null
  onSubmit: (data: FestivitaInput) => Promise<void>
  isSubmitting: boolean
}

export function FestivitaFormDialog({
  open,
  onOpenChange,
  festivita,
  onSubmit,
  isSubmitting,
}: FestivitaFormDialogProps) {
  const form = useForm<FestivitaInput>({
    resolver: zodResolver(festivitaSchema),
    defaultValues: {
      nome: '',
      data: '',
      ricorrente: false,
      maggiorazione: 0,
    },
  })

  useEffect(() => {
    if (festivita) {
      form.reset({
        nome: festivita.nome,
        data: format(new Date(festivita.data), 'yyyy-MM-dd'),
        ricorrente: festivita.ricorrente,
        maggiorazione: festivita.maggiorazione,
      })
    } else {
      form.reset({
        nome: '',
        data: format(new Date(), 'yyyy-MM-dd'),
        ricorrente: false,
        maggiorazione: 0,
      })
    }
  }, [festivita, form, open])

  const handleSubmit = async (data: FestivitaInput) => {
    await onSubmit(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {festivita ? 'Modifica Festività' : 'Nuova Festività'}
          </DialogTitle>
          <DialogDescription>
            Configura una festività o chiusura aziendale con eventuali maggiorazioni
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Festività</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="es. Natale, Ferragosto, Chiusura estiva"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Un nome descrittivo per identificare questa festività
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    La data della festività (se ricorrente, verrà ripetuta ogni anno)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ricorrente"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ricorrente</FormLabel>
                    <FormDescription>
                      Se attivo, questa festività si ripeterà ogni anno alla stessa data
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maggiorazione"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maggiorazione (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Percentuale di maggiorazione per ore lavorate in questa festività (es. 30 per
                    +30%)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {festivita ? 'Aggiorna' : 'Crea'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
