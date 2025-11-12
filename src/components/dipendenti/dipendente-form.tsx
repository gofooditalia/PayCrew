'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface Sede {
  id: string
  nome: string
}

interface DipendenteFormProps {
  sedi: Sede[]
  dipendente?: {
    id: string
    nome: string
    cognome: string
    codiceFiscale: string
    dataNascita: string
    luogoNascita: string
    indirizzo: string
    citta: string
    cap: string
    telefono: string
    email: string
    iban: string
    dataAssunzione: string
    tipoContratto: string
    ccnl: string
    livello: string
    retribuzione: number
    oreSettimanali: number
    sedeId: string
    attivo: boolean
    dataCessazione: string | null
  }
}

export default function DipendenteForm({ sedi, dipendente }: DipendenteFormProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    nome: dipendente?.nome || '',
    cognome: dipendente?.cognome || '',
    codiceFiscale: dipendente?.codiceFiscale || '',
    dataNascita: dipendente?.dataNascita || '',
    luogoNascita: dipendente?.luogoNascita || '',
    indirizzo: dipendente?.indirizzo || '',
    citta: dipendente?.citta || '',
    cap: dipendente?.cap || '',
    telefono: dipendente?.telefono || '',
    email: dipendente?.email || '',
    iban: dipendente?.iban || '',
    dataAssunzione: dipendente?.dataAssunzione || '',
    tipoContratto: dipendente?.tipoContratto || 'TEMPO_INDETERMINATO',
    ccnl: dipendente?.ccnl || 'TURISMO',
    livello: dipendente?.livello || '',
    retribuzione: dipendente?.retribuzione?.toString() || '',
    oreSettimanali: dipendente?.oreSettimanali?.toString() || '40',
    sedeId: dipendente?.sedeId || '',
    attivo: dipendente?.attivo !== undefined ? dipendente.attivo : true,
    dataCessazione: dipendente?.dataCessazione || ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      attivo: checked,
      // Se il dipendente diventa attivo, rimuovi la data di cessazione
      dataCessazione: checked ? '' : prev.dataCessazione
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Utente non autenticato')
        setLoading(false)
        return
      }

      // Get the user's company
      const { data: userData } = await supabase
        .from('users')
        .select('aziendaId')
        .eq('id', user.id)
        .single()

      if (!userData?.aziendaId) {
        setError('Azienda non trovata')
        setLoading(false)
        return
      }

      // Prepare the data for API
      const preparedData = {
        id: dipendente?.id || crypto.randomUUID(),
        ...formData,
        retribuzione: parseFloat(formData.retribuzione),
        oreSettimanali: parseInt(formData.oreSettimanali),
        aziendaId: userData.aziendaId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (dipendente) {
        // Update existing dipendente using API route
        const response = await fetch(`/api/dipendenti/${dipendente.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Errore durante l\'aggiornamento del dipendente')
        } else {
          router.push('/dipendenti')
        }
      } else {
        // Create new dipendente using API route
        const response = await fetch('/api/dipendenti', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Errore durante la creazione del dipendente')
        } else {
          router.push('/dipendenti')
        }
      }
    } catch {
      setError('Si è verificato un errore durante il salvataggio')
    }
    
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dati Anagrafici */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dati Anagrafici</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nome" className="mb-1">
                Nome *
              </Label>
              <Input
                type="text"
                id="nome"
                name="nome"
                required
                value={formData.nome}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <Label htmlFor="cognome" className="mb-1">
                Cognome *
              </Label>
              <Input
                type="text"
                id="cognome"
                name="cognome"
                required
                value={formData.cognome}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <Label htmlFor="codiceFiscale" className="mb-1">
                Codice Fiscale *
              </Label>
              <Input
                type="text"
                id="codiceFiscale"
                name="codiceFiscale"
                required
                value={formData.codiceFiscale}
                onChange={handleChange}
                className="uppercase"
              />
            </div>
            
            <div>
              <Label htmlFor="dataNascita" className="mb-1">
                Data di Nascita *
              </Label>
              <Input
                type="date"
                id="dataNascita"
                name="dataNascita"
                required
                value={formData.dataNascita}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <Label htmlFor="luogoNascita" className="mb-1">
                Luogo di Nascita
              </Label>
              <Input
                type="text"
                id="luogoNascita"
                name="luogoNascita"
                value={formData.luogoNascita}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Dati di Contatto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dati di Contatto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="indirizzo" className="mb-1">
                Indirizzo
              </Label>
              <Input
                type="text"
                id="indirizzo"
                name="indirizzo"
                value={formData.indirizzo}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <Label htmlFor="citta" className="mb-1">
                Città
              </Label>
              <Input
                type="text"
                id="citta"
                name="citta"
                value={formData.citta}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <Label htmlFor="cap" className="mb-1">
                CAP
              </Label>
              <Input
                type="text"
                id="cap"
                name="cap"
                value={formData.cap}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <Label htmlFor="telefono" className="mb-1">
                Telefono
              </Label>
              <Input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="mb-1">
                Email
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <Label htmlFor="iban" className="mb-1">
                IBAN
              </Label>
              <Input
                type="text"
                id="iban"
                name="iban"
                value={formData.iban}
                onChange={handleChange}
                className="uppercase"
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dati Contrattuali */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dati Contrattuali</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="dataAssunzione" className="mb-1">
                Data Assunzione *
              </Label>
              <Input
                type="date"
                id="dataAssunzione"
                name="dataAssunzione"
                required
                value={formData.dataAssunzione}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <Label htmlFor="tipoContratto" className="mb-1">
                Tipo Contratto *
              </Label>
              <select
                id="tipoContratto"
                name="tipoContratto"
                required
                value={formData.tipoContratto}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="TEMPO_INDETERMINATO">Tempo Indeterminato</option>
                <option value="TEMPO_DETERMINATO">Tempo Determinato</option>
                <option value="APPRENDISTATO">Apprendistato</option>
                <option value="STAGIONALE">Stagionale</option>
                <option value="PARTTIME">Part-time</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="ccnl" className="mb-1">
                CCNL *
              </Label>
              <select
                id="ccnl"
                name="ccnl"
                required
                value={formData.ccnl}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="TURISMO">Turismo</option>
                <option value="COMMERCIO">Commercio</option>
                <option value="METALMECCANICI">Metalmeccanici</option>
                <option value="ALTRO">Altro</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="livello" className="mb-1">
                Livello *
              </Label>
              <Input
                type="text"
                id="livello"
                name="livello"
                required
                value={formData.livello}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <Label htmlFor="retribuzione" className="mb-1">
                Retribuzione Mensile (€) *
              </Label>
              <Input
                type="number"
                id="retribuzione"
                name="retribuzione"
                required
                step="0.01"
                min="0"
                value={formData.retribuzione}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <Label htmlFor="oreSettimanali" className="mb-1">
                Ore Settimanali *
              </Label>
              <Input
                type="number"
                id="oreSettimanali"
                name="oreSettimanali"
                required
                min="1"
                max="48"
                value={formData.oreSettimanali}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <Label htmlFor="sedeId" className="mb-1">
                Sede di Lavoro
              </Label>
              <select
                id="sedeId"
                name="sedeId"
                value={formData.sedeId}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Seleziona una sede</option>
                {sedi.map((sede) => (
                  <option key={sede.id} value={sede.id}>
                    {sede.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="attivo"
                checked={formData.attivo}
                onCheckedChange={handleCheckboxChange}
              />
              <Label
                htmlFor="attivo"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Dipendente attivo
              </Label>
            </div>

            {!formData.attivo && (
              <div>
                <Label htmlFor="dataCessazione" className="mb-1">
                  Data Cessazione {!formData.attivo && '*'}
                </Label>
                <Input
                  type="date"
                  id="dataCessazione"
                  name="dataCessazione"
                  required={!formData.attivo}
                  value={formData.dataCessazione}
                  onChange={handleChange}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dipendenti')}
        >
          Annulla
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="min-w-[120px]"
        >
          {loading ? 'Salvataggio...' : dipendente ? 'Aggiorna' : 'Salva'}
        </Button>
      </div>
    </form>
  )
}