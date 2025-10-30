'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { cn } from '@/lib/utils'

// Schema validazione
const presenzaFormSchema = z.object({
  dipendenteId: z.string().uuid({ message: 'Seleziona un dipendente' }),
  data: z.date({ message: 'La data è obbligatoria' }),
  entrata: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato orario non valido' }).optional().or(z.literal('')),
  uscita: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato orario non valido' }).optional().or(z.literal('')),
  nota: z.string().max(500, { message: 'La nota non può superare 500 caratteri' }).optional()
})

type PresenzaFormData = z.infer<typeof presenzaFormSchema>

interface PresenzaFormProps {
  dipendenti: Array<{ id: string; nome: string; cognome: string }>
  presenza?: any
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function PresenzaForm({
  dipendenti,
  presenza,
  onSubmit,
  onCancel,
  isLoading = false
}: PresenzaFormProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<PresenzaFormData>({
    resolver: zodResolver(presenzaFormSchema),
    defaultValues: presenza ? {
      dipendenteId: presenza.dipendenteId,
      data: presenza.data ? new Date(presenza.data) : new Date(),
      entrata: presenza.entrata ? new Date(presenza.entrata).toISOString().substring(11, 16) : '',
      uscita: presenza.uscita ? new Date(presenza.uscita).toISOString().substring(11, 16) : '',
      nota: presenza.nota || ''
    } : {
      data: new Date(),
      entrata: '',
      uscita: '',
      nota: ''
    }
  })

  const selectedDate = watch('data')

  const handleFormSubmit = async (data: PresenzaFormData) => {
    const formattedData = {
      dipendenteId: data.dipendenteId,
      data: format(data.data, 'yyyy-MM-dd'),
      entrata: data.entrata || undefined,
      uscita: data.uscita || undefined,
      nota: data.nota || undefined
    }

    await onSubmit(formattedData)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Dipendente */}
      <div className="space-y-2">
        <Label htmlFor="dipendenteId">Dipendente *</Label>
        <select
          id="dipendenteId"
          {...register('dipendenteId')}
          disabled={!!presenza || isLoading}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Seleziona dipendente</option>
          {dipendenti.map((dip) => (
            <option key={dip.id} value={dip.id}>
              {dip.nome} {dip.cognome}
            </option>
          ))}
        </select>
        {errors.dipendenteId && (
          <p className="text-sm text-red-500">{errors.dipendenteId.message}</p>
        )}
      </div>

      {/* Data */}
      <div className="space-y-2">
        <Label>Data *</Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !selectedDate && 'text-muted-foreground'
              )}
              disabled={isLoading}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, 'PPP', { locale: it }) : 'Seleziona data'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setValue('data', date)
                  setCalendarOpen(false)
                }
              }}
              initialFocus
              locale={it}
            />
          </PopoverContent>
        </Popover>
        {errors.data && (
          <p className="text-sm text-red-500">{errors.data.message}</p>
        )}
      </div>

      {/* Orari */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="entrata">Entrata</Label>
          <Input
            id="entrata"
            type="time"
            {...register('entrata')}
            disabled={isLoading}
            placeholder="HH:mm"
          />
          {errors.entrata && (
            <p className="text-sm text-red-500">{errors.entrata.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="uscita">Uscita</Label>
          <Input
            id="uscita"
            type="time"
            {...register('uscita')}
            disabled={isLoading}
            placeholder="HH:mm"
          />
          {errors.uscita && (
            <p className="text-sm text-red-500">{errors.uscita.message}</p>
          )}
        </div>
      </div>

      {/* Nota */}
      <div className="space-y-2">
        <Label htmlFor="nota">Nota</Label>
        <Textarea
          id="nota"
          {...register('nota')}
          disabled={isLoading}
          placeholder="Note aggiuntive (opzionale)"
          rows={3}
        />
        {errors.nota && (
          <p className="text-sm text-red-500">{errors.nota.message}</p>
        )}
      </div>

      {/* Azioni */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Annulla
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvataggio...' : presenza ? 'Aggiorna' : 'Crea Presenza'}
        </Button>
      </div>
    </form>
  )
}
