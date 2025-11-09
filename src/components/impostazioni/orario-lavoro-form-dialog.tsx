'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { OrarioLavoro } from '@/types/impostazioni'
import { orarioLavoroSchema, OrarioLavoroInput } from '@/lib/validation/impostazioni-validator'
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

interface OrarioLavoroFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orarioLavoro: OrarioLavoro | null
  onSubmit: (data: OrarioLavoroInput) => Promise<void>
  isSubmitting: boolean
}

export function OrarioLavoroFormDialog({
  open,
  onOpenChange,
  orarioLavoro,
  onSubmit,
  isSubmitting,
}: OrarioLavoroFormDialogProps) {
  const form = useForm<OrarioLavoroInput>({
    resolver: zodResolver(orarioLavoroSchema),
    defaultValues: {
      nome: '',
      oraInizio: '08:00',
      oraFine: '17:00',
      pausaPranzoInizio: null,
      pausaPranzoFine: null,
      attivo: true,
    },
  })

  useEffect(() => {
    if (orarioLavoro) {
      form.reset({
        nome: orarioLavoro.nome,
        oraInizio: orarioLavoro.oraInizio,
        oraFine: orarioLavoro.oraFine,
        pausaPranzoInizio: orarioLavoro.pausaPranzoInizio,
        pausaPranzoFine: orarioLavoro.pausaPranzoFine,
        attivo: orarioLavoro.attivo,
      })
    } else {
      form.reset({
        nome: '',
        oraInizio: '08:00',
        oraFine: '17:00',
        pausaPranzoInizio: null,
        pausaPranzoFine: null,
        attivo: true,
      })
    }
  }, [orarioLavoro, form, open])

  const handleSubmit = async (data: OrarioLavoroInput) => {
    await onSubmit(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {orarioLavoro ? 'Modifica Orario di Lavoro' : 'Nuovo Orario di Lavoro'}
          </DialogTitle>
          <DialogDescription>
            Configura l&apos;orario di lavoro standard con pausa pranzo opzionale
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Orario</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="es. Full-time standard, Part-time mattina"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Un nome descrittivo per identificare questo orario
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="oraInizio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ora Inizio</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="oraFine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ora Fine</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-4">Pausa Pranzo (opzionale)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pausaPranzoInizio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inizio Pausa</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pausaPranzoFine"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fine Pausa</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="attivo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Attivo</FormLabel>
                    <FormDescription>
                      Rendi questo orario disponibile per la selezione
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
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
                {orarioLavoro ? 'Aggiorna' : 'Crea'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
