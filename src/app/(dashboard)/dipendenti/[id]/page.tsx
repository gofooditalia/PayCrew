'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline'
import { formatCurrency } from '@/lib/utils/currency'

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
  createdAt: Date
  updatedAt: Date
}

export default function DipendenteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [dipendente, setDipendente] = useState<Dipendente | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDipendente = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }

        const response = await fetch(`/api/dipendenti/${params.id}`)
        
        if (!response.ok) {
          throw new Error('Errore nel recupero dei dati del dipendente')
        }
        
        const data = await response.json()
        setDipendente(data.dipendente)
      } catch (err) {
        setError(`Errore: ${err instanceof Error ? err.message : 'Errore sconosciuto'}`)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchDipendente()
    }
  }, [params.id, router, supabase])

  // La funzione formatCurrency è ora importata da @/lib/utils/currency

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('it-IT')
  }

  if (loading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Dettagli Dipendente</h1>
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/dipendenti">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Dettagli Dipendente</h1>
        </div>
        <Link href={`/dipendenti/${dipendente.id}/modifica`}>
          <Button className="flex items-center">
            <PencilIcon className="h-4 w-4 mr-2" />
            Modifica
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informazioni Personali</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Nome Completo</h3>
                <p className="text-lg">{dipendente.nome} {dipendente.cognome}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Codice Fiscale</h3>
                <p>{dipendente.codiceFiscale}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Data di Nascita</h3>
                <p>{formatDate(dipendente.dataNascita)}</p>
              </div>
              {dipendente.luogoNascita && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Luogo di Nascita</h3>
                  <p>{dipendente.luogoNascita}</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Indirizzo</h3>
                <p>
                  {dipendente.indirizzo && `${dipendente.indirizzo}, `}
                  {dipendente.cap && `${dipendente.cap} `}
                  {dipendente.citta || 'Non specificato'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contatti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dipendente.email && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p>{dipendente.email}</p>
                </div>
              )}
              {dipendente.telefono && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Telefono</h3>
                  <p>{dipendente.telefono}</p>
                </div>
              )}
              {dipendente.iban && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">IBAN</h3>
                  <p>{dipendente.iban}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informazioni Contrattuali</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Data Assunzione</h3>
                <p>{formatDate(dipendente.dataAssunzione)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Tipo Contratto</h3>
                <p>{dipendente.tipoContratto}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">CCNL</h3>
                <p>{dipendente.ccnl}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Livello</h3>
                <p>{dipendente.livello}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Retribuzione</h3>
                <p className="text-lg font-semibold">{formatCurrency(dipendente.retribuzione)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Ore Settimanali</h3>
                <p>{dipendente.oreSettimanali}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Stato</h3>
                <p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    dipendente.attivo 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {dipendente.attivo ? 'Attivo' : 'Non attivo'}
                  </span>
                </p>
              </div>
              {dipendente.dataCessazione && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Data Cessazione</h3>
                  <p>{formatDate(dipendente.dataCessazione)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sede di Lavoro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dipendente.sede ? (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Sede Assegnata</h3>
                  <p>{dipendente.sede.nome}</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Sede Assegnata</h3>
                  <p>Nessuna sede assegnata</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}