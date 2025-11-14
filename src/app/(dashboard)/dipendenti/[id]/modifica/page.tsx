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
import NuovoDipendenteWrapper from '@/components/dipendenti/nuovo-dipendente-wrapper'

interface Dipendente {
  id: string
  nome: string
  cognome: string
  codiceFiscale: string
  dataNascita: string
  luogoNascita?: string
  indirizzo?: string
  citta?: string
  cap?: string
  telefono?: string
  email?: string
  iban?: string
  dataAssunzione: string
  dataScadenzaContratto?: string | null
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
  dataCessazione?: string | null
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
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

        // Format dates for form
        const d = dipendenteData.dipendente
        const formattedDipendente = {
          ...d,
          dataNascita: d.dataNascita ? new Date(d.dataNascita).toISOString().split('T')[0] : '',
          dataAssunzione: d.dataAssunzione ? new Date(d.dataAssunzione).toISOString().split('T')[0] : '',
          dataScadenzaContratto: d.dataScadenzaContratto ? new Date(d.dataScadenzaContratto).toISOString().split('T')[0] : null,
          dataCessazione: d.dataCessazione ? new Date(d.dataCessazione).toISOString().split('T')[0] : null,
        }

        setDipendente(formattedDipendente)

        // Fetch company locations
        const sediResponse = await fetch('/api/sedi')

        if (!sediResponse.ok) {
          throw new Error('Errore nel recupero delle sedi')
        }

        const sediData = await sediResponse.json()
        setSedi(sediData.sedi || [])
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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/dipendenti">
          <Button variant="ghost" size="sm" className="mr-4">
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Modifica Dipendente</h1>
      </div>

      {/* Form con nuovo layout */}
      <NuovoDipendenteWrapper sedi={sedi} dipendente={dipendente} />

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
                  disabled={isDeleting}
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