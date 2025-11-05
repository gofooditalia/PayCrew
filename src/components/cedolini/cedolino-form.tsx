'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bustaPagaQuickSchema } from '@/lib/validation/buste-paga-validator'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils/currency'
import { Calculator } from 'lucide-react'

interface CedolinoFormProps {
  dipendenti: any[]
  initialData?: any
  onSave: (data: any) => void
  onCancel: () => void
}

export function CedolinoForm({
  dipendenti,
  initialData,
  onSave,
  onCancel,
}: CedolinoFormProps) {
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const form = useForm({
    resolver: zodResolver(bustaPagaQuickSchema),
    defaultValues: initialData
      ? {
          dipendenteId: initialData.dipendenteId,
          mese: initialData.mese,
          anno: initialData.anno,
          retribuzioneLorda: initialData.retribuzioneLorda,
          oreLavorate: initialData.oreLavorate,
          acconto1: initialData.acconto1 || undefined,
          acconto2: initialData.acconto2 || undefined,
          acconto3: initialData.acconto3 || undefined,
          acconto4: initialData.acconto4 || undefined,
          bonus: initialData.bonus || undefined,
          note: initialData.note || '',
        }
      : {
          dipendenteId: '',
          mese: currentMonth,
          anno: currentYear,
          retribuzioneLorda: undefined,
          oreLavorate: undefined,
          acconto1: undefined,
          acconto2: undefined,
          acconto3: undefined,
          acconto4: undefined,
          bonus: undefined,
          note: '',
        },
  })

  const [calcoli, setCalcoli] = useState({
    retribuzioneLorda: 0,
    contributiINPS: 0,
    irpef: 0,
    totaleLordo: 0,
    totaleRitenute: 0,
    netto: 0,
    totaleAcconti: 0,
    differenza: 0,
  })

  // Watch per ricalcolo automatico - usa watch specifici invece di watchAll
  const retribuzioneLorda = form.watch('retribuzioneLorda')
  const bonus = form.watch('bonus')
  const acconto1 = form.watch('acconto1')
  const acconto2 = form.watch('acconto2')
  const acconto3 = form.watch('acconto3')
  const acconto4 = form.watch('acconto4')

  // Ricalcola i totali quando cambiano i valori
  useEffect(() => {
    const retriLorda = Number(retribuzioneLorda) || 0
    const bonusVal = Number(bonus) || 0
    const acc1 = Number(acconto1) || 0
    const acc2 = Number(acconto2) || 0
    const acc3 = Number(acconto3) || 0
    const acc4 = Number(acconto4) || 0

    // Calcola contributi e ritenute (valori esempio, da personalizzare)
    const contributiINPS = retriLorda * 0.0919 // 9.19%
    const irpef = retriLorda * 0.23 // 23% (esempio)
    const totaleLordo = retriLorda + bonusVal
    const totaleRitenute = contributiINPS + irpef
    const netto = totaleLordo - totaleRitenute
    const totaleAcconti = acc1 + acc2 + acc3 + acc4
    const differenza = netto - totaleAcconti

    setCalcoli({
      retribuzioneLorda: retriLorda,
      contributiINPS,
      irpef,
      totaleLordo,
      totaleRitenute,
      netto,
      totaleAcconti,
      differenza,
    })
  }, [retribuzioneLorda, bonus, acconto1, acconto2, acconto3, acconto4])

  // Auto-fill retribuzione quando si seleziona un dipendente
  const handleDipendenteChange = (dipendenteId: string) => {
    const dipendente = dipendenti.find((d) => d.id === dipendenteId)
    if (dipendente && !initialData) {
      form.setValue('retribuzioneLorda', Number(dipendente.retribuzione))
    }
  }

  const onSubmit = (data: any) => {
    onSave(data)
  }

  const mesi = [
    { value: 1, label: 'Gennaio' },
    { value: 2, label: 'Febbraio' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Aprile' },
    { value: 5, label: 'Maggio' },
    { value: 6, label: 'Giugno' },
    { value: 7, label: 'Luglio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Settembre' },
    { value: 10, label: 'Ottobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Dicembre' },
  ]

  const anni = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informazioni Base */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informazioni Base</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dipendente */}
            <FormField
              control={form.control}
              name="dipendenteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dipendente *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      handleDipendenteChange(value)
                    }}
                    value={field.value}
                    disabled={!!initialData}
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
                          {dip.sedi && ` - ${dip.sedi.nome}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mese */}
            <FormField
              control={form.control}
              name="mese"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mese *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value.toString()}
                    disabled={!!initialData}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mesi.map((m) => (
                        <SelectItem key={m.value} value={m.value.toString()}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Anno */}
            <FormField
              control={form.control}
              name="anno"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anno *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value.toString()}
                    disabled={!!initialData}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {anni.map((anno) => (
                        <SelectItem key={anno} value={anno.toString()}>
                          {anno}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ore Lavorate */}
            <FormField
              control={form.control}
              name="oreLavorate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ore Lavorate *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const value = e.target.value
                        field.onChange(value === '' ? undefined : parseFloat(value))
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Retribuzione Lorda */}
            <FormField
              control={form.control}
              name="retribuzioneLorda"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Compenso Base *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const value = e.target.value
                        field.onChange(value === '' ? undefined : parseFloat(value))
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Compenso mensile contrattuale del dipendente
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Acconti Settimanali */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acconti Settimanali</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="acconto1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>1° Settimana</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const value = e.target.value
                        field.onChange(value === '' ? undefined : parseFloat(value))
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acconto2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>2° Settimana</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const value = e.target.value
                        field.onChange(value === '' ? undefined : parseFloat(value))
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acconto3"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>3° Settimana</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const value = e.target.value
                        field.onChange(value === '' ? undefined : parseFloat(value))
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acconto4"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>4° Settimana</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const value = e.target.value
                        field.onChange(value === '' ? undefined : parseFloat(value))
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Bonus e Note */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informazioni Aggiuntive</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="bonus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bonus</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const value = e.target.value
                        field.onChange(value === '' ? undefined : parseFloat(value))
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Eventuali bonus o compensi aggiuntivi
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Note aggiuntive..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Riepilogo Calcoli */}
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Riepilogo Pagamento</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Compenso Base:
                </span>
                <span className="font-medium">
                  {formatCurrency(calcoli.retribuzioneLorda)}
                </span>
              </div>

              {calcoli.totaleAcconti > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Totale Acconti:
                  </span>
                  <span className="font-medium text-amber-600">
                    -{formatCurrency(calcoli.totaleAcconti)}
                  </span>
                </div>
              )}

              {calcoli.contributiINPS > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Contributi (9.19%):
                  </span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(calcoli.contributiINPS)}
                  </span>
                </div>
              )}

              {calcoli.irpef > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    IRPEF (23%):
                  </span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(calcoli.irpef)}
                  </span>
                </div>
              )}

              {bonus > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Bonus:</span>
                  <span className="font-medium text-green-600">
                    +{formatCurrency(bonus)}
                  </span>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-base">
                <span className="font-medium">Netto Totale:</span>
                <span className="font-bold text-lg">
                  {formatCurrency(calcoli.netto)}
                </span>
              </div>

              <div className="flex justify-between text-base">
                <span className="font-medium">Differenza da Erogare:</span>
                <span
                  className={`font-bold text-lg ${
                    calcoli.differenza >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatCurrency(calcoli.differenza)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Azioni */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annulla
          </Button>
          <Button type="submit">
            {initialData ? 'Aggiorna' : 'Crea'} Cedolino
          </Button>
        </div>
      </form>
    </Form>
  )
}
