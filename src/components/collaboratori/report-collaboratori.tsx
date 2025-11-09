'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { Download, Filter, ChevronDown, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface ReportData {
  prestazioni: any[]
  statistiche: {
    totalePrestazioni: number
    totaleImporto: number
    totaleDaPagare: number
    totalePagato: number
    perTipo: Record<string, { count: number; totale: number }>
  }
}

export default function ReportCollaboratori() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [filtri, setFiltri] = useState({
    dataInizio: '',
    dataFine: '',
    tipo: 'all',
    statoPagamento: 'all',
  })

  const fetchReport = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filtri.dataInizio) params.append('dataInizio', filtri.dataInizio)
      if (filtri.dataFine) params.append('dataFine', filtri.dataFine)
      if (filtri.tipo && filtri.tipo !== 'all') params.append('tipo', filtri.tipo)
      if (filtri.statoPagamento && filtri.statoPagamento !== 'all') params.append('statoPagamento', filtri.statoPagamento)

      const response = await fetch(`/api/report/collaboratori?${params}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Errore caricamento report:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [])

  const handleReset = () => {
    setFiltri({
      dataInizio: '',
      dataFine: '',
      tipo: 'all',
      statoPagamento: 'all',
    })
  }

  const setMeseCorrente = () => {
    const oggi = new Date()
    const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1)
    const fineMese = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0)

    setFiltri({
      ...filtri,
      dataInizio: inizioMese.toISOString().split('T')[0],
      dataFine: fineMese.toISOString().split('T')[0],
    })
  }

  const setAnnoCorrente = () => {
    const oggi = new Date()
    const inizioAnno = new Date(oggi.getFullYear(), 0, 1)
    const fineAnno = new Date(oggi.getFullYear(), 11, 31)

    setFiltri({
      ...filtri,
      dataInizio: inizioAnno.toISOString().split('T')[0],
      dataFine: fineAnno.toISOString().split('T')[0],
    })
  }

  // Conta filtri attivi
  const filtriAttivi = [
    filtri.dataInizio !== '',
    filtri.dataFine !== '',
    filtri.tipo !== 'all',
    filtri.statoPagamento !== 'all'
  ].filter(Boolean).length

  const esportaCSV = () => {
    if (!data) return

    const headers = [
      'Collaboratore',
      'Codice Fiscale',
      'Partita IVA',
      'Tipo Collaboratore',
      'Tipo Prestazione',
      'Descrizione',
      'Progetto',
      'Data Inizio',
      'Data Fine',
      'Ore Lavorate',
      'Tariffa Oraria',
      'Compenso Fisso',
      'Importo Totale',
      'Stato Pagamento',
      'Data Pagamento',
      'Note'
    ]

    const rows = data.prestazioni.map(p => [
      p.collaboratoreNome,
      p.codiceFiscale,
      p.partitaIva || '',
      p.tipoCollaboratore,
      p.tipoPrestazione,
      p.descrizione,
      p.nomeProgetto || '',
      p.dataInizio ? format(new Date(p.dataInizio), 'dd/MM/yyyy') : '',
      p.dataFine ? format(new Date(p.dataFine), 'dd/MM/yyyy') : '',
      p.oreLavorate || '',
      p.tariffaOraria || '',
      p.compensoFisso || '',
      p.importoTotale,
      p.statoPagamento,
      p.dataPagamento ? format(new Date(p.dataPagamento), 'dd/MM/yyyy') : '',
      p.note || ''
    ])

    const totals = [
      'TOTALE',
      '', '', '', '', '', '', '', '', '', '',
      data.statistiche.totaleImporto,
      '', '', ''
    ]

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      totals.join(',')
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `report-collaboratori-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Report Collaboratori</h2>
        <Button onClick={esportaCSV} disabled={!data || data.prestazioni.length === 0}>
          <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
          Esporta CSV
        </Button>
      </div>

      {/* Filtri */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <div className="border rounded-lg px-4 bg-background">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <button className="flex flex-1 items-center gap-2 py-3 hover:opacity-80 transition-opacity">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtri</span>
                {filtriAttivi > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-primary rounded-full">
                    {filtriAttivi}
                  </span>
                )}
                <ChevronDown className={`h-4 w-4 text-muted-foreground ml-auto transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
            </CollapsibleTrigger>

            {filtriAttivi > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 px-2 text-muted-foreground hover:text-foreground ml-2"
              >
                <X className="h-4 w-4 mr-1" />
                <span className="text-xs">Reset</span>
              </Button>
            )}
          </div>

          <CollapsibleContent>
            <div className="space-y-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInizio">Data Inizio</Label>
                  <Input
                    id="dataInizio"
                    type="date"
                    value={filtri.dataInizio}
                    onChange={(e) => setFiltri({ ...filtri, dataInizio: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataFine">Data Fine</Label>
                  <Input
                    id="dataFine"
                    type="date"
                    value={filtri.dataFine}
                    onChange={(e) => setFiltri({ ...filtri, dataFine: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo Prestazione</Label>
                  <Select value={filtri.tipo} onValueChange={(value) => setFiltri({ ...filtri, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutti" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="ORARIA">Oraria</SelectItem>
                      <SelectItem value="PROGETTO">Progetto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statoPagamento">Stato</Label>
                  <Select value={filtri.statoPagamento} onValueChange={(value) => setFiltri({ ...filtri, statoPagamento: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutti" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="DA_PAGARE">Da Pagare</SelectItem>
                      <SelectItem value="PAGATO">Pagato</SelectItem>
                      <SelectItem value="ANNULLATO">Annullato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quick filters */}
              <div className="flex gap-2 flex-wrap pt-2">
                <Button variant="outline" size="sm" onClick={setMeseCorrente}>
                  Questo mese
                </Button>
                <Button variant="outline" size="sm" onClick={setAnnoCorrente}>
                  Quest'anno
                </Button>
                <Button size="sm" onClick={fetchReport}>
                  Applica Filtri
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Statistiche */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Totale Prestazioni</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.statistiche.totalePrestazioni}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Totale Importo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.statistiche.totaleImporto)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Da Pagare</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(data.statistiche.totaleDaPagare)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Pagato</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(data.statistiche.totalePagato)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabella Prestazioni */}
      {loading ? (
        <div className="text-center py-8">Caricamento...</div>
      ) : data && data.prestazioni.length > 0 ? (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Collaboratore</TableHead>
                <TableHead>CF/P.IVA</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrizione</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead className="text-right">Importo</TableHead>
                <TableHead className="text-center">Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.prestazioni.map((prestazione) => (
                <TableRow key={prestazione.id}>
                  <TableCell>
                    <div className="font-medium">{prestazione.collaboratoreNome}</div>
                    <div className="text-sm text-muted-foreground">{prestazione.tipoCollaboratore}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{prestazione.codiceFiscale}</div>
                    {prestazione.partitaIva && (
                      <div className="text-sm text-muted-foreground">P.IVA: {prestazione.partitaIva}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={prestazione.tipoPrestazione === 'ORARIA' ? 'default' : 'secondary'}>
                      {prestazione.tipoPrestazione}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>{prestazione.descrizione}</div>
                    {prestazione.nomeProgetto && (
                      <div className="text-sm text-muted-foreground">{prestazione.nomeProgetto}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(prestazione.dataInizio), 'dd/MM/yy')}
                      {prestazione.dataFine && ` - ${format(new Date(prestazione.dataFine), 'dd/MM/yy')}`}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(prestazione.importoTotale)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={prestazione.statoPagamento === 'PAGATO' ? 'default' : 'destructive'}>
                      {prestazione.statoPagamento}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-muted/50">
                <TableCell colSpan={5} className="text-right">TOTALE</TableCell>
                <TableCell className="text-right">{formatCurrency(data.statistiche.totaleImporto)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Nessun dato disponibile con i filtri selezionati
        </div>
      )}
    </div>
  )
}
