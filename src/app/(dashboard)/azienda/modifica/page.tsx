'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import SediManagement from '@/components/azienda/sedi-management'
import { PageLoader } from '@/components/loading'

export default function ModificaAziendaPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [aziendaId, setAziendaId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    nome: '',
    partitaIva: '',
    codiceFiscale: '',
    indirizzo: '',
    citta: '',
    cap: '',
    email: '',
    telefono: ''
  })

  useEffect(() => {
    const fetchAzienda = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }

        // Get user's company
        const response = await fetch('/api/user/azienda')
        if (!response.ok) {
          throw new Error('Errore nel recupero dei dati aziendali')
        }
        
        const data = await response.json()
        
        if (data.azienda) {
          setAziendaId(data.azienda.id)
          setFormData({
            nome: data.azienda.nome || '',
            partitaIva: data.azienda.partitaIva || '',
            codiceFiscale: data.azienda.codiceFiscale || '',
            indirizzo: data.azienda.indirizzo || '',
            citta: data.azienda.citta || '',
            cap: data.azienda.cap || '',
            email: data.azienda.email || '',
            telefono: data.azienda.telefono || ''
          })
        } else {
          setError('Nessuna azienda associata all\'utente')
          router.push('/azienda/crea')
        }
      } catch (err) {
        setError(`Errore: ${err instanceof Error ? err.message : 'Errore sconosciuto'}`)
      } finally {
        setLoadingData(false)
      }
    }

    fetchAzienda()
  }, [router, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setSuccess(null)

    try {
      if (!aziendaId) {
        setError('ID azienda non disponibile')
        setLoading(false)
        return
      }

      const response = await fetch(`/api/azienda/${aziendaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Errore durante l\'aggiornamento dell\'azienda')
        setLoading(false)
        return
      }

      setSuccess('Informazioni aziendali aggiornate con successo!')
    } catch (err) {
      setError(`Si è verificato un errore durante l'aggiornamento: ${err instanceof Error ? err.message : 'Errore sconosciuto'}`)
    }
    
    setLoading(false)
  }

  if (loadingData) {
    return <PageLoader message="Caricamento dati aziendali..." />
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mr-4">
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profilo Azienda</h1>
          <p className="text-gray-600">Gestisci le informazioni della tua azienda e le sedi operative</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
        <CardHeader>
          <CardTitle>Informazioni Azienda</CardTitle>
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
                  Nome Azienda *
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
                <label htmlFor="partitaIva" className="block text-sm font-medium text-gray-700 mb-1">
                  Partita IVA *
                </label>
                <input
                  type="text"
                  id="partitaIva"
                  name="partitaIva"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.partitaIva}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="codiceFiscale" className="block text-sm font-medium text-gray-700 mb-1">
                  Codice Fiscale
                </label>
                <input
                  type="text"
                  id="codiceFiscale"
                  name="codiceFiscale"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.codiceFiscale}
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
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Azienda
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
            </div>
            
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? 'Aggiornamento...' : 'Aggiorna Azienda'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {aziendaId && <SediManagement aziendaId={aziendaId} />}
      </div>
    </div>
  )
}