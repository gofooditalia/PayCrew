'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { ReportFiltri } from './report-filtri'
import { ReportSkeleton } from './report-skeleton'
import { formatCurrency } from '@/lib/utils/currency'
import type { ReportCedoliniMensile } from '@/types/report'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'

export function ReportCedolini() {
  const [report, setReport] = useState<ReportCedoliniMensile | null>(null)
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

      const response = await fetch(`/api/report/cedolini?${params}`)
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
      'Retribuzione Lorda',
      'Straordinari',
      'Bonus',
      'Totale Lordo',
      'INPS',
      'IRPEF',
      'Totale Ritenute',
      'Netto',
      'TFR',
      'Acconto 1',
      'Acconto 2',
      'Acconto 3',
      'Acconto 4',
      'Totale Acconti',
      'Importo Bonifico',
      'Differenza',
      'Ore Lavorate',
      'Ore Straordinario',
    ]

    const rows = report.dipendenti.map((d) => [
      d.cognome,
      d.nome,
      d.sede?.nome || '-',
      d.retribuzioneLorda.toFixed(2),
      d.straordinari.toFixed(2),
      d.bonus.toFixed(2),
      d.totaleLordo.toFixed(2),
      d.contributiINPS.toFixed(2),
      d.irpef.toFixed(2),
      d.totaleRitenute.toFixed(2),
      d.netto.toFixed(2),
      d.tfr.toFixed(2),
      d.acconto1.toFixed(2),
      d.acconto2.toFixed(2),
      d.acconto3.toFixed(2),
      d.acconto4.toFixed(2),
      d.totaleAcconti.toFixed(2),
      d.importoBonifico.toFixed(2),
      d.differenza.toFixed(2),
      d.oreLavorate.toFixed(2),
      d.oreStraordinario.toFixed(2),
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
      '',
      'TOTALI',
      '',
      '',
      report.totali.totaleRetribuzioneLorda.toFixed(2),
      report.totali.totaleStraordinari.toFixed(2),
      report.totali.totaleBonus.toFixed(2),
      report.totali.totaleLordo.toFixed(2),
      report.totali.totaleContributiINPS.toFixed(2),
      report.totali.totaleIrpef.toFixed(2),
      report.totali.totaleRitenute.toFixed(2),
      report.totali.totaleNetto.toFixed(2),
      report.totali.totaleTfr.toFixed(2),
      '',
      '',
      '',
      '',
      report.totali.totaleAcconti.toFixed(2),
      report.totali.totaleImportoBonifico.toFixed(2),
      report.totali.totaleDifferenza.toFixed(2),
      report.totali.totaleOreLavorate.toFixed(2),
      report.totali.totaleOreStraordinario.toFixed(2),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `report_cedolini_${filtri.mese}_${filtri.anno}.csv`
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
        <ReportSkeleton rows={8} columns={11} />
      ) : report ? (
        <>
          {/* Statistiche Principali */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Totale Dipendenti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.totali.totaleDipendenti}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Totale Lordo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(report.totali.totaleLordo)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Totale Netto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(report.totali.totaleNetto)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Totale TFR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(report.totali.totaleTfr)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Totale Acconti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(report.totali.totaleAcconti)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabella Dettagliata */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  Report Cedolini - {mesi[filtri.mese - 1]} {filtri.anno}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Dettaglio compensi per dipendente
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
                      <TableHead className="text-right">Retrib. Lorda</TableHead>
                      <TableHead className="text-right">Straord.</TableHead>
                      <TableHead className="text-right">Bonus</TableHead>
                      <TableHead className="text-right">Tot. Lordo</TableHead>
                      <TableHead className="text-right">Ritenute</TableHead>
                      <TableHead className="text-right">Netto</TableHead>
                      <TableHead className="text-right">TFR</TableHead>
                      <TableHead className="text-right">Acconti</TableHead>
                      <TableHead className="text-right">Bonifico</TableHead>
                      <TableHead className="text-right">Differenza</TableHead>
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
                          {formatCurrency(dip.retribuzioneLorda)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(dip.straordinari)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(dip.bonus)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(dip.totaleLordo)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(dip.totaleRitenute)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(dip.netto)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(dip.tfr)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(dip.totaleAcconti)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(dip.importoBonifico)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            dip.differenza >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(dip.differenza)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2} className="font-bold">
                        TOTALI
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(report.totali.totaleRetribuzioneLorda)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(report.totali.totaleStraordinari)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(report.totali.totaleBonus)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(report.totali.totaleLordo)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(report.totali.totaleRitenute)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(report.totali.totaleNetto)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-muted-foreground">
                        {formatCurrency(report.totali.totaleTfr)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(report.totali.totaleAcconti)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(report.totali.totaleImportoBonifico)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-bold ${
                          report.totali.totaleDifferenza >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(report.totali.totaleDifferenza)}
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
