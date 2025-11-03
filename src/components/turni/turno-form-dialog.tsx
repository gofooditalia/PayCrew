'use client'

/**
 * Turno Form Dialog Component
 *
 * Dialog per creazione e modifica turni con validazione
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { turnoCreateSchema } from '@/lib/validation/turni-validator'
import { Turno, TIPI_TURNO_CONFIG } from '@/types/turni'
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
import { Loader2 } from 'lucide-react'
import { z } from 'zod'

type TurnoFormData = z.infer<typeof turnoCreateSchema>

interface TurnoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TurnoFormData) => Promise<void>
  turno?: Turno | null
  dipendenti: Array<{ id: string; nome: string; cognome: string }>
  sedi: Array<{ id: string; nome: string }>
  isSubmitting?: boolean
}

export function TurnoFormDialog({
  open,
  onOpenChange,
  onSubmit,
  turno,
  dipendenti,
  sedi,
  isSubmitting = false
}: TurnoFormDialogProps) {
  const isEditing = !!turno

  const form = useForm<TurnoFormData>({
    resolver: zodResolver(turnoCreateSchema),
    defaultValues: {
      dipendenteId: '',
      data: '',
      oraInizio: '',
      oraFine: '',
      tipoTurno: 'MATTINA' as tipo_turno,
      sedeId: 'none'
    }
  })

  // Reset form quando il dialog si apre/chiude o quando cambia il turno
  useEffect(() => {
    if (open && turno) {
      // Modalità modifica
      const dataStr = typeof turno.data === 'string'
        ? turno.data.split('T')[0]
        : turno.data.toISOString().split('T')[0]

      form.reset({
        dipendenteId: turno.dipendenteId,
        data: dataStr,
        oraInizio: turno.oraInizio,
        oraFine: turno.oraFine,
        tipoTurno: turno.tipoTurno,
        sedeId: turno.sedeId || 'none'
      })
    } else if (open) {
      // Modalità creazione - setta la data di oggi
      const oggi = new Date().toISOString().split('T')[0]
      form.reset({
        dipendenteId: '',
        data: oggi,
        oraInizio: '',
        oraFine: '',
        tipoTurno: 'MATTINA' as tipo_turno,
        sedeId: 'none'
      })
    }
  }, [open, turno, form])

  const handleSubmit = async (data: TurnoFormData) => {
    try {
      await onSubmit(data)
      form.reset()
    } catch (error) {
      console.error('Errore submit form turno:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifica Turno' : 'Nuovo Turno'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica i dettagli del turno esistente'
              : 'Compila i campi per creare un nuovo turno'}
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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isEditing} // Non permettere cambio dipendente in modifica
                  >
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

            {/* Data */}
            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
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
                            <span
                              className={`inline-block w-3 h-3 rounded-full ${config.bgColor}`}
                            />
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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
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
                    Opzionale - assegna il turno ad una sede specifica
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salva Modifiche' : 'Crea Turno'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
