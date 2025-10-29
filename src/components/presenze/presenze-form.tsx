'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  ClockIcon,
  CalendarIcon,
  UserIcon,
  CalculatorIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { calcolaOreLavorate, formattaOreDecimaliInHHmm, validaOrario } from '@/lib/utils/ore-calculator'

interface Dipendente {
  id: string
  nome: string
  cognome: string
  oreSettimanali: number
  attivo: boolean
  sedi?: {
    id: string
    nome: string
  }
}

interface PresenzaFormData {
  dipendenteId: string
  data: string
  entrata: string
  uscita: string
  nota: string
}

interface PresenzeFormProps {
  initialData?: Partial<PresenzaFormData>
  dipendenti: Dipendente[]
  onSuccess?: () => void
  onCancel?: () => void
}

export default function PresenzeForm({ 
  initialData, 
  dipendenti, 
  onSuccess, 
  onCancel 
}: PresenzeFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<PresenzaFormData>({
    dipendenteId: initialData?.dipendenteId || '',
    data: initialData?.data || new Date().toISOString().split('T')[0],
    entrata: initialData?.entrata || '',
    uscita: initialData?.uscita || '',
    nota: initialData?.nota || ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [calcoloOre, setCalcoloOre] = useState<{
    oreLavorate: number
    oreStraordinario: number
    oreNormali: number
    pausaPranzo: number
    note?: string
  } | null>(null)

  // Filtra dipendenti attivi
  const dipendentiAttivi = dipendenti.filter(d => d.attivo !== false)

  // Calcola ore quando cambiano orari
  useEffect(() => {
    if (formData.entrata && formData.uscita && formData.dipendenteId) {
      const dipendente = dipendenti.find(d => d.id === formData.dipendenteId)
      if (dipendente && validaOrario(formData.entrata) && validaOrario(formData.uscita)) {
        const oreContrattoGiornaliere = dipendente.oreSettimanali / 5
        const calcolo = calcolaOreLavorate(
          {
            entrata: formData.entrata,
            uscita: formData.uscita,
            data: new Date(formData.data)
          },
          oreContrattoGiornaliere
        )
        setCalcoloOre(calcolo)
      } else {
        setCalcoloOre(null)
      }
    } else {
      setCalcoloOre(null)
    }
  }, [formData.entrata, formData.uscita, formData.dipendenteId, dipendenti])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.dipendenteId) {
      newErrors.dipendenteId = 'Seleziona un dipendente'
    }

    if (!formData.data) {
      newErrors.data = 'La data è obbligatoria'
    }

    if (!formData.entrata) {
      newErrors.entrata = 'L\'orario di entrata è obbligatorio'
    } else if (!validaOrario(formData.entrata)) {
      newErrors.entrata = 'Orario di entrata non valido (formato HH:mm)'
    }

    if (!formData.uscita) {
      newErrors.uscita = 'L\'orario di uscita è obbligatorio'
    } else if (!validaOrario(formData.uscita)) {
      newErrors.uscita = 'Orario di uscita non valido (formato HH:mm)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/presenze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante la registrazione della presenza')
      }

      onSuccess?.()
      router.refresh()
    } catch (error) {
      console.error('Errore durante la registrazione della presenza:', error)
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Errore sconosciuto' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof PresenzaFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Pulisci errori quando l'utente corregge
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const dipendenteSelezionato = dipendenti.find(d => d.id === formData.dipendenteId)

  return (
    <Card className="w-full max-w-2xl mx-auto animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-primary" />
          Registrazione Presenza
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selezione Dipendente */}
          <div className="space-y-2">
            <Label htmlFor="dipendenteId" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Dipendente *
            </Label>
            <select
              value={formData.dipendenteId}
              onChange={(e) => handleInputChange('dipendenteId', e.target.value)}
              className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200"
            >
              <option value="">Seleziona un dipendente...</option>
              {dipendentiAttivi.map((dipendente) => (
                <option key={dipendente.id} value={dipendente.id}>
                  {dipendente.nome} {dipendente.cognome}
                  {dipendente.sedi && ` - ${dipendente.sedi.nome}`}
                </option>
              ))}
            </select>
            {errors.dipendenteId && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <ExclamationTriangleIcon className="h-4 w-4" />
                {errors.dipendenteId}
              </p>
            )}
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="data" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Data *
            </Label>
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => handleInputChange('data', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full"
            />
            {errors.data && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <ExclamationTriangleIcon className="h-4 w-4" />
                {errors.data}
              </p>
            )}
          </div>

          {/* Orari */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entrata">Orario Entrata *</Label>
              <Input
                id="entrata"
                type="time"
                value={formData.entrata}
                onChange={(e) => handleInputChange('entrata', e.target.value)}
                placeholder="09:00"
                className="w-full"
              />
              {errors.entrata && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  {errors.entrata}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="uscita">Orario Uscita *</Label>
              <Input
                id="uscita"
                type="time"
                value={formData.uscita}
                onChange={(e) => handleInputChange('uscita', e.target.value)}
                placeholder="18:00"
                className="w-full"
              />
              {errors.uscita && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  {errors.uscita}
                </p>
              )}
            </div>
          </div>

          {/* Calcolo Ore Automatico */}
          {calcoloOre && (
            <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CalculatorIcon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Riepilogo Calcolo Ore</h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Ore Totali</p>
                    <p className="text-lg font-bold text-foreground">
                      {formattaOreDecimaliInHHmm(calcoloOre.oreLavorate)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Ore Normali</p>
                    <p className="text-lg font-bold text-green-600">
                      {formattaOreDecimaliInHHmm(calcoloOre.oreNormali)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Straordinari</p>
                    <p className="text-lg font-bold text-orange-600">
                      {formattaOreDecimaliInHHmm(calcoloOre.oreStraordinario)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Pausa</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formattaOreDecimaliInHHmm(calcoloOre.pausaPranzo)}
                    </p>
                  </div>
                </div>

                {calcoloOre.note && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                      {calcoloOre.note}
                    </p>
                  </div>
                )}

                {dipendenteSelezionato && (
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline">
                      Contratto: {dipendenteSelezionato.oreSettimanali}h/settimana
                    </Badge>
                    <Badge variant="outline">
                      {(dipendenteSelezionato.oreSettimanali / 5).toFixed(1)}h/giorno
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="nota">Note (opzionale)</Label>
            <Textarea
              id="nota"
              value={formData.nota}
              onChange={(e) => handleInputChange('nota', e.target.value)}
              placeholder="Note aggiuntive sulla presenza..."
              rows={3}
              className="w-full resize-none"
            />
          </div>

          {/* Errori generali */}
          {errors.submit && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive flex items-center gap-1">
                <ExclamationTriangleIcon className="h-4 w-4" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Pulsanti Azione */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 button-scale"
            >
              {isSubmitting ? 'Registrazione in corso...' : 'Registra Presenza'}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                Annulla
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}