'use client'

/**
 * Turno Form Dialog Component
 *
 * Dialog per creazione e modifica turni con validazione
 */

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { turnoCreateSchema } from '@/lib/validation/turni-validator'
import { Turno, TIPI_TURNO_CONFIG } from '@/types/turni'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Loader2, AlertTriangle, Trash2, Info } from 'lucide-react'
import { z } from 'zod'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'

type TurnoFormData = z.infer<typeof turnoCreateSchema>

interface TurnoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TurnoFormData) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  turno?: Turno | null
  dipendenti: Array<{ id: string; nome: string; cognome: string; sedeId: string | null }>
  sedi: Array<{ id: string; nome: string }>
  isSubmitting?: boolean
  preFillDipendenteId?: string
  preFillData?: string
}

export function TurnoFormDialog({
  open,
  onOpenChange,
  onSubmit,
  onDelete,
  turno,
  dipendenti,
  sedi,
  isSubmitting = false,
  preFillDipendenteId,
  preFillData
}: TurnoFormDialogProps) {
  const isEditing = !!turno
  const [fasceOrarie, setFasceOrarie] = useState<FasciaOraria[]>([])
  const [loadingFasce, setLoadingFasce] = useState(false)
  const [hasDuplicateTurno, setHasDuplicateTurno] = useState(false)
  const [duplicateCheckDone, setDuplicateCheckDone] = useState(false)

  const form = useForm<TurnoFormData>({
    resolver: zodResolver(turnoCreateSchema),
    defaultValues: {
      dipendenteId: '',
      data: '',
      oraInizio: '',
      oraFine: '',
      pausaPranzoInizio: null,
      pausaPranzoFine: null,
      tipoTurno: 'MATTINA' as tipo_turno,
      sedeId: 'none'
    }
  })

  const tipoTurnoValue = form.watch('tipoTurno')
  const dipendenteIdValue = form.watch('dipendenteId')
  const dataValue = form.watch('data')
  const hasPausaPranzo = form.watch('pausaPranzoInizio') || form.watch('pausaPranzoFine')

  // Controlla se esiste già un turno per questo dipendente in questa data
  useEffect(() => {
    const checkDuplicateTurno = async () => {
      // Non controllare se siamo in modifica o se mancano i dati
      if (isEditing || !dipendenteIdValue || !dataValue || !open) {
        setHasDuplicateTurno(false)
        setDuplicateCheckDone(false)
        return
      }

      try {
        const response = await fetch(
          `/api/turni?dipendenteId=${dipendenteIdValue}&dataInizio=${dataValue}&dataFine=${dataValue}`
        )

        if (response.ok) {
          const data = await response.json()
          const turniEsistenti = data.turni || []

          if (turniEsistenti.length > 0) {
            setHasDuplicateTurno(true)
          } else {
            setHasDuplicateTurno(false)
          }
          setDuplicateCheckDone(true)
        }
      } catch (error) {
        console.error('Errore controllo turni duplicati:', error)
        setDuplicateCheckDone(false)
      }
    }

    checkDuplicateTurno()
  }, [dipendenteIdValue, dataValue, open, isEditing])

  // Carica fasce orarie quando si apre il dialog
  useEffect(() => {
    if (open) {
      const fetchFasceOrarie = async () => {
        try {
          setLoadingFasce(true)
          const response = await fetch('/api/impostazioni/fasce-orarie')
          if (response.ok) {
            const data = await response.json()
            // Filtra solo fasce attive
            setFasceOrarie(data.filter((f: FasciaOraria) => f.attivo))
          }
        } catch (error) {
          console.error('Errore caricamento fasce orarie:', error)
        } finally {
          setLoadingFasce(false)
        }
      }
      fetchFasceOrarie()
    }
  }, [open])

  // Auto-compila orari e pausa pranzo quando cambia il tipo turno
  useEffect(() => {
    if (!tipoTurnoValue) return

    const fasciaCorrispondente = fasceOrarie.find(f => f.tipoTurno === tipoTurnoValue)
    if (fasciaCorrispondente) {
      form.setValue('oraInizio', fasciaCorrispondente.oraInizio)
      form.setValue('oraFine', fasciaCorrispondente.oraFine)
      form.setValue('pausaPranzoInizio', fasciaCorrispondente.pausaPranzoInizio)
      form.setValue('pausaPranzoFine', fasciaCorrispondente.pausaPranzoFine)
    }
  }, [tipoTurnoValue, fasceOrarie, form])

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
        pausaPranzoInizio: turno.pausaPranzoInizio || null,
        pausaPranzoFine: turno.pausaPranzoFine || null,
        tipoTurno: turno.tipoTurno,
        sedeId: turno.sedeId || 'none'
      })
    } else if (open) {
      // Modalità creazione - usa valori pre-fill se disponibili, altrimenti usa oggi
      const dataDefault = preFillData || new Date().toISOString().split('T')[0]

      // Trova la sede del dipendente pre-selezionato
      let sedeIdDefault = 'none'
      if (preFillDipendenteId) {
        const dipendenteSelezionato = dipendenti.find(d => d.id === preFillDipendenteId)
        if (dipendenteSelezionato?.sedeId) {
          sedeIdDefault = dipendenteSelezionato.sedeId
        }
      }

      form.reset({
        dipendenteId: preFillDipendenteId || '',
        data: dataDefault,
        oraInizio: '',
        oraFine: '',
        pausaPranzoInizio: null,
        pausaPranzoFine: null,
        tipoTurno: 'MATTINA' as tipo_turno,
        sedeId: sedeIdDefault
      })
    }
  }, [open, turno, form, preFillDipendenteId, preFillData, dipendenti])

  // Auto-compila sede quando cambia il dipendente selezionato DOPO l'apertura
  useEffect(() => {
    if (!dipendenteIdValue || !open || isEditing) return

    const dipendenteSelezionato = dipendenti.find(d => d.id === dipendenteIdValue)
    if (dipendenteSelezionato?.sedeId) {
      form.setValue('sedeId', dipendenteSelezionato.sedeId)
    }
  }, [dipendenteIdValue, dipendenti, open, isEditing, form])

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
    } catch (error) {
      // L'errore viene gestito dal parent e mostrato nel toast
      // Non fare nulla qui, l'errore è già stato loggato e mostrato
    }
  }

  const handleDelete = async () => {
    if (!turno?.id || !onDelete) return

    if (!confirm('Sei sicuro di voler eliminare questo turno?')) return

    try {
      await onDelete(turno.id)
      onOpenChange(false)
    } catch (error) {
      // L'errore viene gestito dal parent
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
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
          <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-1 space-y-4">

            {/* Alert per turno duplicato */}
            {hasDuplicateTurno && duplicateCheckDone && !isEditing && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-sm text-orange-800">
                  <strong>Attenzione:</strong> Questo dipendente ha già un turno assegnato per questa data.
                  <br />
                  <span className="text-xs mt-1 block">
                    💡 <strong>Suggerimento:</strong> Se il dipendente lavora pranzo e sera, usa il tipo turno <strong>SPEZZATO</strong> con pausa pranzo, invece di creare due turni separati.
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* Riga 1: Dipendente e Sede */}
            <div className="grid grid-cols-2 gap-4">
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
                        <SelectValue placeholder="Seleziona tipo" />
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

            {/* Riga 4: Data */}
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
                <p className="text-xs text-muted-foreground mt-2">
                  Pausa pranzo impostata dalla fascia oraria (modificabile)
                </p>
              </div>
            )}
            </div>

            {/* Footer Sticky */}
            <DialogFooter className="mt-4 pt-4 border-t">
              <div className="flex w-full items-center justify-between">
                <div>
                  {isEditing && onDelete && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Elimina
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
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
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
