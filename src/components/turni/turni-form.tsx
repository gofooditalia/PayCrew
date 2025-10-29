'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  ClockIcon,
  CalendarIcon,
  UserIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline'
import { calcolaOreTraOrari, validaOrario } from '@/lib/utils/ore-calculator'

interface Dipendente {
  id: string
  nome: string
  cognome: string
  attivo: boolean
  sedi?: {
    id: string
    nome: string
  }
}

interface Sede {
  id: string
  nome: string
}

interface TurnoFormData {
  dipendenteId: string
  data: string
  oraInizio: string
  oraFine: string
  tipoTurno: 'MATTINA' | 'PRANZO' | 'SERA' | 'NOTTE' | 'SPEZZATO'
  sedeId: string
}

interface TurniFormProps {
  initialData?: Partial<TurnoFormData>
  dipendenti: Dipendente[]
  sedi: Sede[]
  onSuccess?: () => void
  onCancel?: () => void
}

const TIPI_TURNO = [
  { value: 'MATTINA', label: 'Mattina', icon: '🌅', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'PRANZO', label: 'Pranzo', icon: '☀️', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'SERA', label: 'Sera', icon: '🌆', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'NOTTE', label: 'Notte', icon: '🌙', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { value: 'SPEZZATO', label: 'Spezzato', icon: '🔄', color: 'bg-purple-100 text-purple-800 border-purple-200' }
]

export default function TurniForm({ 
  initialData, 
  dipendenti, 
  sedi, 
  onSuccess, 
  onCancel 
}: TurniFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<TurnoFormData>({
    dipendenteId: initialData?.dipendenteId || '',
    data: initialData?.data || new Date().toISOString().split('T')[0],
    oraInizio: initialData?.oraInizio || '',
    oraFine: initialData?.oraFine || '',
    tipoTurno: initialData?.tipoTurno || 'MATTINA',
    sedeId: initialData?.sedeId || ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [durataTurno, setDurataTurno] = useState<number | null>(null)

  // Filtra dipendenti attivi
  const dipendentiAttivi = dipendenti.filter(d => d.attivo !== false)

  // Calcola durata turno quando cambiano orari
  useEffect(() => {
    if (formData.oraInizio && formData.oraFine && validaOrario(formData.oraInizio) && validaOrario(formData.oraFine)) {
      const durata = calcolaOreTraOrari(formData.oraInizio, formData.oraFine)
      setDurataTurno(durata)
    } else {
      setDurataTurno(null)
    }
  }, [formData.oraInizio, formData.oraFine])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.dipendenteId) {
      newErrors.dipendenteId = 'Seleziona un dipendente'
    }

    if (!formData.data) {
      newErrors.data = 'La data è obbligatoria'
    }

    if (!formData.oraInizio) {
      newErrors.oraInizio = 'L\'orario di inizio è obbligatorio'
    } else if (!validaOrario(formData.oraInizio)) {
      newErrors.oraInizio = 'Orario di inizio non valido (formato HH:mm)'
    }

    if (!formData.oraFine) {
      newErrors.oraFine = 'L\'orario di fine è obbligatorio'
    } else if (!validaOrario(formData.oraFine)) {
      newErrors.oraFine = 'Orario di fine non valido (formato HH:mm)'
    }

    if (formData.oraInizio && formData.oraFine && formData.oraInizio === formData.oraFine) {
      newErrors.oraFine = 'L\'orario di fine deve essere diverso da quello di inizio'
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
      const response = await fetch('/api/turni', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante la creazione del turno')
      }

      onSuccess?.()
      router.refresh()
    } catch (error) {
      console.error('Errore durante la creazione del turno:', error)
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Errore sconosciuto' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof TurnoFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Pulisci errori quando l'utente corregge
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const dipendenteSelezionato = dipendenti.find(d => d.id === formData.dipendenteId)
  const tipoTurnoSelezionato = TIPI_TURNO.find(t => t.value === formData.tipoTurno)

  return (
    <Card className="w-full max-w-2xl mx-auto animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BriefcaseIcon className="h-5 w-5 text-primary" />
          Pianificazione Turno
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

          {/* Data e Tipo Turno */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                min={new Date().toISOString().split('T')[0]}
                className="w-full"
              />
              {errors.data && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  {errors.data}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoTurno">Tipo Turno *</Label>
              <select
                value={formData.tipoTurno}
                onChange={(e) => handleInputChange('tipoTurno', e.target.value as any)}
                className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200"
              >
                {TIPI_TURNO.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.icon} {tipo.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Orari */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="oraInizio">Orario Inizio *</Label>
              <Input
                id="oraInizio"
                type="time"
                value={formData.oraInizio}
                onChange={(e) => handleInputChange('oraInizio', e.target.value)}
                placeholder="09:00"
                className="w-full"
              />
              {errors.oraInizio && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  {errors.oraInizio}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="oraFine">Orario Fine *</Label>
              <Input
                id="oraFine"
                type="time"
                value={formData.oraFine}
                onChange={(e) => handleInputChange('oraFine', e.target.value)}
                placeholder="18:00"
                className="w-full"
              />
              {errors.oraFine && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  {errors.oraFine}
                </p>
              )}
            </div>
          </div>

          {/* Riepilogo Durata */}
          {durataTurno !== null && (
            <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Durata Turno</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {durataTurno.toFixed(1)} ore
                    </p>
                    {tipoTurnoSelezionato && (
                      <Badge className={`ml-2 ${tipoTurnoSelezionato.color}`}>
                        {tipoTurnoSelezionato.icon} {tipoTurnoSelezionato.label}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sede */}
          <div className="space-y-2">
            <Label htmlFor="sedeId" className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4" />
              Sede
            </Label>
            <select
              value={formData.sedeId}
              onChange={(e) => handleInputChange('sedeId', e.target.value)}
              className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200"
            >
              <option value="">Nessuna sede specificata</option>
              {sedi.map((sede) => (
                <option key={sede.id} value={sede.id}>
                  {sede.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Info Dipendente Selezionato */}
          {dipendenteSelezionato && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Dipendente Selezionato</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Nome:</span>
                    <p className="font-medium text-blue-900">
                      {dipendenteSelezionato.nome} {dipendenteSelezionato.cognome}
                    </p>
                  </div>
                  {dipendenteSelezionato.sedi && (
                    <div>
                      <span className="text-blue-700">Sede abituale:</span>
                      <p className="font-medium text-blue-900">
                        {dipendenteSelezionato.sedi.nome}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
              {isSubmitting ? 'Creazione in corso...' : 'Crea Turno'}
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