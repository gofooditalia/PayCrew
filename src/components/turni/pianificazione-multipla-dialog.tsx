'use client'

/**
 * Pianificazione Multipla Dialog Component
 *
 * Dialog per creare turni multipli in batch (pianificazione settimanale/mensile)
 */

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { turniMultipliCreateSchema } from '@/lib/validation/turni-validator'
import { TIPI_TURNO_CONFIG } from '@/types/turni'
import { tipo_turno } from '@prisma/client'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Loader2, CalendarRange } from 'lucide-react'
import { z } from 'zod'

type TurniMultipliFormData = z.infer<typeof turniMultipliCreateSchema>

interface PianificazioneMultiplaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TurniMultipliFormData) => Promise<void>
  dipendenti: Array<{ id: string; nome: string; cognome: string }>
  sedi: Array<{ id: string; nome: string }>
  isSubmitting?: boolean
}

const GIORNI_SETTIMANA = [
  { value: 1, label: 'Lunedì' },
  { value: 2, label: 'Martedì' },
  { value: 3, label: 'Mercoledì' },
  { value: 4, label: 'Giovedì' },
  { value: 5, label: 'Venerdì' },
  { value: 6, label: 'Sabato' },
  { value: 0, label: 'Domenica' },
]

export function PianificazioneMultiplaDialog({
  open,
  onOpenChange,
  onSubmit,
  dipendenti,
  sedi,
  isSubmitting = false
}: PianificazioneMultiplaDialogProps) {
  const [giorniSelezionati, setGiorniSelezionati] = useState<number[]>([1, 2, 3, 4, 5]) // Lun-Ven di default

  const form = useForm<TurniMultipliFormData>({
    resolver: zodResolver(turniMultipliCreateSchema),
    defaultValues: {
      dipendenteId: '',
      dataInizio: '',
      dataFine: '',
      giorni: [1, 2, 3, 4, 5],
      oraInizio: '',
      oraFine: '',
      tipoTurno: 'MATTINA' as tipo_turno,
      sedeId: 'none'
    }
  })

  // Reset form quando il dialog si apre
  useEffect(() => {
    if (open) {
      const oggi = new Date()
      const inizioSettimana = new Date(oggi)
      inizioSettimana.setDate(oggi.getDate() - oggi.getDay() + 1)
      const fineSettimana = new Date(inizioSettimana)
      fineSettimana.setDate(inizioSettimana.getDate() + 6)

      form.reset({
        dipendenteId: '',
        dataInizio: inizioSettimana.toISOString().split('T')[0],
        dataFine: fineSettimana.toISOString().split('T')[0],
        giorni: [1, 2, 3, 4, 5],
        oraInizio: '',
        oraFine: '',
        tipoTurno: 'MATTINA' as tipo_turno,
        sedeId: 'none'
      })
      setGiorniSelezionati([1, 2, 3, 4, 5])
    }
  }, [open, form])

  const handleGiornoToggle = (giorno: number) => {
    const nuoviGiorni = giorniSelezionati.includes(giorno)
      ? giorniSelezionati.filter(g => g !== giorno)
      : [...giorniSelezionati, giorno]

    setGiorniSelezionati(nuoviGiorni)
    form.setValue('giorni', nuoviGiorni)
  }

  const handleSubmit = async (data: TurniMultipliFormData) => {
    try {
      await onSubmit(data)
      form.reset()
      setGiorniSelezionati([1, 2, 3, 4, 5])
    } catch (error) {
      console.error('Errore submit form pianificazione:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5" />
            Pianificazione Multipla Turni
          </DialogTitle>
          <DialogDescription>
            Crea più turni contemporaneamente selezionando un range di date e i giorni della settimana
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Dipendente */}
            <FormField
              control={form.control}
              name="dipendenteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dipendente *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona dipendente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {dipendenti.map((dip) => (
                        <SelectItem key={dip.id} value={dip.id}>
                          {dip.nome} {dip.cognome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Range Date */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataInizio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Inizio *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataFine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Fine *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Giorni Settimana */}
            <FormField
              control={form.control}
              name="giorni"
              render={() => (
                <FormItem>
                  <FormLabel>Giorni della Settimana *</FormLabel>
                  <FormDescription>
                    Seleziona i giorni in cui creare i turni
                  </FormDescription>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {GIORNI_SETTIMANA.map((giorno) => (
                      <div key={giorno.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`giorno-${giorno.value}`}
                          checked={giorniSelezionati.includes(giorno.value)}
                          onChange={() => handleGiornoToggle(giorno.value)}
                        />
                        <Label
                          htmlFor={`giorno-${giorno.value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {giorno.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo Turno */}
            <FormField
              control={form.control}
              name="tipoTurno"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo Turno *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona tipo turno" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(TIPI_TURNO_CONFIG).map((config) => (
                        <SelectItem key={config.value} value={config.value}>
                          <div className="flex items-center gap-2">
                            <span className={`inline-block w-3 h-3 rounded-full ${config.bgColor}`} />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Orari */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="oraInizio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ora Inizio *</FormLabel>
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
                    <FormLabel>Ora Fine *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sede */}
            <FormField
              control={form.control}
              name="sedeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sede</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona sede (opzionale)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nessuna sede</SelectItem>
                      {sedi.map((sede) => (
                        <SelectItem key={sede.id} value={sede.id}>
                          {sede.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Opzionale - assegna i turni ad una sede specifica
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={isSubmitting || giorniSelezionati.length === 0}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crea Turni
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
