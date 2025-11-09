'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { prestazioneSchema, PrestazioneInput, calcolaImportoPrestazione } from '@/lib/validation/collaboratori-validator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface PrestazioneFormProps {
  collaboratoreId: string
  prestazione?: any
  onSuccess: () => void
  onCancel: () => void
}

export default function PrestazioneForm({ collaboratoreId, prestazione, onSuccess, onCancel }: PrestazioneFormProps) {
  const [loading, setLoading] = useState(false)
  const isEditing = !!prestazione

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(prestazioneSchema),
    defaultValues: prestazione ? {
      ...prestazione,
      dataInizio: prestazione.dataInizio?.split('T')[0],
      dataFine: prestazione.dataFine?.split('T')[0] || undefined,
      dataPagamento: prestazione.dataPagamento?.split('T')[0] || undefined,
    } : {
      collaboratoreId,
      statoPagamento: 'DA_PAGARE',
    }
  })

  const tipo = watch('tipo')
  const oreLavorate = watch('oreLavorate')
  const tariffaOraria = watch('tariffaOraria')
  const compensoFisso = watch('compensoFisso')

  // Ricalcola importo automaticamente
  useEffect(() => {
    if (tipo === 'ORARIA' && oreLavorate && tariffaOraria) {
      setValue('importoTotale', oreLavorate * tariffaOraria)
    } else if (tipo === 'PROGETTO' && compensoFisso) {
      setValue('importoTotale', compensoFisso)
    }
  }, [tipo, oreLavorate, tariffaOraria, compensoFisso, setValue])

  const onSubmit = async (data: PrestazioneInput) => {
    try {
      setLoading(true)

      const url = isEditing ? `/api/prestazioni/${prestazione.id}` : '/api/prestazioni'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Errore durante il salvataggio')
      }
    } catch (error) {
      console.error('Errore submit:', error)
      alert('Errore durante il salvataggio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">
          {isEditing ? 'Modifica Prestazione' : 'Nuova Prestazione'}
        </h3>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dettagli Prestazione</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tipo */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo Prestazione *</Label>
            <Select
              value={tipo}
              onValueChange={(value) => setValue('tipo', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ORARIA">Tariffa Oraria</SelectItem>
                <SelectItem value="PROGETTO">Progetto a Compenso Fisso</SelectItem>
              </SelectContent>
            </Select>
            {errors.tipo && <p className="text-sm text-destructive">{String(errors.tipo.message)}</p>}
          </div>

          {/* Descrizione */}
          <div className="space-y-2">
            <Label htmlFor="descrizione">Descrizione *</Label>
            <Textarea id="descrizione" {...register('descrizione')} rows={2} />
            {errors.descrizione && <p className="text-sm text-destructive">{String(errors.descrizione.message)}</p>}
          </div>

          {/* Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInizio">Data Inizio *</Label>
              <Input id="dataInizio" type="date" {...register('dataInizio')} />
              {errors.dataInizio && <p className="text-sm text-destructive">{String(errors.dataInizio.message)}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataFine">Data Fine</Label>
              <Input id="dataFine" type="date" {...register('dataFine')} />
            </div>
          </div>

          {/* Campi ORARIA */}
          {tipo === 'ORARIA' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="oreLavorate">Ore Lavorate *</Label>
                <Input
                  id="oreLavorate"
                  type="number"
                  step="0.25"
                  {...register('oreLavorate', { valueAsNumber: true })}
                />
                {errors.oreLavorate && <p className="text-sm text-destructive">{String(errors.oreLavorate.message)}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tariffaOraria">Tariffa Oraria (€) *</Label>
                <Input
                  id="tariffaOraria"
                  type="number"
                  step="0.01"
                  {...register('tariffaOraria', { valueAsNumber: true })}
                />
                {errors.tariffaOraria && <p className="text-sm text-destructive">{String(errors.tariffaOraria.message)}</p>}
              </div>
            </div>
          )}

          {/* Campi PROGETTO */}
          {tipo === 'PROGETTO' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomeProgetto">Nome Progetto *</Label>
                <Input id="nomeProgetto" {...register('nomeProgetto')} />
                {errors.nomeProgetto && <p className="text-sm text-destructive">{String(errors.nomeProgetto.message)}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="compensoFisso">Compenso Fisso (€) *</Label>
                <Input
                  id="compensoFisso"
                  type="number"
                  step="0.01"
                  {...register('compensoFisso', { valueAsNumber: true })}
                />
                {errors.compensoFisso && <p className="text-sm text-destructive">{String(errors.compensoFisso.message)}</p>}
              </div>
            </div>
          )}

          {/* Importo Totale (calcolato) */}
          <div className="space-y-2">
            <Label htmlFor="importoTotale">Importo Totale (€) *</Label>
            <Input
              id="importoTotale"
              type="number"
              step="0.01"
              {...register('importoTotale', { valueAsNumber: true })}
              className="bg-muted"
              readOnly
            />
            {errors.importoTotale && <p className="text-sm text-destructive">{String(errors.importoTotale.message)}</p>}
          </div>

          {/* Stato Pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="statoPagamento">Stato Pagamento</Label>
              <Select
                value={watch('statoPagamento')}
                onValueChange={(value) => setValue('statoPagamento', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DA_PAGARE">Da Pagare</SelectItem>
                  <SelectItem value="PAGATO">Pagato</SelectItem>
                  <SelectItem value="ANNULLATO">Annullato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {watch('statoPagamento') === 'PAGATO' && (
              <div className="space-y-2">
                <Label htmlFor="dataPagamento">Data Pagamento</Label>
                <Input id="dataPagamento" type="date" {...register('dataPagamento')} />
              </div>
            )}
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" {...register('note')} rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Azioni */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Annulla
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvataggio...' : isEditing ? 'Aggiorna' : 'Crea Prestazione'}
        </Button>
      </div>
    </form>
  )
}
