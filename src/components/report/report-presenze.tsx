'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { ReportFiltri } from './report-filtri'
import type { ReportPresenzeMensile } from '@/types/report'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'

export function ReportPresenze() {
  const [report, setReport] = useState<ReportPresenzeMensile | null>(null)
  const [loading, setLoading] = useState(false)
  const [filtri, setFiltri] = useState({
    mese: new Date().getMonth() + 1,
    anno: new Date().getFullYear(),
    sedeId: '',
  })

  useEffect(() => {
    caricaReport()
  }, [filtri])

  const caricaReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        mese: filtri.mese.toString(),
        anno: filtri.anno.toString(),
        ...(filtri.sedeId && { sedeId: filtri.sedeId }),
      })

      const response = await fetch(`/api/report/presenze?${params}`)
      if (!response.ok) throw new Error('Errore nel caricamento del report')

      const data = await response.json()
      setReport(data)
    } catch (error) {
      console.error('Errore:', error)
    } finally {
      setLoading(false)
    }
  }

  const esportaCSV = () => {
    if (!report) return

    const headers = [
      'Cognome',
      'Nome',
      'Sede',
      'Ore Contrattualizzate',
      'Ore Lavorate',
      'Ore Straordinario',
      'Giorni Lavorati',
      'Assenze',
      'Percentuale Presenza',
    ]

    const rows = report.dipendenti.map((d) => [
      d.cognome,
      d.nome,
      d.sede?.nome || '-',
      d.oreContrattualizzate.toFixed(2),
      d.oreLavorate.toFixed(2),
      d.oreStraordinario.toFixed(2),
      d.giorniLavorati,
      d.assenze,
      d.percentualePresenza.toFixed(2) + '%',
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
      '',
      'RIEPILOGO',
      `Totale Dipendenti,${report.riepilogo.totaleDipendenti}`,
      `Totale Ore Lavorate,${report.riepilogo.totaleOreLavorate.toFixed(2)}`,
      `Totale Ore Straordinario,${report.riepilogo.totaleOreStraordinario.toFixed(2)}`,
      `Totale Giorni Lavorati,${report.riepilogo.totaleGiorniLavorati}`,
      `Totale Assenze,${report.riepilogo.totaleAssenze}`,
      `Media Ore per Dipendente,${report.riepilogo.mediaOrePerDipendente.toFixed(2)}`,
      `Media Percentuale Presenza,${report.riepilogo.mediaPercentualePresenza.toFixed(2)}%`,
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `report_presenze_${filtri.mese}_${filtri.anno}.csv`
    link.click()
  }

  const mesi = [
    'Gennaio',
    'Febbraio',
    'Marzo',
    'Aprile',
    'Maggio',
    'Giugno',
    'Luglio',
    'Agosto',
    'Settembre',
    'Ottobre',
    'Novembre',
    'Dicembre',
  ]

  return (
    <div className="space-y-6">
      <ReportFiltri
        filtri={filtri}
        onFiltriChange={setFiltri}
        showDipendenteFilter={false}
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : report ? (
        <>
          {/* Statistiche Principali */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Totale Dipendenti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.riepilogo.totaleDipendenti}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ore Lavorate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.riepilogo.totaleOreLavorate.toFixed(0)} h
                </div>
                <p className="text-xs text-muted-foreground">
                  +{report.riepilogo.totaleOreStraordinario.toFixed(0)} h
                  straordinario
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Media Presenza
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.riepilogo.mediaPercentualePresenza.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Totale Assenze
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.riepilogo.totaleAssenze} giorni
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabella Dettagliata */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  Report Presenze - {mesi[filtri.mese - 1]} {filtri.anno}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Dettaglio presenze per dipendente
                </p>
              </div>
              <Button onClick={esportaCSV} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Esporta CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dipendente</TableHead>
                      <TableHead>Sede</TableHead>
                      <TableHead className="text-right">
                        Ore Contratt.
                      </TableHead>
                      <TableHead className="text-right">Ore Lavorate</TableHead>
                      <TableHead className="text-right">Straord.</TableHead>
                      <TableHead className="text-right">
                        Giorni Lavorati
                      </TableHead>
                      <TableHead className="text-right">Assenze</TableHead>
                      <TableHead className="text-right">
                        % Presenza
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.dipendenti.map((dip) => (
                      <TableRow key={dip.dipendenteId}>
                        <TableCell className="font-medium">
                          {dip.cognome} {dip.nome}
                        </TableCell>
                        <TableCell>{dip.sede?.nome || '-'}</TableCell>
                        <TableCell className="text-right">
                          {dip.oreContrattualizzate.toFixed(1)} h
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {dip.oreLavorate.toFixed(1)} h
                        </TableCell>
                        <TableCell className="text-right">
                          {dip.oreStraordinario.toFixed(1)} h
                        </TableCell>
                        <TableCell className="text-right">
                          {dip.giorniLavorati}
                        </TableCell>
                        <TableCell className="text-right">
                          {dip.assenze}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            dip.percentualePresenza >= 90
                              ? 'text-green-600'
                              : dip.percentualePresenza >= 70
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {dip.percentualePresenza.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2} className="font-bold">
                        TOTALI / MEDIE
                      </TableCell>
                      <TableCell className="text-right font-bold">-</TableCell>
                      <TableCell className="text-right font-bold">
                        {report.riepilogo.totaleOreLavorate.toFixed(1)} h
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {report.riepilogo.totaleOreStraordinario.toFixed(1)} h
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {report.riepilogo.totaleGiorniLavorati}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {report.riepilogo.totaleAssenze}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {report.riepilogo.mediaPercentualePresenza.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Nessun dato disponibile per il periodo selezionato
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
