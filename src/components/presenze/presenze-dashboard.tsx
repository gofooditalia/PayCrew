'use client'

import { useState, useMemo } from 'react'
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  calcolaOreSettimanali, 
  calcolaOreMensili,
  formattaOreDecimaliInHHmm 
} from '@/lib/utils/ore-calculator'

interface Dipendente {
  id: string
  nome: string
  cognome: string
  oreSettimanali: number
  attivo: boolean
}

interface Presenza {
  id: string
  data: Date
  entrata?: Date
  uscita?: Date
  oreLavorate?: number
  oreStraordinario?: number
  nota?: string
  dipendenteId: string
}

interface Turno {
  id: string
  data: Date
  oraInizio: string
  oraFine: string
  tipoTurno: string
  dipendenteId: string
}

interface PresenzeDashboardProps {
  presenze: Presenza[]
  turni: Turno[]
  dipendenti: Dipendente[]
  periodo?: 'settimana' | 'mese' | 'anno'
  onPeriodoChange?: (periodo: 'settimana' | 'mese' | 'anno') => void
  onRefresh?: () => void
}

export default function PresenzeDashboard({ 
  presenze, 
  turni, 
  dipendenti,
  periodo = 'settimana',
  onPeriodoChange,
  onRefresh
}: PresenzeDashboardProps) {
  const [dataRiferimento, setDataRiferimento] = useState(new Date())

  // Filtra dipendenti attivi
  const dipendentiAttivi = dipendenti.filter(d => d.attivo !== false)

  // Calcola statistiche base
  const statsBase = useMemo(() => {
    const presenzeConOre = presenze.filter(p => p.oreLavorate && p.oreLavorate > 0)
    const totaleOre = presenzeConOre.reduce((sum, p) => sum + (p.oreLavorate || 0), 0)
    const totaleStraordinari = presenzeConOre.reduce((sum, p) => sum + (p.oreStraordinario || 0), 0)
    const giorniLavorati = new Set(presenzeConOre.map(p => p.data.toDateString())).size

    return {
      totalePresenze: presenze.length,
      presenzeConOre: presenzeConOre.length,
      totaleOre,
      totaleStraordinari,
      oreNormali: totaleOre - totaleStraordinari,
      giorniLavorati,
      mediaOreGiornaliere: giorniLavorati > 0 ? totaleOre / giorniLavorati : 0
    }
  }, [presenze])

  // Calcola statistiche per periodo
  const statsPeriodo = useMemo(() => {
    const now = new Date()
    let inizioPeriodo: Date
    let finePeriodo: Date

    switch (periodo) {
      case 'settimana':
        const giornoSettimana = now.getDay()
        inizioPeriodo = new Date(now)
        inizioPeriodo.setDate(now.getDate() - giornoSettimana)
        inizioPeriodo.setHours(0, 0, 0, 0)
        
        finePeriodo = new Date(inizioPeriodo)
        finePeriodo.setDate(inizioPeriodo.getDate() + 6)
        finePeriodo.setHours(23, 59, 59, 999)
        break

      case 'mese':
        inizioPeriodo = new Date(now.getFullYear(), now.getMonth(), 1)
        finePeriodo = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break

      case 'anno':
        inizioPeriodo = new Date(now.getFullYear(), 0, 1)
        finePeriodo = new Date(now.getFullYear() + 1, 0, 1)
        break

      default:
        inizioPeriodo = new Date(now)
        finePeriodo = new Date(now)
    }

    const presenzePeriodo = presenze.filter(p => 
      p.data >= inizioPeriodo && p.data <= finePeriodo
    )

    const turniPeriodo = turni.filter(t => 
      t.data >= inizioPeriodo && t.data <= finePeriodo
    )

    return {
      inizioPeriodo,
      finePeriodo,
      presenzePeriodo,
      turniPeriodo,
      ...calcolaOreSettimanali(presenzePeriodo.map(p => ({
        data: p.data,
        entrata: p.entrata?.toISOString() || undefined,
        uscita: p.uscita?.toISOString() || undefined,
        oreLavorate: p.oreLavorate,
        oreStraordinario: p.oreStraordinario,
        dipendenteId: p.dipendenteId,
        nota: p.nota
      }))),
      giorniPeriodo: Math.ceil((finePeriodo.getTime() - inizioPeriodo.getTime()) / (1000 * 60 * 60 * 24))
    }
  }, [presenze, turni, periodo])

  // Top dipendenti per ore lavorate
  const topDipendenti = useMemo(() => {
    const orePerDipendente = presenze.reduce((acc, presenza) => {
      const dipendente = dipendenti.find(d => d.id === presenza.dipendenteId)
      if (!dipendente) return acc

      if (!acc[presenza.dipendenteId]) {
        acc[presenza.dipendenteId] = {
          dipendente,
          ore: 0,
          straordinari: 0,
          giorni: 0
        }
      }

      acc[presenza.dipendenteId].ore += presenza.oreLavorate || 0
      acc[presenza.dipendenteId].straordinari += presenza.oreStraordinario || 0
      acc[presenza.dipendenteId].giorni += 1

      return acc
    }, {} as Record<string, {
      dipendente: Dipendente
      ore: number
      straordinari: number
      giorni: number
    }>)

    return Object.values(orePerDipendente)
      .sort((a, b) => b.ore - a.ore)
      .slice(0, 5)
  }, [presenze, dipendenti])

  // Statistiche contrattuali
  const statsContrattuali = useMemo((): {
    dipendentiAttivi: number
    totaleOreContrattuali: number
    mediaOreContrattuali: number
    rispettoContratto: number
  } => {
    const totaleOreContrattuali = dipendentiAttivi.reduce((sum, d) => sum + d.oreSettimanali, 0)
    const mediaOreContrattuali = dipendentiAttivi.length > 0 ? totaleOreContrattuali / dipendentiAttivi.length : 0

    return {
      dipendentiAttivi: dipendentiAttivi.length,
      totaleOreContrattuali,
      mediaOreContrattuali,
      rispettoContratto: statsPeriodo.oreTotali > 0 ? (statsPeriodo.oreTotali / statsContrattuali.totaleOreContrattuali) * 100 : 0
    }
  }, [dipendentiAttivi, statsPeriodo.oreTotali])

  // Indicatori performance
  const indicatoriPerformance = useMemo((): {
    tassoPresenza: number
    efficienzaStraordinari: number
    indiceAssenze: number
  } => {
    const presenzaEffettiva = statsPeriodo.oreTotali
    const presenzaAttesa = statsContrattuali.totaleOreContrattuali * (periodo === 'settimana' ? 1 : periodo === 'mese' ? 4.33 : 52)
    
    return {
      tassoPresenza: presenzaAttesa > 0 ? (presenzaEffettiva / presenzaAttesa) * 100 : 0,
      efficienzaStraordinari: statsPeriodo.oreStraordinario > 0 ?
        (statsPeriodo.oreNormali / statsPeriodo.oreTotali) * 100 : 100,
      indiceAssenze: statsPeriodo.giorniPeriodo > 0 ? 
        ((statsPeriodo.giorniPeriodo - statsPeriodo.giorniLavorati) / statsPeriodo.giorniPeriodo) * 100 : 0
    }
  }, [statsPeriodo, statsContrattuali])

  return (
    <div className="animate-fade-in w-full space-y-6">
      {/* Header con controlli */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-primary" />
              Dashboard Presenze
            </CardTitle>
            
            <div className="flex items-center gap-4">
              {/* Selettore periodo */}
              <div className="flex items-center gap-2">
                <Label className="text-sm">Periodo:</Label>
                <div className="flex gap-1">
                  {(['settimana', 'mese', 'anno'] as const).map((p) => (
                    <Button
                      key={p}
                      variant={periodo === p ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onPeriodoChange?.(p)}
                    >
                      {p === 'settimana' ? 'Settimana' : p === 'mese' ? 'Mese' : 'Anno'}
                    </Button>
                  ))}
                </div>
              </div>

              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  Aggiorna
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KPI Principali */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ore Totali */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Ore Totali</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formattaOreDecimaliInHHmm(statsPeriodo.oreTotali)}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {statsPeriodo.giorniLavorati} giorni lavorati
                </p>
              </div>
              <ClockIcon className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        {/* Straordinari */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Straordinari</p>
                <p className="text-2xl font-bold text-orange-900">
                  {formattaOreDecimaliInHHmm(statsPeriodo.oreStraordinario)}
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  {statsPeriodo.oreStraordinario > 0 ?
                    `${((statsPeriodo.oreStraordinario / statsPeriodo.oreTotali) * 100).toFixed(1)}% del totale`
                    : 'Nessuno'
                  }
                </p>
              </div>
              <ArrowTrendingUpIcon className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        {/* Tasso Presenza */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Tasso Presenza</p>
                <p className="text-2xl font-bold text-green-900">
                  {indicatoriPerformance.tassoPresenza.toFixed(1)}%
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {indicatoriPerformance.tassoPresenza >= 95 ? 'Eccellente' : 
                   indicatoriPerformance.tassoPresenza >= 90 ? 'Buono' : 'Da migliorare'}
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        {/* Indice Assenze */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Indice Assenze</p>
                <p className="text-2xl font-bold text-red-900">
                  {indicatoriPerformance.indiceAssenze.toFixed(1)}%
                </p>
                <p className="text-xs text-red-700 mt-1">
                  {indicatoriPerformance.indiceAssenze <= 5 ? 'Ottimo' : 
                   indicatoriPerformance.indiceAssenze <= 10 ? 'Buono' : 'Elevato'}
                </p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiche Dettagliate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Riepilogo Periodo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarIcon className="h-4 w-4" />
              Riepilogo {periodo === 'settimana' ? 'Settimanale' : periodo === 'mese' ? 'Mensile' : 'Annuale'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Periodo:</span>
                <span className="text-sm font-medium">
                  {statsPeriodo.inizioPeriodo.toLocaleDateString('it-IT')} - {statsPeriodo.finePeriodo.toLocaleDateString('it-IT')}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Presenze registrate:</span>
                <Badge variant="secondary">
                  {statsPeriodo.presenzePeriodo.length}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Turni pianificati:</span>
                <Badge variant="outline">
                  {statsPeriodo.turniPeriodo.length}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Media giornaliera:</span>
                <span className="text-sm font-medium">
                  {formattaOreDecimaliInHHmm(statsPeriodo.mediaGiornaliera)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiche Contrattuali */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserGroupIcon className="h-4 w-4" />
              Statistiche Contrattuali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Dipendenti attivi:</span>
                <Badge variant="secondary">
                  {statsContrattuali.dipendentiAttivi}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ore contrattuali totali:</span>
                <span className="text-sm font-medium">
                  {formattaOreDecimaliInHHmm(statsContrattuali.totaleOreContrattuali)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Media ore per dipendente:</span>
                <span className="text-sm font-medium">
                  {formattaOreDecimaliInHHmm(statsContrattuali.mediaOreContrattuali)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Rispetto contratto:</span>
                <Badge className={
                  statsContrattuali.rispettoContratto >= 95 ? 'bg-green-100 text-green-800' :
                  statsContrattuali.rispettoContratto >= 80 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }>
                  {statsContrattuali.rispettoContratto.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Dipendenti */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowTrendingUpIcon className="h-4 w-4" />
            Top Dipendenti per Ore Lavorate
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topDipendenti.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Nessun dato disponibile per il periodo selezionato
            </div>
          ) : (
            <div className="space-y-3">
              {topDipendenti.map((item, index) => (
                <div key={item.dipendente.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-primary/10">
                      <span className="text-primary font-bold text-sm">
                        {item.dipendente.nome.charAt(0)}{item.dipendente.cognome.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {item.dipendente.nome} {item.dipendente.cognome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.giorni} giorni • {formattaOreDecimaliInHHmm(item.ore / item.giorni)} media/giorno
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {formattaOreDecimaliInHHmm(item.ore)}
                    </p>
                    {item.straordinari > 0 && (
                      <p className="text-xs text-orange-600">
                        +{formattaOreDecimaliInHHmm(item.straordinari)} straord.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}