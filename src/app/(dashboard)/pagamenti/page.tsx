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
  BuildingStorefrontIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { PageLoader } from '@/components/loading'
import PagamentoContantiDialog from '@/components/pagamenti/pagamento-contanti-dialog'
import PagamentoBonificoDialog from '@/components/pagamenti/pagamento-bonifico-dialog'
import Link from 'next/link'
import { toast } from 'sonner'

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
  const [sedeFilter, setSedeFilter] = useState<string>('') // '' = mostra prima sede disponibile

  // Dialog
  const [dialogContantiOpen, setDialogContantiOpen] = useState(false)
  const [dialogBonificoOpen, setDialogBonificoOpen] = useState(false)
  const [selectedDipendente, setSelectedDipendente] = useState<Dipendente | null>(null)
  const [editingPagamento, setEditingPagamento] = useState<Pagamento | null>(null)

  // Non serve più il tracking delle sedi espanse (sempre visibile la sede selezionata)

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
    setEditingPagamento(null) // Reset editing
    setDialogContantiOpen(true)
  }

  const handleRegistraBonifico = (dipendente: Dipendente) => {
    setSelectedDipendente(dipendente)
    setEditingPagamento(null) // Reset editing
    setDialogBonificoOpen(true)
  }

  const handleEditPagamento = (dipendente: Dipendente, pagamento: Pagamento) => {
    setSelectedDipendente(dipendente)
    setEditingPagamento(pagamento)

    if (pagamento.tipoPagamento === 'CONTANTI') {
      setDialogContantiOpen(true)
    } else {
      setDialogBonificoOpen(true)
    }
  }

  const handleDeletePagamento = async (pagamentoId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo pagamento?')) {
      return
    }

    try {
      const response = await fetch(`/api/pagamenti/${pagamentoId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Pagamento eliminato con successo')
        loadData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Errore nell\'eliminazione del pagamento')
      }
    } catch (error) {
      console.error('Error deleting pagamento:', error)
      toast.error('Errore nell\'eliminazione del pagamento')
    }
  }

  // Determina quale sede mostrare
  const getSedeToShow = (): SedeGroup | null => {
    const groups = raggruppaDipendentiPerSede()

    if (groups.length === 0) return null

    // Se c'è un filtro sede attivo, mostra quella
    if (sedeFilter) {
      return groups.find(g => g.sede?.id === sedeFilter) || groups[0]
    }

    // Altrimenti mostra la prima sede disponibile
    return groups[0]
  }

  // Calcola saldo per dipendente
  const calcolaSaldo = (dipendente: Dipendente) => {
    const netto = Number(dipendente.retribuzioneNetta) || 0
    const pagato = dipendente.pagamenti.reduce((sum, p) => sum + Number(p.importo), 0)
    const contanti = dipendente.pagamenti
      .filter(p => p.tipoPagamento === 'CONTANTI')
      .reduce((sum, p) => sum + Number(p.importo), 0)
    const bonifici = dipendente.pagamenti
      .filter(p => p.tipoPagamento === 'BONIFICO')
      .reduce((sum, p) => sum + Number(p.importo), 0)

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

      {/* Filtri Periodo e Sede */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Filtro Periodo */}
            <div className="flex items-center gap-2 flex-wrap">
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

              {(meseFilter !== (now.getMonth() + 1).toString() || annoFilter !== now.getFullYear().toString()) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMeseFilter((now.getMonth() + 1).toString())
                    setAnnoFilter(now.getFullYear().toString())
                  }}
                >
                  Mese corrente
                </Button>
              )}
            </div>

            {/* Filtro Sede */}
            {sedi.length > 0 && (
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Sede:</Label>
                <Select value={sedeFilter || '__all__'} onValueChange={(val) => setSedeFilter(val === '__all__' ? '' : val)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tutte le sedi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tutte le sedi</SelectItem>
                    {sedi.map(sede => (
                      <SelectItem key={sede.id} value={sede.id}>
                        {sede.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sede selezionata con dipendenti */}
      <div className="grid gap-4">
        {(() => {
          const sedeToShow = getSedeToShow()

          if (!sedeToShow) {
            return (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Nessun dipendente trovato per il periodo selezionato
                </CardContent>
              </Card>
            )
          }

          const group = sedeToShow

          return (
            <Card key={group.sede?.id || 'no-sede'} className="overflow-hidden">
              {/* Header Sede - Solo Residui */}
              <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
                {/* Nome sede */}
                <div className="flex items-center gap-3 mb-3">
                  <BuildingStorefrontIcon className="h-6 w-6 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <CardTitle className="text-lg sm:text-xl break-words">
                      {group.sede?.nome || 'Senza Sede'}
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {group.dipendenti.length} dipendent{group.dipendenti.length === 1 ? 'e' : 'i'}
                    </p>
                  </div>
                </div>

                {/* Totali: Cash Residuo, Bonifico Residuo, Netto Totale */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-white dark:bg-gray-900 p-3 rounded-lg border border-primary/20 shadow-sm">
                  <div className="text-center">
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 leading-tight">Cash<br className="sm:hidden" /> Residuo</p>
                    <p className={`text-sm sm:text-lg font-bold ${group.totali.cashResiduo > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {formatCurrency(group.totali.cashResiduo)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 leading-tight">Bonifico<br className="sm:hidden" /> Residuo</p>
                    <p className={`text-sm sm:text-lg font-bold ${group.totali.bonificoResiduo > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {formatCurrency(group.totali.bonificoResiduo)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 leading-tight">Netto<br className="sm:hidden" /> Totale</p>
                    <p className="text-sm sm:text-lg font-bold text-primary">
                      {formatCurrency(group.totali.nettoTotale)}
                    </p>
                  </div>
                </div>
              </CardHeader>

              {/* Lista Dipendenti - Sempre visibile */}
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
                            {/* Header con nome e retribuzione totale - Mobile Optimized */}
                            <div className="bg-gradient-to-r from-primary/10 to-transparent p-3 sm:p-4 border-b">
                              <Link href={`/dipendenti/${dipendente.id}`}>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                                  <h3 className="text-base sm:text-lg font-bold">
                                    {dipendente.nome} {dipendente.cognome}
                                  </h3>
                                  <div className="text-left sm:text-right">
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">Retribuzione Totale</p>
                                    <p className="text-lg sm:text-xl font-bold text-primary">
                                      {formatCurrency(retribuzioneTotale)}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            </div>

                            <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x">
                              {/* Sezione BONIFICI - Mobile Optimized */}
                              <div className="p-3 sm:p-4 bg-blue-50/50 dark:bg-blue-950/10">
                                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                  <CreditCardIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                                  <h4 className="text-sm sm:text-base font-semibold text-blue-900 dark:text-blue-400">BONIFICI</h4>
                                </div>

                                <div className="space-y-2 sm:space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs sm:text-sm text-muted-foreground">Totale Bonifico</span>
                                    <span className="text-sm sm:text-lg font-bold text-blue-600">
                                      {formatCurrency(bonificoTotale)}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <span className="text-xs sm:text-sm text-muted-foreground">Pagato</span>
                                    <span className="text-sm sm:text-base font-medium text-green-600">
                                      {formatCurrency(bonifici)}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-blue-200/50">
                                    <span className="text-xs sm:text-sm font-medium">Saldo</span>
                                    <span className={`text-sm sm:text-lg font-bold ${saldoBonifico > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                      {formatCurrency(saldoBonifico)}
                                    </span>
                                  </div>

                                  <Button
                                    size="sm"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
                                    onClick={() => handleRegistraBonifico(dipendente)}
                                  >
                                    <CreditCardIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                    Registra Bonifico
                                  </Button>
                                </div>
                              </div>

                              {/* Sezione CONTANTI - Mobile Optimized */}
                              <div className="p-3 sm:p-4 bg-green-50/50 dark:bg-green-950/10">
                                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                  <BanknotesIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                                  <h4 className="text-sm sm:text-base font-semibold text-green-900 dark:text-green-400">CONTANTI</h4>
                                </div>

                                <div className="space-y-2 sm:space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs sm:text-sm text-muted-foreground">Totale Contanti</span>
                                    <span className="text-sm sm:text-lg font-bold text-green-600">
                                      {formatCurrency(limiteContanti)}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <span className="text-xs sm:text-sm text-muted-foreground">Pagato</span>
                                    <span className="text-sm sm:text-base font-medium text-green-600">
                                      {formatCurrency(contanti)}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-green-200/50">
                                    <span className="text-xs sm:text-sm font-medium">Saldo</span>
                                    <span className={`text-sm sm:text-lg font-bold ${saldoContanti > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                      {formatCurrency(saldoContanti)}
                                    </span>
                                  </div>

                                  <Button
                                    size="sm"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
                                    onClick={() => handleRegistraContanti(dipendente)}
                                  >
                                    <BanknotesIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                    Registra Contanti
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Progress bar - Mobile Optimized */}
                            <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-muted/20 to-muted/10 border-t">
                              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground">Completamento</span>
                                  {percentuale >= 100 && (
                                    <svg className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                                    {formatCurrency(pagato)} / {formatCurrency(retribuzioneTotale)}
                                  </span>
                                  <Badge
                                    variant={percentuale >= 100 ? 'default' : percentuale > 0 ? 'secondary' : 'outline'}
                                    className={`text-[10px] sm:text-xs font-bold ${
                                      percentuale >= 100 ? 'bg-green-600' : percentuale >= 50 ? 'bg-orange-500' : ''
                                    }`}
                                  >
                                    {percentuale.toFixed(0)}%
                                  </Badge>
                                </div>
                              </div>
                              <div className="relative h-2.5 sm:h-3 bg-muted/50 rounded-full overflow-hidden shadow-inner">
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

                            {/* Storico Pagamenti - Mobile Optimized */}
                            {dipendente.pagamenti.length > 0 && (
                              <div className="border-t bg-muted/20">
                                <details className="group">
                                  <summary className="px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer hover:bg-muted/40 transition-colors flex items-center justify-between">
                                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                                      Storico Pagamenti ({dipendente.pagamenti.length})
                                    </span>
                                    <ChevronDownIcon className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                                  </summary>
                                  <div className="px-2 sm:px-4 pb-3 sm:pb-4 space-y-2">
                                    {dipendente.pagamenti
                                      .sort((a, b) => new Date(b.dataPagamento).getTime() - new Date(a.dataPagamento).getTime())
                                      .map(pagamento => (
                                        <div
                                          key={pagamento.id}
                                          className={`p-2 sm:p-3 rounded-md border ${
                                            pagamento.tipoPagamento === 'BONIFICO'
                                              ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
                                              : 'bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                                          }`}
                                        >
                                          {/* Layout mobile: stack verticale con importo in alto */}
                                          <div className="flex flex-col gap-2">
                                            {/* Header: tipo, data, importo */}
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="flex items-start gap-1.5 sm:gap-2 flex-1 min-w-0">
                                                {pagamento.tipoPagamento === 'BONIFICO' ? (
                                                  <CreditCardIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                                ) : (
                                                  <BanknotesIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-1.5 flex-wrap">
                                                    <Badge
                                                      variant="outline"
                                                      className={`text-[10px] sm:text-xs ${
                                                        pagamento.tipoPagamento === 'BONIFICO'
                                                          ? 'border-blue-600 text-blue-600'
                                                          : 'border-green-600 text-green-600'
                                                      }`}
                                                    >
                                                      {pagamento.tipoPagamento}
                                                    </Badge>
                                                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                                                      {new Date(pagamento.dataPagamento).toLocaleDateString('it-IT', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                      })}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="flex items-start gap-1 flex-shrink-0">
                                                <p className={`text-sm sm:text-base font-bold whitespace-nowrap ${
                                                  pagamento.tipoPagamento === 'BONIFICO' ? 'text-blue-600' : 'text-green-600'
                                                }`}>
                                                  {formatCurrency(pagamento.importo)}
                                                </p>
                                              </div>
                                            </div>

                                            {/* Note (se presenti) e pulsanti azione */}
                                            <div className="flex items-end justify-between gap-2">
                                              {pagamento.note ? (
                                                <p className="text-[10px] sm:text-xs text-muted-foreground break-words flex-1">
                                                  {pagamento.note}
                                                </p>
                                              ) : (
                                                <div className="flex-1" />
                                              )}
                                              <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleEditPagamento(dipendente, pagamento)
                                                  }}
                                                >
                                                  <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hover:text-primary" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeletePagamento(pagamento.id)
                                                  }}
                                                >
                                                  <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hover:text-destructive" />
                                                </Button>
                                              </div>
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
            </Card>
          )
        })()}
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
            editingPagamento={editingPagamento}
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
            editingPagamento={editingPagamento}
          />
        </>
      )}
    </div>
  )
}
