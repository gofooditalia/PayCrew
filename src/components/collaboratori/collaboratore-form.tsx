'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { collaboratoreSchema, CollaboratoreInput } from '@/lib/validation/collaboratori-validator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface CollaboratoreFormProps {
  collaboratore?: any
  onSuccess: () => void
  onCancel: () => void
}

export default function CollaboratoreForm({ collaboratore, onSuccess, onCancel }: CollaboratoreFormProps) {
  const [loading, setLoading] = useState(false)
  const isEditing = !!collaboratore

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(collaboratoreSchema),
    defaultValues: collaboratore || {
      attivo: true,
    }
  })

  const tipo = watch('tipo')

  const onSubmit = async (data: CollaboratoreInput) => {
    try {
      setLoading(true)

      const url = isEditing ? `/api/collaboratori/${collaboratore.id}` : '/api/collaboratori'
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
        <h2 className="text-2xl font-bold">
          {isEditing ? 'Modifica Collaboratore' : 'Nuovo Collaboratore'}
        </h2>
      </div>

      {/* Anagrafica */}
      <Card>
        <CardHeader>
          <CardTitle>Dati Anagrafici</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" {...register('nome')} />
            {errors.nome && <p className="text-sm text-destructive">{String(errors.nome.message)}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cognome">Cognome *</Label>
            <Input id="cognome" {...register('cognome')} />
            {errors.cognome && <p className="text-sm text-destructive">{String(errors.cognome.message)}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="codiceFiscale">Codice Fiscale *</Label>
            <Input
              id="codiceFiscale"
              {...register('codiceFiscale')}
              maxLength={16}
              className="uppercase"
            />
            {errors.codiceFiscale && <p className="text-sm text-destructive">{String(errors.codiceFiscale.message)}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="partitaIva">Partita IVA</Label>
            <Input id="partitaIva" {...register('partitaIva')} maxLength={11} />
            {errors.partitaIva && <p className="text-sm text-destructive">{String(errors.partitaIva.message)}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Contatti */}
      <Card>
        <CardHeader>
          <CardTitle>Contatti</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{String(errors.email.message)}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Telefono</Label>
            <Input id="telefono" {...register('telefono')} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="indirizzo">Indirizzo</Label>
            <Input id="indirizzo" {...register('indirizzo')} />
          </div>
        </CardContent>
      </Card>

      {/* Tipo Collaborazione */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo Collaborazione</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Select
              value={tipo}
              onValueChange={(value) => setValue('tipo', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRESTAZIONE_OCCASIONALE">Prestazione Occasionale</SelectItem>
                <SelectItem value="PARTITA_IVA">Partita IVA</SelectItem>
                <SelectItem value="CONSULENTE">Consulente</SelectItem>
              </SelectContent>
            </Select>
            {errors.tipo && <p className="text-sm text-destructive">{String(errors.tipo.message)}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tariffaOraria">Tariffa Oraria (€)</Label>
            <Input
              id="tariffaOraria"
              type="number"
              step="0.01"
              {...register('tariffaOraria', { valueAsNumber: true })}
            />
            {errors.tariffaOraria && <p className="text-sm text-destructive">{String(errors.tariffaOraria.message)}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" {...register('note')} rows={3} />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="attivo"
              checked={watch('attivo')}
              onCheckedChange={(checked) => setValue('attivo', checked)}
            />
            <Label htmlFor="attivo">Collaboratore Attivo</Label>
          </div>
        </CardContent>
      </Card>

      {/* Azioni */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Annulla
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvataggio...' : isEditing ? 'Aggiorna' : 'Crea Collaboratore'}
        </Button>
      </div>
    </form>
  )
}
