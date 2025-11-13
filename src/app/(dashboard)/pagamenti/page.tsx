'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/currency'
import {
  BanknotesIcon,
  CreditCardIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'
import { PageLoader } from '@/components/loading'
import PagamentoContantiDialog from '@/components/pagamenti/pagamento-contanti-dialog'
import PagamentoBonificoDialog from '@/components/pagamenti/pagamento-bonifico-dialog'
import Link from 'next/link'

interface Sede {
  id: string
  nome: string
}

interface Pagamento {
  id: string
  importo: number
  tipoPagamento: 'CONTANTI' | 'BONIFICO'
  dataPagamento: string
  note: string | null
}

interface Dipendente {
  id: string
  nome: string
  cognome: string
  retribuzioneNetta: number | null
  limiteContanti: number | null
  limiteBonifico: number | null
  coefficienteMaggiorazione: number | null
  attivo: boolean
  sede?: {
    id: string
    nome: string
  }
  pagamenti: Pagamento[]
}

interface SedeGroup {
  sede: Sede | null
  dipendenti: Dipendente[]
  totali: {
    cashTotale: number
    cashPagato: number
    cashResiduo: number
    bonificoTotale: number
    bonificoPagato: number
    bonificoResiduo: number
    nettoTotale: number
    totalePagato: number
    totaleResiduo: number
  }
}

export default function PagamentiPage() {
  const supabase = createClient()
  const [dipendenti, setDipendenti] = useState<Dipendente[]>([])
  const [sedi, setSedi] = useState<Sede[]>([])
  const [loading, setLoading] = useState(true)

  // Filtri
  const now = new Date()
  const [meseFilter, setMeseFilter] = useState((now.getMonth() + 1).toString())
  const [annoFilter, setAnnoFilter] = useState(now.getFullYear().toString())

  // Dialog
  const [dialogContantiOpen, setDialogContantiOpen] = useState(false)
  const [dialogBonificoOpen, setDialogBonificoOpen] = useState(false)
  const [selectedDipendente, setSelectedDipendente] = useState<Dipendente | null>(null)

  // Espansione sedi
  const [expandedSedi, setExpandedSedi] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadData()
  }, [meseFilter, annoFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load dipendenti
      const response = await fetch('/api/dipendenti')
      if (response.ok) {
        const data = await response.json()
        const dipendentiList = data.dipendenti || []

        // Load pagamenti per ogni dipendente con filtro mese/anno
        const dipendentiWithPagamenti = await Promise.all(
          dipendentiList.map(async (dip: any) => {
            const pagamentiRes = await fetch(
              `/api/pagamenti?dipendenteId=${dip.id}&mese=${meseFilter}&anno=${annoFilter}`
            )
            const pagamenti = pagamentiRes.ok ? await pagamentiRes.json() : []
            return { ...dip, pagamenti: Array.isArray(pagamenti) ? pagamenti : [] }
          })
        )
        setDipendenti(dipendentiWithPagamenti)
      }

      // Load sedi
      const sediRes = await fetch('/api/sedi')
      if (sediRes.ok) {
        const sediData = await sediRes.json()
        setSedi(Array.isArray(sediData) ? sediData : (sediData.sedi || []))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
    setLoading(false)
  }

  const handleSuccess = () => {
    loadData()
  }

  const handleRegistraContanti = (dipendente: Dipendente) => {
    setSelectedDipendente(dipendente)
    setDialogContantiOpen(true)
  }

  const handleRegistraBonifico = (dipendente: Dipendente) => {
    setSelectedDipendente(dipendente)
    setDialogBonificoOpen(true)
  }

  const toggleSede = (sedeId: string) => {
    setExpandedSedi(prev => {
      const next = new Set(prev)
      if (next.has(sedeId)) {
        next.delete(sedeId)
      } else {
        next.add(sedeId)
      }
      return next
    })
  }

  // Calcola saldo per dipendente
  const calcolaSaldo = (dipendente: Dipendente) => {
    const netto = dipendente.retribuzioneNetta || 0
    const pagato = dipendente.pagamenti.reduce((sum, p) => sum + p.importo, 0)
    const contanti = dipendente.pagamenti
      .filter(p => p.tipoPagamento === 'CONTANTI')
      .reduce((sum, p) => sum + p.importo, 0)
    const bonifici = dipendente.pagamenti
      .filter(p => p.tipoPagamento === 'BONIFICO')
      .reduce((sum, p) => sum + p.importo, 0)

    return {
      netto,
      pagato,
      saldo: netto - pagato,
      contanti,
      bonifici
    }
  }

  // Raggruppa dipendenti per sede
  const raggruppaDipendentiPerSede = (): SedeGroup[] => {
    const groups = new Map<string, SedeGroup>()

    // Inizializza gruppi per ogni sede
    sedi.forEach(sede => {
      groups.set(sede.id, {
        sede,
        dipendenti: [],
        totali: {
          cashTotale: 0,
          cashPagato: 0,
          cashResiduo: 0,
          bonificoTotale: 0,
          bonificoPagato: 0,
          bonificoResiduo: 0,
          nettoTotale: 0,
          totalePagato: 0,
          totaleResiduo: 0
        }
      })
    })

    // Gruppo per dipendenti senza sede
    groups.set('no-sede', {
      sede: null,
      dipendenti: [],
      totali: {
        cashTotale: 0,
        cashPagato: 0,
        cashResiduo: 0,
        bonificoTotale: 0,
        bonificoPagato: 0,
        bonificoResiduo: 0,
        nettoTotale: 0,
        totalePagato: 0,
        totaleResiduo: 0
      }
    })

    // Assegna dipendenti ai gruppi e calcola totali
    dipendenti.forEach(dip => {
      const sedeId = dip.sede?.id || 'no-sede'
      const group = groups.get(sedeId)

      if (group) {
        group.dipendenti.push(dip)

        const { netto, pagato, saldo, contanti, bonifici } = calcolaSaldo(dip)
        const limiteContanti = Number(dip.limiteContanti) || 0
        const limiteBonifico = Number(dip.limiteBonifico) || 0
        const coefficiente = Number(dip.coefficienteMaggiorazione) || 0
        const bonificoMaggiorato = limiteBonifico + (limiteBonifico * coefficiente / 100)

        group.totali.cashTotale += limiteContanti
        group.totali.cashPagato += contanti
        group.totali.cashResiduo += Math.max(0, limiteContanti - contanti)

        group.totali.bonificoTotale += bonificoMaggiorato
        group.totali.bonificoPagato += bonifici
        group.totali.bonificoResiduo += Math.max(0, bonificoMaggiorato - bonifici)

        group.totali.nettoTotale += netto
        group.totali.totalePagato += pagato
        group.totali.totaleResiduo += saldo
      }
    })

    // Filtra gruppi vuoti e ordina
    return Array.from(groups.values())
      .filter(group => group.dipendenti.length > 0)
      .sort((a, b) => {
        // 'no-sede' sempre alla fine
        if (a.sede === null) return 1
        if (b.sede === null) return -1
        return (a.sede?.nome || '').localeCompare(b.sede?.nome || '')
      })
  }

  const sedeGroups = raggruppaDipendentiPerSede()

  // Genera opzioni mese
  const mesi = [
    { value: '1', label: 'Gennaio' },
    { value: '2', label: 'Febbraio' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Aprile' },
    { value: '5', label: 'Maggio' },
    { value: '6', label: 'Giugno' },
    { value: '7', label: 'Luglio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Settembre' },
    { value: '10', label: 'Ottobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Dicembre' }
  ]

  // Genera opzioni anno (anno corrente + 2 precedenti)
  const anni = [annoFilter, (parseInt(annoFilter) - 1).toString(), (parseInt(annoFilter) - 2).toString()]

  if (loading) {
    return <PageLoader message="Caricamento pagamenti..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestione Pagamenti</h1>
          <p className="text-muted-foreground">
            Vista aggregata per sede - Cash e bonifici
          </p>
        </div>
        <Link href="/pagamenti/storico">
          <Button variant="outline">
            Storico Pagamenti
          </Button>
        </Link>
      </div>

      {/* Filtri Mese/Anno */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Periodo:</Label>
              <Select value={meseFilter} onValueChange={setMeseFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mesi.map(mese => (
                    <SelectItem key={mese.value} value={mese.value}>
                      {mese.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={annoFilter} onValueChange={setAnnoFilter}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anni.map(anno => (
                    <SelectItem key={anno} value={anno}>
                      {anno}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(meseFilter !== (now.getMonth() + 1).toString() || annoFilter !== now.getFullYear().toString()) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMeseFilter((now.getMonth() + 1).toString())
                  setAnnoFilter(now.getFullYear().toString())
                }}
              >
                Torna a mese corrente
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista sedi con dipendenti */}
      <div className="grid gap-4">
        {sedeGroups.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Nessun dipendente trovato per il periodo selezionato
            </CardContent>
          </Card>
        ) : (
          sedeGroups.map(group => {
            const sedeId = group.sede?.id || 'no-sede'
            const isExpanded = expandedSedi.has(sedeId)

            return (
              <Card key={sedeId} className="overflow-hidden">
                {/* Header Sede con Totali Cash */}
                <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleSede(sedeId)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BuildingStorefrontIcon className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle className="text-xl">
                          {group.sede?.nome || 'Senza Sede'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {group.dipendenti.length} dipendent{group.dipendenti.length === 1 ? 'e' : 'i'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Totali Cash - Evidenziati */}
                      <div className="grid grid-cols-3 gap-4 mr-4">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">Cash Totale</p>
                          <p className="text-lg font-bold text-primary">
                            {formatCurrency(group.totali.cashTotale)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">Cash Pagato</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(group.totali.cashPagato)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">Cash Residuo</p>
                          <p className={`text-lg font-bold ${group.totali.cashResiduo > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            {formatCurrency(group.totali.cashResiduo)}
                          </p>
                        </div>
                      </div>

                      <Button variant="ghost" size="sm">
                        {isExpanded ? (
                          <ChevronUpIcon className="h-5 w-5" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Totali Bonifico e Netto (riga secondaria) */}
                  {!isExpanded && (
                    <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Bonifico Totale</p>
                        <p className="font-medium">{formatCurrency(group.totali.bonificoTotale)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Bonifico Pagato</p>
                        <p className="font-medium text-green-600">{formatCurrency(group.totali.bonificoPagato)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Netto Totale</p>
                        <p className="font-medium">{formatCurrency(group.totali.nettoTotale)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Residuo Totale</p>
                        <p className={`font-medium ${group.totali.totaleResiduo > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {formatCurrency(group.totali.totaleResiduo)}
                        </p>
                      </div>
                    </div>
                  )}
                </CardHeader>

                {/* Lista Dipendenti (espandibile) */}
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {group.dipendenti.map(dipendente => {
                        const { netto, pagato, saldo, contanti, bonifici } = calcolaSaldo(dipendente)
                        const percentuale = netto > 0 ? (pagato / netto) * 100 : 0

                        // Calcola valori bonifico e contanti
                        const limiteContanti = Number(dipendente.limiteContanti) || 0
                        const limiteBonifico = Number(dipendente.limiteBonifico) || 0
                        const coefficiente = Number(dipendente.coefficienteMaggiorazione) || 0
                        const bonificoTotale = limiteBonifico + (limiteBonifico * coefficiente / 100)
                        const retribuzioneTotale = bonificoTotale + limiteContanti
                        const saldoContanti = limiteContanti - contanti
                        const saldoBonifico = bonificoTotale - bonifici

                        return (
                          <div key={dipendente.id} className="border rounded-lg bg-card overflow-hidden">
                            {/* Header con nome e retribuzione totale */}
                            <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 border-b">
                              <Link href={`/dipendenti/${dipendente.id}`}>
                                <div className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity">
                                  <h3 className="text-lg font-bold">
                                    {dipendente.nome} {dipendente.cognome}
                                  </h3>
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Retribuzione Totale</p>
                                    <p className="text-xl font-bold text-primary">
                                      {formatCurrency(retribuzioneTotale)}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            </div>

                            <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x">
                              {/* Sezione BONIFICI */}
                              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/10">
                                <div className="flex items-center gap-2 mb-3">
                                  <CreditCardIcon className="h-5 w-5 text-blue-600" />
                                  <h4 className="font-semibold text-blue-900 dark:text-blue-400">BONIFICI</h4>
                                </div>

                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Totale Bonifico</span>
                                    <span className="text-lg font-bold text-blue-600">
                                      {formatCurrency(bonificoTotale)}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Pagato</span>
                                    <span className="text-base font-medium text-green-600">
                                      {formatCurrency(bonifici)}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between pt-2 border-t border-blue-200/50">
                                    <span className="text-sm font-medium">Saldo</span>
                                    <span className={`text-lg font-bold ${saldoBonifico > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                      {formatCurrency(saldoBonifico)}
                                    </span>
                                  </div>

                                  <Button
                                    size="sm"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => handleRegistraBonifico(dipendente)}
                                  >
                                    <CreditCardIcon className="h-4 w-4 mr-2" />
                                    Registra Bonifico
                                  </Button>
                                </div>
                              </div>

                              {/* Sezione CONTANTI */}
                              <div className="p-4 bg-green-50/50 dark:bg-green-950/10">
                                <div className="flex items-center gap-2 mb-3">
                                  <BanknotesIcon className="h-5 w-5 text-green-600" />
                                  <h4 className="font-semibold text-green-900 dark:text-green-400">CONTANTI</h4>
                                </div>

                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Totale Contanti</span>
                                    <span className="text-lg font-bold text-green-600">
                                      {formatCurrency(limiteContanti)}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Pagato</span>
                                    <span className="text-base font-medium text-green-600">
                                      {formatCurrency(contanti)}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between pt-2 border-t border-green-200/50">
                                    <span className="text-sm font-medium">Saldo</span>
                                    <span className={`text-lg font-bold ${saldoContanti > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                      {formatCurrency(saldoContanti)}
                                    </span>
                                  </div>

                                  <Button
                                    size="sm"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleRegistraContanti(dipendente)}
                                  >
                                    <BanknotesIcon className="h-4 w-4 mr-2" />
                                    Registra Contanti
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Progress bar migliorata */}
                            <div className="px-4 py-3 bg-gradient-to-r from-muted/20 to-muted/10 border-t">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-muted-foreground">Completamento</span>
                                  {percentuale >= 100 && (
                                    <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {formatCurrency(pagato)} / {formatCurrency(retribuzioneTotale)}
                                  </span>
                                  <Badge
                                    variant={percentuale >= 100 ? 'default' : percentuale > 0 ? 'secondary' : 'outline'}
                                    className={`text-xs font-bold ${
                                      percentuale >= 100 ? 'bg-green-600' : percentuale >= 50 ? 'bg-orange-500' : ''
                                    }`}
                                  >
                                    {percentuale.toFixed(0)}%
                                  </Badge>
                                </div>
                              </div>
                              <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden shadow-inner">
                                <div
                                  className={`h-full transition-all duration-500 ease-out relative ${
                                    percentuale >= 100
                                      ? 'bg-gradient-to-r from-green-500 to-green-600'
                                      : percentuale > 0
                                        ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                                        : 'bg-muted-foreground'
                                  }`}
                                  style={{ width: `${Math.min(percentuale, 100)}%` }}
                                >
                                  {percentuale > 5 && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer" />
                                  )}
                                </div>
                                {percentuale >= 100 && (
                                  <div className="absolute inset-0 bg-green-600/20 animate-pulse" />
                                )}
                              </div>
                            </div>

                            {/* Storico Pagamenti */}
                            {dipendente.pagamenti.length > 0 && (
                              <div className="border-t bg-muted/20">
                                <details className="group">
                                  <summary className="px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">
                                      Storico Pagamenti ({dipendente.pagamenti.length})
                                    </span>
                                    <ChevronDownIcon className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                                  </summary>
                                  <div className="px-4 pb-4 space-y-2">
                                    {dipendente.pagamenti
                                      .sort((a, b) => new Date(b.dataPagamento).getTime() - new Date(a.dataPagamento).getTime())
                                      .map(pagamento => (
                                        <div
                                          key={pagamento.id}
                                          className={`p-3 rounded-md border ${
                                            pagamento.tipoPagamento === 'BONIFICO'
                                              ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
                                              : 'bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                                          }`}
                                        >
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-2 flex-1">
                                              {pagamento.tipoPagamento === 'BONIFICO' ? (
                                                <CreditCardIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                              ) : (
                                                <BanknotesIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                              )}
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <Badge
                                                    variant="outline"
                                                    className={`text-xs ${
                                                      pagamento.tipoPagamento === 'BONIFICO'
                                                        ? 'border-blue-600 text-blue-600'
                                                        : 'border-green-600 text-green-600'
                                                    }`}
                                                  >
                                                    {pagamento.tipoPagamento}
                                                  </Badge>
                                                  <span className="text-xs text-muted-foreground">
                                                    {new Date(pagamento.dataPagamento).toLocaleDateString('it-IT', {
                                                      day: '2-digit',
                                                      month: '2-digit',
                                                      year: 'numeric'
                                                    })}
                                                  </span>
                                                </div>
                                                {pagamento.note && (
                                                  <p className="text-xs text-muted-foreground mt-1 break-words">
                                                    {pagamento.note}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                              <p className={`text-base font-bold ${
                                                pagamento.tipoPagamento === 'BONIFICO' ? 'text-blue-600' : 'text-green-600'
                                              }`}>
                                                {formatCurrency(pagamento.importo)}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </details>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* Dialog per pagamento contanti */}
      {selectedDipendente && (
        <>
          <PagamentoContantiDialog
            open={dialogContantiOpen}
            onOpenChange={setDialogContantiOpen}
            dipendenteId={selectedDipendente.id}
            dipendenteNome={`${selectedDipendente.nome} ${selectedDipendente.cognome}`}
            onSuccess={handleSuccess}
            limiteContanti={selectedDipendente.limiteContanti}
            pagamentiContantiEsistenti={
              selectedDipendente.pagamenti
                .filter(p => p.tipoPagamento === 'CONTANTI')
                .reduce((sum, p) => sum + p.importo, 0)
            }
          />

          {/* Dialog per pagamento bonifico */}
          <PagamentoBonificoDialog
            open={dialogBonificoOpen}
            onOpenChange={setDialogBonificoOpen}
            dipendenteId={selectedDipendente.id}
            dipendenteNome={`${selectedDipendente.nome} ${selectedDipendente.cognome}`}
            onSuccess={handleSuccess}
            limiteBonifico={selectedDipendente.limiteBonifico}
            coefficienteMaggiorazione={selectedDipendente.coefficienteMaggiorazione}
            pagamentiBonificoEsistenti={
              selectedDipendente.pagamenti
                .filter(p => p.tipoPagamento === 'BONIFICO')
                .reduce((sum, p) => sum + p.importo, 0)
            }
          />
        </>
      )}
    </div>
  )
}
