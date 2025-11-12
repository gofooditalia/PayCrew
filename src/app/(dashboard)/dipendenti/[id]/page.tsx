'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/currency'
import { PageLoader } from '@/components/loading'

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
  livello: string
  qualifica?: string
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
      {/* Header con nome dipendente */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Link href="/dipendenti">
            <Button variant="ghost" size="sm" className="mr-4 hover:bg-primary/10">
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                {dipendente.nome} {dipendente.cognome}
              </h1>
              <Badge
                variant={dipendente.attivo ? "default" : "destructive"}
                className="text-xs"
              >
                {dipendente.attivo ? 'Attivo' : 'Non attivo'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {dipendente.tipoContratto} • {dipendente.sede?.nome || 'Nessuna sede'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Button - Compatto */}
      <div className="mb-6 flex justify-end">
        <Link href={`/dipendenti/${dipendente.id}/modifica`} className="w-full sm:w-auto">
          <Button className="flex items-center justify-center w-full shadow-sm">
            <PencilIcon className="h-4 w-4 mr-2" />
            Modifica Dipendente
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-primary/50">
          <CardHeader>
            <CardTitle className="text-primary">Informazioni Personali</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Codice Fiscale</h3>
                <p className="text-base font-medium mt-1">{dipendente.codiceFiscale}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data di Nascita</h3>
                <p className="text-base font-medium mt-1">{formatDate(dipendente.dataNascita)}</p>
              </div>
              {dipendente.luogoNascita && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Luogo di Nascita</h3>
                  <p className="text-base font-medium mt-1">{dipendente.luogoNascita}</p>
                </div>
              )}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Indirizzo</h3>
                <p className="text-base font-medium mt-1">
                  {dipendente.indirizzo && `${dipendente.indirizzo}, `}
                  {dipendente.cap && `${dipendente.cap} `}
                  {dipendente.citta || 'Non specificato'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500/50">
          <CardHeader>
            <CardTitle className="text-blue-600">Contatti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dipendente.email ? (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</h3>
                  <p className="text-base font-medium mt-1 break-all">{dipendente.email}</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</h3>
                  <p className="text-base text-muted-foreground mt-1 italic">Non specificata</p>
                </div>
              )}
              {dipendente.telefono ? (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Telefono</h3>
                  <p className="text-base font-medium mt-1">{dipendente.telefono}</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Telefono</h3>
                  <p className="text-base text-muted-foreground mt-1 italic">Non specificato</p>
                </div>
              )}
              {dipendente.iban ? (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">IBAN</h3>
                  <p className="text-base font-medium mt-1 font-mono">{dipendente.iban}</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">IBAN</h3>
                  <p className="text-base text-muted-foreground mt-1 italic">Non specificato</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500/50">
          <CardHeader>
            <CardTitle className="text-green-600">Informazioni Contrattuali</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data Assunzione</h3>
                <p className="text-base font-medium mt-1">{formatDate(dipendente.dataAssunzione)}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo Contratto</h3>
                <p className="text-base font-medium mt-1">{dipendente.tipoContratto}</p>
              </div>
              {dipendente.dataScadenzaContratto && (dipendente.tipoContratto === 'TEMPO_DETERMINATO' || dipendente.tipoContratto === 'STAGIONALE') && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scadenza Contratto</h3>
                  <p className="text-base font-medium mt-1">{formatDate(dipendente.dataScadenzaContratto)}</p>
                </div>
              )}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CCNL</h3>
                <p className="text-base font-medium mt-1">{dipendente.ccnl}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Livello</h3>
                <p className="text-base font-medium mt-1">{dipendente.livello}</p>
              </div>
              {dipendente.qualifica && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qualifica</h3>
                  <p className="text-base font-medium mt-1">{dipendente.qualifica}</p>
                </div>
              )}
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">Retribuzione Mensile</h3>
                <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(dipendente.retribuzione)}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ore Settimanali</h3>
                <p className="text-base font-medium mt-1">{dipendente.oreSettimanali} ore</p>
              </div>
              {dipendente.dataCessazione && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data Cessazione</h3>
                  <p className="text-base font-medium mt-1">{formatDate(dipendente.dataCessazione)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500/50">
          <CardHeader>
            <CardTitle className="text-orange-600">Sede di Lavoro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sede Assegnata</h3>
                {dipendente.sede ? (
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-base font-medium">{dipendente.sede.nome}</p>
                    <Badge variant="outline" className="text-xs">Assegnato</Badge>
                  </div>
                ) : (
                  <div className="mt-2">
                    <p className="text-base text-muted-foreground italic">Nessuna sede assegnata</p>
                    <Badge variant="secondary" className="text-xs mt-2">Non Assegnato</Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}