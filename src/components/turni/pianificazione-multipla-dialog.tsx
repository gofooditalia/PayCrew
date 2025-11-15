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
import { FasciaOraria } from '@/types/impostazioni'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Loader2, CalendarRange, Info } from 'lucide-react'
import { z } from 'zod'

type TurniMultipliFormData = z.infer<typeof turniMultipliCreateSchema>

interface PianificazioneMultiplaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TurniMultipliFormData) => Promise<void>
  dipendenti: Array<{ id: string; nome: string; cognome: string; sedeId: string | null }>
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
  const [fasceOrarie, setFasceOrarie] = useState<FasciaOraria[]>([])
  const [loadingOrari, setLoadingOrari] = useState(false)

  const form = useForm<TurniMultipliFormData>({
    resolver: zodResolver(turniMultipliCreateSchema),
    defaultValues: {
      dipendenteId: '',
      dataInizio: '',
      dataFine: '',
      giorni: [1, 2, 3, 4, 5],
      oraInizio: '',
      oraFine: '',
      pausaPranzoInizio: null,
      pausaPranzoFine: null,
      tipoTurno: 'MATTINA' as tipo_turno,
      sedeId: 'none'
    }
  })

  // Carica fasce orarie quando si apre il dialog
  useEffect(() => {
    if (open) {
      const fetchFasceOrarie = async () => {
        try {
          setLoadingOrari(true)
          const response = await fetch('/api/impostazioni/fasce-orarie')
          if (response.ok) {
            const data = await response.json()
            setFasceOrarie(data.filter((f: FasciaOraria) => f.attivo))
          }
        } catch (error) {
          console.error('Errore caricamento fasce orarie:', error)
        } finally {
          setLoadingOrari(false)
        }
      }
      fetchFasceOrarie()
    }
  }, [open])

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
        pausaPranzoInizio: null,
        pausaPranzoFine: null,
        tipoTurno: 'MATTINA' as tipo_turno,
        sedeId: 'none'
      })
      setGiorniSelezionati([1, 2, 3, 4, 5])
    }
  }, [open, form])

  // Watch tipoTurno per auto-compilazione da fasce orarie
  const tipoTurnoValue = form.watch('tipoTurno')
  const dipendenteIdValue = form.watch('dipendenteId')

  useEffect(() => {
    if (!tipoTurnoValue || !open) return

    const fasciaCorrispondente = fasceOrarie.find(f => f.tipoTurno === tipoTurnoValue)
    if (fasciaCorrispondente) {
      form.setValue('oraInizio', fasciaCorrispondente.oraInizio)
      form.setValue('oraFine', fasciaCorrispondente.oraFine)
      form.setValue('pausaPranzoInizio', fasciaCorrispondente.pausaPranzoInizio || null)
      form.setValue('pausaPranzoFine', fasciaCorrispondente.pausaPranzoFine || null)
    }
  }, [tipoTurnoValue, fasceOrarie, open, form])

  // Auto-compila sede quando cambia il dipendente selezionato
  useEffect(() => {
    if (!dipendenteIdValue || !open) return

    const dipendenteSelezionato = dipendenti.find(d => d.id === dipendenteIdValue)
    if (dipendenteSelezionato?.sedeId) {
      form.setValue('sedeId', dipendenteSelezionato.sedeId)
    }
  }, [dipendenteIdValue, dipendenti, open, form])

  const handleGiornoToggle = (giorno: number) => {
    const nuoviGiorni = giorniSelezionati.includes(giorno)
      ? giorniSelezionati.filter(g => g !== giorno)
      : [...giorniSelezionati, giorno]

    setGiorniSelezionati(nuoviGiorni)
    form.setValue('giorni', nuoviGiorni)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Valida il form prima di inviare
    const isValid = await form.trigger()
    if (!isValid) return

    const data = form.getValues()

    try {
      await onSubmit(data)
      // Reset form solo se non ci sono errori
      form.reset()
      setGiorniSelezionati([1, 2, 3, 4, 5])
    } catch (error) {
      // L'errore viene gestito dal parent e mostrato nel toast
      // Non fare nulla qui, l'errore è già stato loggato e mostrato
    }
  }

  const hasPausaPranzo = form.watch('pausaPranzoInizio') || form.watch('pausaPranzoFine')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5" />
            Pianificazione Multipla Turni
          </DialogTitle>
          <DialogDescription>
            Crea più turni in batch per date e giorni selezionati
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Riga 1: Dipendente e Sede */}
            <div className="grid grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="sedeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sede</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Nessuna" />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Riga 2: Tipo Turno */}
            <FormField
              control={form.control}
              name="tipoTurno"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-1">
                    <FormLabel>Tipo Turno *</FormLabel>
                    {fasceOrarie.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[250px]">
                            <p className="text-xs">
                              Gli orari si compilano automaticamente in base al tipo turno selezionato dalle fasce orarie configurate
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
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

            {/* Riga 3: Orari */}
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

            {/* Riga 4: Range Date */}
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
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {GIORNI_SETTIMANA.map((giorno) => (
                      <label
                        key={giorno.value}
                        className="flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={giorniSelezionati.includes(giorno.value)}
                          onChange={() => handleGiornoToggle(giorno.value)}
                          className="h-4 w-4 rounded border-primary text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                        />
                        <span className="text-sm font-normal">
                          {giorno.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pausa Pranzo - mostrata solo se presente */}
            {hasPausaPranzo && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Pausa Pranzo</h3>
                <div className="grid grid-cols-2 gap-4">
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
            )}

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
