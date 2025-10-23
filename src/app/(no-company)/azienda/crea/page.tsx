'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function CreaAziendaPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Utente non autenticato')
        setLoading(false)
        return
      }

      // Create the company using API route that uses Prisma
      const response = await fetch('/api/azienda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: user.id,
          userEmail: user.email || ''
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Errore durante la creazione dell\'azienda')
        setLoading(false)
        return
      }

      // Redirect to dashboard with a hard refresh to ensure the new layout is loaded
      window.location.href = '/dashboard'
    } catch {
      setError('Si è verificato un errore durante la creazione dell\'azienda')
    }
    
    setLoading(false)
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
          <h1 className="text-3xl font-bold text-gray-900">Crea la Tua Azienda</h1>
          <p className="text-gray-600">Configura i dati aziendali per iniziare a usare PayCrew</p>
        </div>
      </div>

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
                {loading ? 'Creazione...' : 'Crea Azienda'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}