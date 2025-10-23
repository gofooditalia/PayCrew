'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
    sedeId: dipendente?.sedeId || ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      const dipendenteData = {
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
    } catch (err) {
      setError('Si è verificato un errore durante il salvataggio')
    }
    
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
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
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                id="nome"
                name="nome"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.nome}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="cognome" className="block text-sm font-medium text-gray-700 mb-1">
                Cognome *
              </label>
              <input
                type="text"
                id="cognome"
                name="cognome"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.cognome}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="codiceFiscale" className="block text-sm font-medium text-gray-700 mb-1">
                Codice Fiscale *
              </label>
              <input
                type="text"
                id="codiceFiscale"
                name="codiceFiscale"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                value={formData.codiceFiscale}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="dataNascita" className="block text-sm font-medium text-gray-700 mb-1">
                Data di Nascita *
              </label>
              <input
                type="date"
                id="dataNascita"
                name="dataNascita"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.dataNascita}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="luogoNascita" className="block text-sm font-medium text-gray-700 mb-1">
                Luogo di Nascita
              </label>
              <input
                type="text"
                id="luogoNascita"
                name="luogoNascita"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
              <label htmlFor="indirizzo" className="block text-sm font-medium text-gray-700 mb-1">
                Indirizzo
              </label>
              <input
                type="text"
                id="indirizzo"
                name="indirizzo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.indirizzo}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="citta" className="block text-sm font-medium text-gray-700 mb-1">
                Città
              </label>
              <input
                type="text"
                id="citta"
                name="citta"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.citta}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="cap" className="block text-sm font-medium text-gray-700 mb-1">
                CAP
              </label>
              <input
                type="text"
                id="cap"
                name="cap"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.cap}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                Telefono
              </label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="iban" className="block text-sm font-medium text-gray-700 mb-1">
                IBAN
              </label>
              <input
                type="text"
                id="iban"
                name="iban"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                value={formData.iban}
                onChange={handleChange}
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
              <label htmlFor="dataAssunzione" className="block text-sm font-medium text-gray-700 mb-1">
                Data Assunzione *
              </label>
              <input
                type="date"
                id="dataAssunzione"
                name="dataAssunzione"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.dataAssunzione}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="tipoContratto" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo Contratto *
              </label>
              <select
                id="tipoContratto"
                name="tipoContratto"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.tipoContratto}
                onChange={handleChange}
              >
                <option value="TEMPO_INDETERMINATO">Tempo Indeterminato</option>
                <option value="TEMPO_DETERMINATO">Tempo Determinato</option>
                <option value="APPRENDISTATO">Apprendistato</option>
                <option value="STAGIONALE">Stagionale</option>
                <option value="PARTTIME">Part-time</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="ccnl" className="block text-sm font-medium text-gray-700 mb-1">
                CCNL *
              </label>
              <select
                id="ccnl"
                name="ccnl"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.ccnl}
                onChange={handleChange}
              >
                <option value="TURISMO">Turismo</option>
                <option value="COMMERCIO">Commercio</option>
                <option value="METALMECCANICI">Metalmeccanici</option>
                <option value="ALTRO">Altro</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="livello" className="block text-sm font-medium text-gray-700 mb-1">
                Livello *
              </label>
              <input
                type="text"
                id="livello"
                name="livello"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.livello}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="retribuzione" className="block text-sm font-medium text-gray-700 mb-1">
                Retribuzione Mensile (€) *
              </label>
              <input
                type="number"
                id="retribuzione"
                name="retribuzione"
                required
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.retribuzione}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="oreSettimanali" className="block text-sm font-medium text-gray-700 mb-1">
                Ore Settimanali *
              </label>
              <input
                type="number"
                id="oreSettimanali"
                name="oreSettimanali"
                required
                min="1"
                max="48"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.oreSettimanali}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="sedeId" className="block text-sm font-medium text-gray-700 mb-1">
                Sede di Lavoro
              </label>
              <select
                id="sedeId"
                name="sedeId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.sedeId}
                onChange={handleChange}
              >
                <option value="">Seleziona una sede</option>
                {sedi.map((sede) => (
                  <option key={sede.id} value={sede.id}>
                    {sede.nome}
                  </option>
                ))}
              </select>
            </div>
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