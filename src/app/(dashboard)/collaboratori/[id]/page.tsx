'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeftIcon, UserCircleIcon, PencilIcon } from '@heroicons/react/24/outline'
import PrestazioniList from '@/components/collaboratori/prestazioni-list'
import CollaboratoreForm from '@/components/collaboratori/collaboratore-form'
import { formatCurrency } from '@/lib/utils/currency'

interface CollaboratoreDettaglio {
  id: string
  nome: string
  cognome: string
  codiceFiscale: string
  partitaIva: string | null
  email: string | null
  telefono: string | null
  indirizzo: string | null
  tipo: string
  tariffaOraria: number | null
  note: string | null
  attivo: boolean
  prestazioni: any[]
  _count: {
    prestazioni: number
  }
}

export default function CollaboratoreDettaglioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [collaboratore, setCollaboratore] = useState<CollaboratoreDettaglio | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)

  const fetchCollaboratore = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/collaboratori/${id}`)
      const data = await response.json()
      setCollaboratore(data.collaboratore)
    } catch (error) {
      console.error('Errore caricamento collaboratore:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCollaboratore()
  }, [id])

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'PRESTAZIONE_OCCASIONALE': return 'Prestazione Occasionale'
      case 'PARTITA_IVA': return 'Partita IVA'
      case 'CONSULENTE': return 'Consulente'
      default: return tipo
    }
  }

  const getTotaleCompensi = () => {
    if (!collaboratore) return 0
    return collaboratore.prestazioni.reduce((sum, p) => sum + p.importoTotale, 0)
  }

  const getTotaleDaPagare = () => {
    if (!collaboratore) return 0
    return collaboratore.prestazioni
      .filter(p => p.statoPagamento === 'DA_PAGARE')
      .reduce((sum, p) => sum + p.importoTotale, 0)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!collaboratore) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Collaboratore non trovato</p>
        <Button onClick={() => router.push('/collaboratori')} className="mt-4">
          Torna alla lista
        </Button>
      </div>
    )
  }

  // Mostra il form di modifica se richiesto
  if (showEditForm) {
    return (
      <CollaboratoreForm
        collaboratore={collaboratore}
        onSuccess={() => {
          setShowEditForm(false)
          fetchCollaboratore()
        }}
        onCancel={() => setShowEditForm(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/collaboratori')} className="hover:bg-primary/10">
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  {collaboratore.nome} {collaboratore.cognome}
                </h1>
                <Badge variant={collaboratore.attivo ? 'default' : 'secondary'} className="text-xs">
                  {collaboratore.attivo ? 'Attivo' : 'Non Attivo'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{collaboratore.codiceFiscale}</p>
            </div>
          </div>
          <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserCircleIcon className="h-4 w-4 mr-2" />
                Profilo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Profilo Collaboratore</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Dati Anagrafici */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Dati Anagrafici</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Nome</div>
                      <div className="font-medium">{collaboratore.nome}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Cognome</div>
                      <div className="font-medium">{collaboratore.cognome}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Codice Fiscale</div>
                      <div className="font-medium">{collaboratore.codiceFiscale}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Tipo Collaboratore</div>
                      <div className="font-medium">{getTipoLabel(collaboratore.tipo)}</div>
                    </div>
                    {collaboratore.partitaIva && (
                      <div>
                        <div className="text-sm text-muted-foreground">Partita IVA</div>
                        <div className="font-medium">{collaboratore.partitaIva}</div>
                      </div>
                    )}
                    {collaboratore.tariffaOraria && (
                      <div>
                        <div className="text-sm text-muted-foreground">Tariffa Oraria</div>
                        <div className="font-medium">{formatCurrency(collaboratore.tariffaOraria)}/h</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contatti */}
                {(collaboratore.email || collaboratore.telefono || collaboratore.indirizzo) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Contatti</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {collaboratore.email && (
                        <div>
                          <div className="text-sm text-muted-foreground">Email</div>
                          <div className="font-medium">{collaboratore.email}</div>
                        </div>
                      )}
                      {collaboratore.telefono && (
                        <div>
                          <div className="text-sm text-muted-foreground">Telefono</div>
                          <div className="font-medium">{collaboratore.telefono}</div>
                        </div>
                      )}
                      {collaboratore.indirizzo && (
                        <div className="col-span-2">
                          <div className="text-sm text-muted-foreground">Indirizzo</div>
                          <div className="font-medium">{collaboratore.indirizzo}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Note */}
                {collaboratore.note && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Note</h3>
                    <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">{collaboratore.note}</p>
                  </div>
                )}

                {/* Pulsante Modifica */}
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => {
                      setShowProfileDialog(false)
                      setShowEditForm(true)
                    }}
                    className="w-full"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Modifica Collaboratore
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Totale Prestazioni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{collaboratore._count.prestazioni}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Totale Compensi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(getTotaleCompensi())}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Da Pagare</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{formatCurrency(getTotaleDaPagare())}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista Prestazioni */}
      <PrestazioniList
        collaboratoreId={collaboratore.id}
        prestazioni={collaboratore.prestazioni}
        onRefresh={fetchCollaboratore}
      />
    </div>
  )
}
