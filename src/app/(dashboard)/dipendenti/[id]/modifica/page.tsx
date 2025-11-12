'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Link from 'next/link'
import { ArrowLeftIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { PageLoader } from '@/components/loading'
import { useToast } from '@/hooks/use-toast'

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
  dataScadenzaContratto?: Date
  tipoContratto: string
  ccnl: string
  note?: string
  qualifica?: string
  retribuzione: number
  retribuzioneNetta?: number | null
  limiteContanti?: number | null
  limiteBonifico?: number | null
  coefficienteMaggiorazione?: number | null
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
  const { toast } = useToast()

  const [dipendente, setDipendente] = useState<Dipendente | null>(null)
  const [sedi, setSedi] = useState<Sede[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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
    dataScadenzaContratto: '',
    tipoContratto: '',
    ccnl: '',
    note: '',
    qualifica: '',
    retribuzione: '',
    retribuzioneNetta: '',
    limiteContanti: '',
    limiteBonifico: '',
    coefficienteMaggiorazione: '',
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
          dataScadenzaContratto: d.dataScadenzaContratto ? new Date(d.dataScadenzaContratto).toISOString().split('T')[0] : '',
          tipoContratto: d.tipoContratto || '',
          ccnl: d.ccnl || '',
          note: d.note || '',
          qualifica: d.qualifica || '',
          retribuzione: d.retribuzione ? d.retribuzione.toString() : '',
          retribuzioneNetta: d.retribuzioneNetta ? d.retribuzioneNetta.toString() : '',
          limiteContanti: d.limiteContanti ? d.limiteContanti.toString() : '',
          limiteBonifico: d.limiteBonifico ? d.limiteBonifico.toString() : '',
          coefficienteMaggiorazione: (d.coefficienteMaggiorazione && d.coefficienteMaggiorazione > 0) ? d.coefficienteMaggiorazione.toString() : '',
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
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }

      // Calcola automaticamente retribuzioneNetta quando cambiano i limiti o il coefficiente
      if (name === 'limiteContanti' || name === 'limiteBonifico' || name === 'coefficienteMaggiorazione') {
        const contanti = parseFloat(updated.limiteContanti) || 0
        const bonifico = parseFloat(updated.limiteBonifico) || 0
        const coefficiente = parseFloat(updated.coefficienteMaggiorazione) || 0

        // Calcola bonifico maggiorato
        const bonificoMaggiorato = bonifico + (bonifico * coefficiente / 100)

        // Calcola retribuzione netta totale
        const netto = contanti + bonificoMaggiorato

        updated.retribuzioneNetta = netto > 0 ? netto.toFixed(2) : ''
      }

      return updated
    })
  }

  const handleDelete = async () => {
    if (!dipendente) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/dipendenti/${dipendente.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Errore durante l\'eliminazione del dipendente')
      }

      toast({
        title: "Dipendente eliminato",
        description: `${dipendente.nome} ${dipendente.cognome} è stato eliminato con successo.`,
      })

      // Redirect to dipendenti list after successful deletion
      router.push('/dipendenti')
    } catch (err) {
      toast({
        title: "Errore",
        description: err instanceof Error ? err.message : 'Errore durante l\'eliminazione',
        variant: "destructive",
      })
      setIsDeleting(false)
    }
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
          retribuzioneNetta: formData.retribuzioneNetta ? parseFloat(formData.retribuzioneNetta) : null,
          limiteContanti: formData.limiteContanti ? parseFloat(formData.limiteContanti) : null,
          limiteBonifico: formData.limiteBonifico ? parseFloat(formData.limiteBonifico) : null,
          coefficienteMaggiorazione: formData.coefficienteMaggiorazione ? parseFloat(formData.coefficienteMaggiorazione) : 0,
          oreSettimanali: parseInt(formData.oreSettimanali),
          dataCessazione: formData.dataCessazione ? new Date(formData.dataCessazione) : null,
          dataScadenzaContratto: formData.dataScadenzaContratto ? new Date(formData.dataScadenzaContratto) : null
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Errore durante l\'aggiornamento del dipendente')
        setSubmitting(false)
        return
      }

      // Redirect to employee list after successful update
      router.push('/dipendenti')
    } catch (err) {
      setError(`Si è verificato un errore durante l'aggiornamento: ${err instanceof Error ? err.message : 'Errore sconosciuto'}`)
      setSubmitting(false)
    }
  }

  if (loadingData) {
    return <PageLoader message="Caricamento dati dipendente..." />
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

                {(formData.tipoContratto === 'TEMPO_DETERMINATO' || formData.tipoContratto === 'STAGIONALE') && (
                  <div>
                    <label htmlFor="dataScadenzaContratto" className="block text-sm font-medium text-gray-700 mb-1">
                      Scadenza Contratto *
                    </label>
                    <input
                      type="date"
                      id="dataScadenzaContratto"
                      name="dataScadenzaContratto"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.dataScadenzaContratto}
                      onChange={handleChange}
                    />
                  </div>
                )}

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
                  <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                    Note
                  </label>
                  <input
                    type="text"
                    id="note"
                    name="note"
                    placeholder="Note aggiuntive sul contratto..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.note}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="qualifica" className="block text-sm font-medium text-gray-700 mb-1">
                    Qualifica
                  </label>
                  <input
                    type="text"
                    id="qualifica"
                    name="qualifica"
                    placeholder="es. Cameriere, Cuoco, Receptionist..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.qualifica}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="retribuzione" className="block text-sm font-medium text-gray-700 mb-1">
                    Retribuzione Lorda Mensile (€)
                  </label>
                  <input
                    type="number"
                    id="retribuzione"
                    name="retribuzione"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.retribuzione}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Retribuzione lorda mensile (opzionale, per riferimento)
                  </p>
                </div>
              </div>
            </div>

            {/* Configurazione Limiti Pagamento */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configurazione Limiti Pagamento</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="limiteContanti" className="block text-sm font-medium text-gray-700 mb-1">
                    Limite Contanti (€)
                  </label>
                  <input
                    type="number"
                    id="limiteContanti"
                    name="limiteContanti"
                    step="0.01"
                    min="0"
                    placeholder="es. 500.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.limiteContanti}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Quota massima in contanti
                  </p>
                </div>

                <div>
                  <label htmlFor="limiteBonifico" className="block text-sm font-medium text-gray-700 mb-1">
                    Limite Bonifico (€)
                  </label>
                  <input
                    type="number"
                    id="limiteBonifico"
                    name="limiteBonifico"
                    step="0.01"
                    min="0"
                    placeholder="es. 750.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.limiteBonifico}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Quota bonifico (prima della maggiorazione)
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="coefficienteMaggiorazione" className="block text-sm font-medium text-gray-700 mb-1">
                  Coefficiente Maggiorazione Bonifico (%)
                </label>
                <input
                  type="number"
                  id="coefficienteMaggiorazione"
                  name="coefficienteMaggiorazione"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="es. 4.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.coefficienteMaggiorazione}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Percentuale di maggiorazione applicata alla quota bonifico
                </p>
              </div>

              {/* Riepilogo calcolo */}
              {(formData.limiteContanti || formData.limiteBonifico) && (
                <div className="p-4 bg-gray-50 rounded-lg mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">Riepilogo Calcolo:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-600">Contanti:</span>
                    <span className="font-medium text-right">
                      {parseFloat(formData.limiteContanti || '0').toFixed(2)} €
                    </span>

                    <span className="text-gray-600">Bonifico base:</span>
                    <span className="font-medium text-right">
                      {parseFloat(formData.limiteBonifico || '0').toFixed(2)} €
                    </span>

                    <span className="text-gray-600">Maggiorazione ({formData.coefficienteMaggiorazione}%):</span>
                    <span className="font-medium text-right">
                      {(parseFloat(formData.limiteBonifico || '0') * parseFloat(formData.coefficienteMaggiorazione || '0') / 100).toFixed(2)} €
                    </span>

                    <span className="text-gray-600">Bonifico totale:</span>
                    <span className="font-medium text-right">
                      {(parseFloat(formData.limiteBonifico || '0') + (parseFloat(formData.limiteBonifico || '0') * parseFloat(formData.coefficienteMaggiorazione || '0') / 100)).toFixed(2)} €
                    </span>

                    <div className="col-span-2 h-px bg-gray-300 my-1"></div>

                    <span className="text-gray-700 font-semibold">Retribuzione Netta Totale:</span>
                    <span className="font-bold text-right text-lg text-indigo-600">
                      {formData.retribuzioneNetta ? parseFloat(formData.retribuzioneNetta).toFixed(2) : '0.00'} €
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="retribuzioneNetta" className="block text-sm font-medium text-gray-700 mb-1">
                  Retribuzione Netta Mensile (€) *
                </label>
                <input
                  type="number"
                  id="retribuzioneNetta"
                  name="retribuzioneNetta"
                  required
                  step="0.01"
                  min="0"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  value={formData.retribuzioneNetta}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Calcolato automaticamente da: Contanti + Bonifico maggiorato
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Orario e Sede</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

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

      {/* Danger Zone */}
      <Card className="mt-6 border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5" />
            Zona Pericolosa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              L'eliminazione del dipendente è un'azione permanente e irreversibile.
              Tutti i dati associati (presenze, turni, cedolini) verranno eliminati definitivamente.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto"
                  disabled={isDeleting || submitting}
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Eliminazione in corso...' : 'Elimina Dipendente Definitivamente'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Conferma eliminazione definitiva</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Stai per eliminare permanentemente <strong>{dipendente?.nome} {dipendente?.cognome}</strong> dal sistema.
                      </p>
                      <p className="text-sm text-muted-foreground mt-4">
                        Questa azione eliminerà:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                        <li>Tutti i dati anagrafici</li>
                        <li>Tutte le presenze registrate</li>
                        <li>Tutti i turni assegnati</li>
                        <li>Tutti i cedolini generati</li>
                      </ul>
                      <p className="text-sm font-semibold text-red-600 mt-4">
                        Questa azione non può essere annullata.
                      </p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Sì, elimina definitivamente
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}