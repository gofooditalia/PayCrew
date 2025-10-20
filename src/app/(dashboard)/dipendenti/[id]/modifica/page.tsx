'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface Dipendente {
  id: string
  nome: string
  cognome: string
  codiceFiscale: string
  dataNascita: Date
  luogoNascita?: string
  indirizzo?: string
  citta?: string
  cap?: string
  telefono?: string
  email?: string
  iban?: string
  dataAssunzione: Date
  tipoContratto: string
  ccnl: string
  livello: string
  retribuzione: number
  oreSettimanali: number
  sedeId?: string
  sede?: {
    id: string
    nome: string
  }
  attivo: boolean
  dataCessazione?: Date
}

interface Sede {
  id: string
  nome: string
}

export default function ModificaDipendentePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [dipendente, setDipendente] = useState<Dipendente | null>(null)
  const [sedi, setSedi] = useState<Sede[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    codiceFiscale: '',
    dataNascita: '',
    luogoNascita: '',
    indirizzo: '',
    citta: '',
    cap: '',
    telefono: '',
    email: '',
    iban: '',
    dataAssunzione: '',
    tipoContratto: '',
    ccnl: '',
    livello: '',
    retribuzione: '',
    oreSettimanali: '40',
    sedeId: '',
    attivo: true,
    dataCessazione: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }

        // Fetch employee data
        const dipendenteResponse = await fetch(`/api/dipendenti/${params.id}`)
        
        if (!dipendenteResponse.ok) {
          throw new Error('Errore nel recupero dei dati del dipendente')
        }
        
        const dipendenteData = await dipendenteResponse.json()
        setDipendente(dipendenteData.dipendente)
        
        // Fetch company locations
        const sediResponse = await fetch('/api/sedi')
        
        if (!sediResponse.ok) {
          throw new Error('Errore nel recupero delle sedi')
        }
        
        const sediData = await sediResponse.json()
        setSedi(sediData.sedi || [])
        
        // Set form data
        const d = dipendenteData.dipendente
        setFormData({
          nome: d.nome || '',
          cognome: d.cognome || '',
          codiceFiscale: d.codiceFiscale || '',
          dataNascita: d.dataNascita ? new Date(d.dataNascita).toISOString().split('T')[0] : '',
          luogoNascita: d.luogoNascita || '',
          indirizzo: d.indirizzo || '',
          citta: d.citta || '',
          cap: d.cap || '',
          telefono: d.telefono || '',
          email: d.email || '',
          iban: d.iban || '',
          dataAssunzione: d.dataAssunzione ? new Date(d.dataAssunzione).toISOString().split('T')[0] : '',
          tipoContratto: d.tipoContratto || '',
          ccnl: d.ccnl || '',
          livello: d.livello || '',
          retribuzione: d.retribuzione ? d.retribuzione.toString() : '',
          oreSettimanali: d.oreSettimanali ? d.oreSettimanali.toString() : '40',
          sedeId: d.sedeId || '',
          attivo: d.attivo !== undefined ? d.attivo : true,
          dataCessazione: d.dataCessazione ? new Date(d.dataCessazione).toISOString().split('T')[0] : ''
        })
      } catch (err) {
        setError(`Errore: ${err instanceof Error ? err.message : 'Errore sconosciuto'}`)
      } finally {
        setLoadingData(false)
      }
    }

    if (params.id) {
      fetchData()
    }
  }, [params.id, router, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      if (!dipendente?.id) {
        setError('ID dipendente non disponibile')
        setSubmitting(false)
        return
      }

      const response = await fetch(`/api/dipendenti/${dipendente.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          retribuzione: parseFloat(formData.retribuzione),
          oreSettimanali: parseInt(formData.oreSettimanali),
          dataCessazione: formData.dataCessazione ? new Date(formData.dataCessazione) : null
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Errore durante l\'aggiornamento del dipendente')
        setSubmitting(false)
        return
      }

      setSuccess('Informazioni dipendente aggiornate con successo!')
    } catch (err) {
      setError(`Si è verificato un errore durante l'aggiornamento: ${err instanceof Error ? err.message : 'Errore sconosciuto'}`)
    }
    
    setSubmitting(false)
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento dati dipendente...</p>
        </div>
      </div>
    )
  }

  if (error || !dipendente) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/dipendenti">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Modifica Dipendente</h1>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-red-600">
                {error || 'Dipendente non trovato'}
              </p>
              <Link href="/dipendenti" className="mt-4 inline-block">
                <Button>Torna all&apos;elenco</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/dipendenti">
          <Button variant="ghost" size="sm" className="mr-4">
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Modifica Dipendente</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informazioni Dipendente</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-6">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                <label htmlFor="iban" className="block text-sm font-medium text-gray-700 mb-1">
                  IBAN
                </label>
                <input
                  type="text"
                  id="iban"
                  name="iban"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.iban}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informazioni Contrattuali</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <option value="">Seleziona...</option>
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
                    <option value="">Seleziona...</option>
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
                    Ore Settimanali
                  </label>
                  <input
                    type="number"
                    id="oreSettimanali"
                    name="oreSettimanali"
                    min="1"
                    max="60"
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
                    <option value="">Nessuna sede</option>
                    {sedi.map((sede) => (
                      <option key={sede.id} value={sede.id}>
                        {sede.nome}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="attivo"
                    name="attivo"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={formData.attivo}
                    onChange={handleChange}
                  />
                  <label htmlFor="attivo" className="ml-2 block text-sm text-gray-900">
                    Dipendente attivo
                  </label>
                </div>
                
                {!formData.attivo && (
                  <div>
                    <label htmlFor="dataCessazione" className="block text-sm font-medium text-gray-700 mb-1">
                      Data Cessazione
                    </label>
                    <input
                      type="date"
                      id="dataCessazione"
                      name="dataCessazione"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.dataCessazione}
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dipendenti')}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="min-w-[120px]"
              >
                {submitting ? 'Aggiornamento...' : 'Aggiorna Dipendente'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}