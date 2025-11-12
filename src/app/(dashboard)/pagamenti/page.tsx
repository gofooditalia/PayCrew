'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/currency'
import { MagnifyingGlassIcon, PlusIcon, BanknotesIcon, CreditCardIcon } from '@heroicons/react/24/outline'
import { PageLoader } from '@/components/loading'
import PagamentoDialog from '@/components/pagamenti/pagamento-dialog'
import Link from 'next/link'

interface Sede {
  id: string
  nome: string
}

interface Dipendente {
  id: string
  nome: string
  cognome: string
  retribuzioneNetta: number | null
  attivo: boolean
  sede?: {
    id: string
    nome: string
  }
  pagamenti: {
    id: string
    importo: number
    tipoPagamento: 'CONTANTI' | 'BONIFICO'
    dataPagamento: string
  }[]
}

export default function PagamentiPage() {
  const supabase = createClient()
  const [dipendenti, setDipendenti] = useState<Dipendente[]>([])
  const [sedi, setSedi] = useState<Sede[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sedeFilter, setSedeFilter] = useState('all')
  const [statoFilter, setStatoFilter] = useState<'all' | 'da_pagare' | 'parziale' | 'pagato'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDipendente, setSelectedDipendente] = useState<Dipendente | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load dipendenti con pagamenti
      const response = await fetch('/api/dipendenti')
      if (response.ok) {
        const data = await response.json()
        const dipendentiWithPagamenti = await Promise.all(
          data.dipendenti.map(async (dip: any) => {
            const pagamentiRes = await fetch(`/api/pagamenti?dipendenteId=${dip.id}`)
            const pagamenti = pagamentiRes.ok ? await pagamentiRes.json() : []
            return { ...dip, pagamenti }
          })
        )
        setDipendenti(dipendentiWithPagamenti)
      }

      // Load sedi
      const sediRes = await fetch('/api/sedi')
      if (sediRes.ok) {
        const sediData = await sediRes.json()
        setSedi(sediData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
    setLoading(false)
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setSelectedDipendente(null)
    }
  }

  const handleSuccess = () => {
    loadData()
  }

  const handleRegistraPagamento = (dipendente: Dipendente) => {
    setSelectedDipendente(dipendente)
    setDialogOpen(true)
  }

  // Calcola saldo per dipendente
  const calcolaSaldo = (dipendente: Dipendente) => {
    const netto = dipendente.retribuzioneNetta || 0
    const pagato = dipendente.pagamenti.reduce((sum, p) => sum + p.importo, 0)
    return { netto, pagato, saldo: netto - pagato }
  }

  // Filtra dipendenti
  const dipendentiFiltrati = dipendenti.filter(dip => {
    const matchSearch = `${dip.nome} ${dip.cognome}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchSede = sedeFilter === 'all' || dip.sede?.id === sedeFilter

    const { netto, pagato } = calcolaSaldo(dip)
    let matchStato = true
    if (statoFilter === 'da_pagare') matchStato = pagato === 0 && netto > 0
    if (statoFilter === 'parziale') matchStato = pagato > 0 && pagato < netto
    if (statoFilter === 'pagato') matchStato = pagato >= netto && netto > 0

    return matchSearch && matchSede && matchStato
  })

  if (loading) {
    return <PageLoader message="Caricamento pagamenti..." />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestione Pagamenti</h1>
        <p className="text-muted-foreground">
          Vista aggregata pagamenti per dipendente
        </p>
      </div>

      {/* Filtri */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cerca dipendente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={sedeFilter} onValueChange={setSedeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtra per sede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le sedi</SelectItem>
                {sedi.map(sede => (
                  <SelectItem key={sede.id} value={sede.id}>{sede.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statoFilter} onValueChange={(value: any) => setStatoFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Stato pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="da_pagare">Da pagare</SelectItem>
                <SelectItem value="parziale">Parzialmente pagato</SelectItem>
                <SelectItem value="pagato">Completamente pagato</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista dipendenti con pagamenti */}
      <div className="grid gap-4">
        {dipendentiFiltrati.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Nessun dipendente trovato con i filtri selezionati
            </CardContent>
          </Card>
        ) : (
          dipendentiFiltrati.map(dipendente => {
            const { netto, pagato, saldo } = calcolaSaldo(dipendente)
            const percentuale = netto > 0 ? (pagato / netto) * 100 : 0
            const contanti = dipendente.pagamenti.filter(p => p.tipoPagamento === 'CONTANTI').reduce((sum, p) => sum + p.importo, 0)
            const bonifici = dipendente.pagamenti.filter(p => p.tipoPagamento === 'BONIFICO').reduce((sum, p) => sum + p.importo, 0)

            return (
              <Card key={dipendente.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">
                          {dipendente.nome.charAt(0)}{dipendente.cognome.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <Link href={`/dipendenti/${dipendente.id}`}>
                          <CardTitle className="text-lg hover:text-primary transition-colors cursor-pointer">
                            {dipendente.nome} {dipendente.cognome}
                          </CardTitle>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {dipendente.sede?.nome || 'Nessuna sede'}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleRegistraPagamento(dipendente)}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Registra Pagamento
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Retribuzione Netta</p>
                      <p className="text-lg font-bold">{formatCurrency(netto)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Totale Pagato</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(pagato)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Saldo da Pagare</p>
                      <p className={`text-lg font-bold ${saldo > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {formatCurrency(saldo)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <BanknotesIcon className="h-3 w-3" />
                        Contanti
                      </p>
                      <p className="text-sm font-medium">{formatCurrency(contanti)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <CreditCardIcon className="h-3 w-3" />
                        Bonifici
                      </p>
                      <p className="text-sm font-medium">{formatCurrency(bonifici)}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Avanzamento</span>
                      <Badge variant={percentuale >= 100 ? 'default' : percentuale > 0 ? 'secondary' : 'outline'}>
                        {percentuale.toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          percentuale >= 100 ? 'bg-green-600' : percentuale > 0 ? 'bg-orange-500' : 'bg-muted-foreground'
                        }`}
                        style={{ width: `${Math.min(percentuale, 100)}%` }}
                      />
                    </div>
                  </div>

                  {dipendente.pagamenti.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2">
                        Ultimi pagamenti ({dipendente.pagamenti.length})
                      </p>
                      <div className="space-y-1">
                        {dipendente.pagamenti.slice(0, 3).map(pagamento => (
                          <div key={pagamento.id} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {new Date(pagamento.dataPagamento).toLocaleDateString('it-IT')}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge variant={pagamento.tipoPagamento === 'BONIFICO' ? 'default' : 'secondary'} className="text-xs">
                                {pagamento.tipoPagamento === 'BONIFICO' ? 'Bonifico' : 'Contanti'}
                              </Badge>
                              <span className="font-medium">{formatCurrency(pagamento.importo)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Dialog per nuovo pagamento */}
      {selectedDipendente && (
        <PagamentoDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          dipendenteId={selectedDipendente.id}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
