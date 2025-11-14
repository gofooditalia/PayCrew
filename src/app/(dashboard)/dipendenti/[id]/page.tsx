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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface Dipendente {
  id: string
  nome: string
  cognome: string
  codiceFiscale?: string | null
  dataNascita?: Date | null
  luogoNascita?: string
  indirizzo?: string
  citta?: string
  cap?: string
  telefono?: string
  email?: string
  iban?: string
  dataAssunzione: Date
  dataScadenzaContratto?: Date
  tipoContratto?: string | null
  ccnl?: string | null
  note?: string
  qualifica?: string
  retribuzione?: number | null
  retribuzioneNetta?: number | null
  limiteBonus?: number | null
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
    <div className="p-4 sm:p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header compatto */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/dipendenti">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  {dipendente.nome} {dipendente.cognome}
                </h1>
                <Badge variant={dipendente.attivo ? "default" : "destructive"} className="text-xs">
                  {dipendente.attivo ? 'Attivo' : 'Non attivo'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {dipendente.tipoContratto || 'Contratto non specificato'} • {dipendente.sede?.nome || 'Nessuna sede'}
              </p>
            </div>
          </div>
          <Link href={`/dipendenti/${dipendente.id}/modifica`}>
            <Button className="flex items-center gap-2 shadow-sm">
              <PencilIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Modifica</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Riepilogo Retribuzione - Sempre visibile */}
      {dipendente.retribuzioneNetta && (() => {
        // Calcola bonifico totale con maggiorazione
        const limiteBonificoBase = dipendente.limiteBonifico || 0
        const coefficiente = dipendente.coefficienteMaggiorazione || 0
        const maggiorazione = limiteBonificoBase * (coefficiente / 100)
        const bonificoTotale = limiteBonificoBase + maggiorazione

        // Calcola retribuzione totale = Bonifico totale + Bonus
        const bonus = dipendente.limiteBonus || 0
        const retribuzioneTotale = bonificoTotale + bonus

        return (
          <Card className="mb-6 border-l-4 border-l-primary shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center sm:text-left">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Retribuzione Totale</h3>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(retribuzioneTotale)}</p>
                </div>
                {bonificoTotale > 0 && (
                  <div className="text-center sm:text-left">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quota Bonifico</h3>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(bonificoTotale)}</p>
                    {coefficiente > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Base: {formatCurrency(limiteBonificoBase)}
                      </p>
                    )}
                  </div>
                )}
                {bonus > 0 && (
                  <div className="text-center sm:text-left">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quota Bonus</h3>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(bonus)}</p>
                  </div>
                )}
              </div>
              {coefficiente > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Maggiorazione Bonifico</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Applicata al limite bonifico base
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-orange-600">{coefficiente}%</p>
                      <p className="text-sm font-semibold text-muted-foreground">
                        +{formatCurrency(maggiorazione)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })()}

      {/* Accordion con dettagli */}
      <Accordion type="multiple" className="space-y-4" defaultValue={["item-1"]}>
        {/* Informazioni Personali */}
        <AccordionItem value="item-1" className="border rounded-lg bg-card shadow-sm">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <span className="font-semibold text-primary">Informazioni Personali</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dipendente.codiceFiscale && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Codice Fiscale</h3>
                  <p className="text-base font-medium mt-1">{dipendente.codiceFiscale}</p>
                </div>
              )}
              {dipendente.dataNascita && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data di Nascita</h3>
                  <p className="text-base font-medium mt-1">{formatDate(dipendente.dataNascita)}</p>
                </div>
              )}
              {dipendente.luogoNascita && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Luogo di Nascita</h3>
                  <p className="text-base font-medium mt-1">{dipendente.luogoNascita}</p>
                </div>
              )}
              {(dipendente.indirizzo || dipendente.citta) && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Indirizzo</h3>
                  <p className="text-base font-medium mt-1">
                    {dipendente.indirizzo && `${dipendente.indirizzo}, `}
                    {dipendente.cap && `${dipendente.cap} `}
                    {dipendente.citta || 'Non specificato'}
                  </p>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Contatti */}
        <AccordionItem value="item-2" className="border rounded-lg bg-card shadow-sm">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-blue-600"></div>
              <span className="font-semibold text-blue-600">Contatti</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</h3>
                <p className="text-base font-medium mt-1 break-all">{dipendente.email || <span className="text-muted-foreground italic">Non specificata</span>}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Telefono</h3>
                <p className="text-base font-medium mt-1">{dipendente.telefono || <span className="text-muted-foreground italic">Non specificato</span>}</p>
              </div>
              <div className="sm:col-span-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">IBAN</h3>
                <p className="text-base font-medium mt-1 font-mono">{dipendente.iban || <span className="text-muted-foreground italic">Non specificato</span>}</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Informazioni Contrattuali */}
        <AccordionItem value="item-3" className="border rounded-lg bg-card shadow-sm">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-600"></div>
              <span className="font-semibold text-green-600">Informazioni Contrattuali</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data Assunzione</h3>
                <p className="text-base font-medium mt-1">{formatDate(dipendente.dataAssunzione)}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ore Settimanali</h3>
                <p className="text-base font-medium mt-1">{dipendente.oreSettimanali} ore</p>
              </div>
              {dipendente.tipoContratto && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo Contratto</h3>
                  <p className="text-base font-medium mt-1">{dipendente.tipoContratto}</p>
                </div>
              )}
              {dipendente.ccnl && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CCNL</h3>
                  <p className="text-base font-medium mt-1">{dipendente.ccnl}</p>
                </div>
              )}
              {dipendente.dataScadenzaContratto && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scadenza Contratto</h3>
                  <p className="text-base font-medium mt-1">{formatDate(dipendente.dataScadenzaContratto)}</p>
                </div>
              )}
              {dipendente.qualifica && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qualifica</h3>
                  <p className="text-base font-medium mt-1">{dipendente.qualifica}</p>
                </div>
              )}
              {dipendente.sede && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sede di Lavoro</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-base font-medium">{dipendente.sede.nome}</p>
                    <Badge variant="outline" className="text-xs">Assegnato</Badge>
                  </div>
                </div>
              )}
              {dipendente.note && (
                <div className="sm:col-span-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Note</h3>
                  <p className="text-base font-medium mt-1">{dipendente.note}</p>
                </div>
              )}
              {dipendente.dataCessazione && (
                <div className="sm:col-span-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data Cessazione</h3>
                  <p className="text-base font-medium mt-1">{formatDate(dipendente.dataCessazione)}</p>
                </div>
              )}
              {dipendente.retribuzione && (
                <div className="sm:col-span-2 bg-muted/30 p-4 rounded-lg border border-muted">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Retribuzione Lorda Mensile</h3>
                  <p className="text-lg font-semibold text-muted-foreground mt-1">{formatCurrency(dipendente.retribuzione)}</p>
                  <p className="text-xs text-muted-foreground mt-1">(Dato opzionale, solo per riferimento)</p>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}