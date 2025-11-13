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

                        return (
                          <div key={dipendente.id} className="p-4 border rounded-lg bg-card">
                            <div className="flex items-center justify-between mb-3">
                              <Link href={`/dipendenti/${dipendente.id}`}>
                                <div className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors">
                                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="font-bold text-primary text-sm">
                                      {dipendente.nome.charAt(0)}{dipendente.cognome.charAt(0)}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      {dipendente.nome} {dipendente.cognome}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Retribuzione Netta</p>
                                <p className="text-sm font-bold">{formatCurrency(netto)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Totale Pagato</p>
                                <p className="text-sm font-bold text-green-600">{formatCurrency(pagato)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Saldo</p>
                                <p className={`text-sm font-bold ${saldo > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                  {formatCurrency(saldo)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                  <BanknotesIcon className="h-3 w-3" />
                                  Contanti
                                </p>
                                <p className="text-sm font-medium mb-2">{formatCurrency(contanti)}</p>
                                <Button
                                  size="sm"
                                  className="h-6 px-2 text-[10px] bg-green-600 hover:bg-green-700 text-white whitespace-nowrap w-auto"
                                  onClick={() => handleRegistraContanti(dipendente)}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Registra Contanti
                                </Button>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                  <CreditCardIcon className="h-3 w-3" />
                                  Bonifici
                                </p>
                                <p className="text-sm font-medium mb-2">{formatCurrency(bonifici)}</p>
                                <Button
                                  size="sm"
                                  className="h-6 px-2 text-[10px] bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap w-auto"
                                  onClick={() => handleRegistraBonifico(dipendente)}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                  </svg>
                                  Registra Bonifico
                                </Button>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Avanzamento</span>
                                <Badge variant={percentuale >= 100 ? 'default' : percentuale > 0 ? 'secondary' : 'outline'} className="text-xs">
                                  {percentuale.toFixed(0)}%
                                </Badge>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${
                                    percentuale >= 100 ? 'bg-green-600' : percentuale > 0 ? 'bg-orange-500' : 'bg-muted-foreground'
                                  }`}
                                  style={{ width: `${Math.min(percentuale, 100)}%` }}
                                />
                              </div>
                            </div>
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
