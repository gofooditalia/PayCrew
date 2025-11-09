'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FasciaOraria } from '@/types/impostazioni'
import { fasciaOrariaSchema, FasciaOrariaInput } from '@/lib/validation/impostazioni-validator'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'

interface FasciaOrariaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fasciaOraria: FasciaOraria | null
  onSubmit: (data: FasciaOrariaInput) => Promise<void>
  isSubmitting: boolean
}

const tipiTurno = [
  { value: 'MATTINA', label: 'Mattina' },
  { value: 'PRANZO', label: 'Pranzo' },
  { value: 'SERA', label: 'Sera' },
  { value: 'NOTTE', label: 'Notte' },
  { value: 'SPEZZATO', label: 'Spezzato' },
]

export function FasciaOrariaFormDialog({
  open,
  onOpenChange,
  fasciaOraria,
  onSubmit,
  isSubmitting,
}: FasciaOrariaFormDialogProps) {
  const form = useForm<FasciaOrariaInput>({
    resolver: zodResolver(fasciaOrariaSchema),
    defaultValues: {
      nome: '',
      tipoTurno: 'MATTINA',
      oraInizio: '08:00',
      oraFine: '13:00',
      maggiorazione: 0,
      attivo: true,
    },
  })

  useEffect(() => {
    if (fasciaOraria) {
      form.reset({
        nome: fasciaOraria.nome,
        tipoTurno: fasciaOraria.tipoTurno,
        oraInizio: fasciaOraria.oraInizio,
        oraFine: fasciaOraria.oraFine,
        maggiorazione: fasciaOraria.maggiorazione,
        attivo: fasciaOraria.attivo,
      })
    } else {
      form.reset({
        nome: '',
        tipoTurno: 'MATTINA',
        oraInizio: '08:00',
        oraFine: '13:00',
        maggiorazione: 0,
        attivo: true,
      })
    }
  }, [fasciaOraria, form, open])

  const handleSubmit = async (data: FasciaOrariaInput) => {
    await onSubmit(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {fasciaOraria ? 'Modifica Fascia Oraria' : 'Nuova Fascia Oraria'}
          </DialogTitle>
          <DialogDescription>
            Configura una fascia oraria predefinita con eventuali maggiorazioni
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Fascia</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="es. Turno Mattina, Turno Serale Festivo"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Un nome descrittivo per identificare questa fascia oraria
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipoTurno"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo Turno</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona il tipo di turno" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tipiTurno.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Categoria del turno (influenza filtri e reportistica)
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
                    Percentuale di maggiorazione per ore lavorate in questa fascia (es. 20 per
                    +20%)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attivo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Attiva</FormLabel>
                    <FormDescription>
                      Rendi questa fascia oraria disponibile per la selezione
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
                {fasciaOraria ? 'Aggiorna' : 'Crea'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
