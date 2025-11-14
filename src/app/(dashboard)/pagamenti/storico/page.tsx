'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/currency'
import { ChevronLeftIcon, BanknotesIcon, CreditCardIcon } from '@heroicons/react/24/outline'
import { PageLoader } from '@/components/loading'
import Link from 'next/link'

interface MeseStorico {
  mese: number
  anno: number
  totali: {
    cashTotale: number
    cashPagato: number
    bonificoTotale: number
    bonificoPagato: number
    nettoTotale: number
    totalePagato: number
  }
  numeroDipendenti: number
  numeroPagamenti: number
}

export default function StoricoPagamentiPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [storicoMesi, setStoricoMesi] = useState<MeseStorico[]>([])

  useEffect(() => {
    loadStorico()
  }, [])

  const loadStorico = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load tutti i dipendenti
      const dipendentiRes = await fetch('/api/dipendenti')
      if (!dipendentiRes.ok) return

      const dipendentiData = await dipendentiRes.json()
      const dipendentiList = dipendentiData.dipendenti || []

      // Carica tutti i pagamenti
      const pagamentiRes = await fetch('/api/pagamenti')
      if (!pagamentiRes.ok) return

      const pagamenti = await pagamentiRes.json()

      // Raggruppa per mese/anno
      const mesiMap = new Map<string, MeseStorico>()

      pagamenti.forEach((pagamento: any) => {
        const key = `${pagamento.anno}-${pagamento.mese}`

        if (!mesiMap.has(key)) {
          mesiMap.set(key, {
            mese: pagamento.mese,
            anno: pagamento.anno,
            totali: {
              cashTotale: 0,
              cashPagato: 0,
              bonificoTotale: 0,
              bonificoPagato: 0,
              nettoTotale: 0,
              totalePagato: 0
            },
            numeroDipendenti: 0,
            numeroPagamenti: 0
          })
        }

        const meseData = mesiMap.get(key)!
        meseData.numeroPagamenti++
        meseData.totali.totalePagato += pagamento.importo

        if (pagamento.tipoPagamento === 'CONTANTI') {
          meseData.totali.cashPagato += pagamento.importo
        } else {
          meseData.totali.bonificoPagato += pagamento.importo
        }
      })

      // Calcola totali teorici per ogni mese basato sui limiti dei dipendenti
      mesiMap.forEach((meseData) => {
        const dipendentiUnici = new Set<string>()

        pagamenti
          .filter((p: any) => p.mese === meseData.mese && p.anno === meseData.anno)
          .forEach((p: any) => dipendentiUnici.add(p.dipendenteId))

        meseData.numeroDipendenti = dipendentiUnici.size

        // Calcola totali teorici basati sui dipendenti che hanno ricevuto pagamenti
        dipendentiList
          .filter((d: any) => dipendentiUnici.has(d.id))
          .forEach((dip: any) => {
            meseData.totali.nettoTotale += Number(dip.retribuzioneNetta) || 0
            meseData.totali.cashTotale += Number(dip.limiteContanti) || 0

            const limiteBonifico = Number(dip.limiteBonifico) || 0
            const coefficiente = Number(dip.coefficienteMaggiorazione) || 0
            meseData.totali.bonificoTotale += limiteBonifico + (limiteBonifico * coefficiente / 100)
          })
      })

      // Converti in array e ordina per anno/mese decrescente
      const storicoArray = Array.from(mesiMap.values()).sort((a, b) => {
        if (a.anno !== b.anno) return b.anno - a.anno
        return b.mese - a.mese
      })

      setStoricoMesi(storicoArray)
    } catch (error) {
      console.error('Error loading storico:', error)
    }
    setLoading(false)
  }

  const getMeseNome = (mese: number): string => {
    const mesi = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ]
    return mesi[mese - 1] || ''
  }

  if (loading) {
    return <PageLoader message="Caricamento storico..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/pagamenti">
          <Button variant="outline" size="sm">
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Storico Pagamenti</h1>
          <p className="text-muted-foreground">
            Riepilogo mensile dei pagamenti
          </p>
        </div>
      </div>

      {/* Lista Mesi */}
      <div className="grid gap-4">
        {storicoMesi.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Nessun pagamento registrato
            </CardContent>
          </Card>
        ) : (
          storicoMesi.map(mese => {
            const percentualeCash = mese.totali.cashTotale > 0
              ? (mese.totali.cashPagato / mese.totali.cashTotale) * 100
              : 0
            const percentualeBonifico = mese.totali.bonificoTotale > 0
              ? (mese.totali.bonificoPagato / mese.totali.bonificoTotale) * 100
              : 0
            const percentualeTotale = mese.totali.nettoTotale > 0
              ? (mese.totali.totalePagato / mese.totali.nettoTotale) * 100
              : 0

            return (
              <Card key={`${mese.anno}-${mese.mese}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">
                        {getMeseNome(mese.mese)} {mese.anno}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {mese.numeroPagamenti} pagament{mese.numeroPagamenti === 1 ? 'o' : 'i'} • {mese.numeroDipendenti} dipendent{mese.numeroDipendenti === 1 ? 'e' : 'i'}
                      </p>
                    </div>
                    <Link href={`/pagamenti?mese=${mese.mese}&anno=${mese.anno}`}>
                      <Button variant="outline" size="sm">
                        Vedi Dettaglio
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Statistiche Cash */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BanknotesIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Contanti</span>
                      <Badge variant="secondary" className="ml-auto">
                        {percentualeCash.toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Totale</p>
                        <p className="text-sm font-medium">{formatCurrency(mese.totali.cashTotale)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pagato</p>
                        <p className="text-sm font-medium text-green-600">{formatCurrency(mese.totali.cashPagato)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Residuo</p>
                        <p className="text-sm font-medium text-orange-600">
                          {formatCurrency(Math.max(0, mese.totali.cashTotale - mese.totali.cashPagato))}
                        </p>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 transition-all"
                        style={{ width: `${Math.min(percentualeCash, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Statistiche Bonifico */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Bonifici</span>
                      <Badge variant="secondary" className="ml-auto">
                        {percentualeBonifico.toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Totale</p>
                        <p className="text-sm font-medium">{formatCurrency(mese.totali.bonificoTotale)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pagato</p>
                        <p className="text-sm font-medium text-green-600">{formatCurrency(mese.totali.bonificoPagato)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Residuo</p>
                        <p className="text-sm font-medium text-orange-600">
                          {formatCurrency(Math.max(0, mese.totali.bonificoTotale - mese.totali.bonificoPagato))}
                        </p>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.min(percentualeBonifico, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Totale Generale */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Totale Generale</span>
                      <Badge variant={percentualeTotale >= 100 ? 'default' : 'secondary'}>
                        {percentualeTotale.toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Netto Totale</p>
                        <p className="font-bold">{formatCurrency(mese.totali.nettoTotale)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Totale Pagato</p>
                        <p className="font-bold text-green-600">{formatCurrency(mese.totali.totalePagato)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Residuo</p>
                        <p className={`font-bold ${mese.totali.nettoTotale - mese.totali.totalePagato > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {formatCurrency(Math.max(0, mese.totali.nettoTotale - mese.totali.totalePagato))}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
