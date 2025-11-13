'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  PencilIcon,
  EyeIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from '@/lib/utils/currency'

interface Dipendente {
  id: string
  nome: string
  cognome: string
  email: string
  telefono?: string
  dataAssunzione: Date
  tipoContratto: string
  retribuzione?: number | null
  retribuzioneNetta?: number | null
  limiteContanti?: number | null
  limiteBonifico?: number | null
  coefficienteMaggiorazione?: number | null
  oreSettimanali: number
  attivo: boolean
  sede?: {
    id: string
    nome: string
  }
}

interface DipendentiListProps {
  dipendenti: Dipendente[]
  statoFiltro: string
}

export default function DipendentiList({ dipendenti, statoFiltro }: DipendentiListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  const filteredDipendenti = dipendenti.filter(dipendente =>
    `${dipendente.nome} ${dipendente.cognome} ${dipendente.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Use useMemo to prevent re-creation on every render
  const currencyFormatter = useMemo(() => {
    return (amount: number) => {
      return formatCurrency(amount)
    }
  }, [])

  const formatDate = useMemo(() => {
    return (date: Date) => {
      // Format date in a consistent way
      return new Date(date).toLocaleDateString('it-IT')
    }
  }, [])

  const handleStatoChange = (newStato: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newStato === 'attivi') {
      params.delete('stato')
    } else {
      params.set('stato', newStato)
    }
    router.push(`/dipendenti${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <div className="animate-fade-in w-full">
      {/* Header Section - Non sticky */}
      <div className="bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Elenco Dipendenti ({dipendenti.length})
            </h1>
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1 sm:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-9 pr-3 py-1.5 border border-input rounded-lg leading-5 bg-background/50 backdrop-blur-sm placeholder-muted-foreground focus:outline-none focus:placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary focus:bg-background sm:text-sm transition-all duration-200 hover:border-primary/50"
                  placeholder="Cerca dipendenti..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Cerca dipendenti"
                />
              </div>
              <Link href="/dipendenti/nuovo">
                <Button className="flex items-center gap-1 button-scale shadow-lg hover:shadow-xl p-2" size="sm" title="Nuovo Dipendente">
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Filtro Stato */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mostra:</span>
            <div className="flex gap-2">
              <Button
                variant={statoFiltro === 'attivi' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatoChange('attivi')}
                className="text-xs"
              >
                Solo Attivi
              </Button>
              <Button
                variant={statoFiltro === 'non_attivi' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatoChange('non_attivi')}
                className="text-xs"
              >
                Solo Non Attivi
              </Button>
              <Button
                variant={statoFiltro === 'tutti' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatoChange('tutti')}
                className="text-xs"
              >
                Tutti
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="px-4 pb-4">
        {filteredDipendenti.length === 0 ? (
          <div className="text-center py-8 animate-slide-up">
            <p className="text-muted-foreground">
              {searchTerm ? 'Nessun dipendente trovato per questa ricerca.' : 'Nessun dipendente registrato.'}
            </p>
            <Link href="/dipendenti/nuovo" className="mt-4 inline-block">
              <Button className="button-scale">
                <PlusIcon className="h-4 w-4 mr-2" />
                Aggiungi il primo dipendente
              </Button>
            </Link>
          </div>
        ) : (
          <Card className="mt-4">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%] sm:w-auto">Dipendente</TableHead>
                    <TableHead className="hidden sm:table-cell">Contatti</TableHead>
                    <TableHead className="hidden sm:table-cell">Contratto</TableHead>
                    <TableHead className="hidden sm:table-cell">Retribuzione Netta</TableHead>
                    <TableHead className="text-right w-[20%] sm:w-auto">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDipendenti.map((dipendente, index) => (
                    <TableRow key={dipendente.id} className="animate-slide-up border-2 border-primary/30 my-2 rounded-lg bg-gradient-to-r from-card to-background/50 shadow-sm hover:shadow-md transition-all duration-200" style={{ animationDelay: `${index * 50}ms` }}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-primary/10 shadow-md">
                            <span className="text-primary font-bold text-sm">
                              {dipendente.nome.charAt(0)}{dipendente.cognome.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                              {dipendente.nome} {dipendente.cognome}
                              {!dipendente.attivo && (
                                <Badge variant="destructive" className="text-xs">Non Attivo</Badge>
                              )}
                            </div>
                            {dipendente.sede && (
                              <div className="text-xs text-muted-foreground flex items-center">
                                {dipendente.sede.nome}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="text-xs text-foreground font-medium truncate">{dipendente.email}</div>
                        {dipendente.telefono && (
                          <div className="text-xs text-muted-foreground">{dipendente.telefono}</div>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="text-xs font-medium text-foreground">
                          {dipendente.tipoContratto}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Assunto il {formatDate(dipendente.dataAssunzione)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {dipendente.oreSettimanali} ore
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {dipendente.retribuzioneNetta ? (
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              Netta: <span className="font-semibold text-foreground">{currencyFormatter(dipendente.retribuzioneNetta)}</span>
                            </div>
                            {dipendente.limiteBonifico && (
                              <div className="text-xs text-muted-foreground">
                                Bonifico: <span className="font-medium text-foreground">{currencyFormatter(dipendente.limiteBonifico)}</span>
                              </div>
                            )}
                            {dipendente.limiteContanti && (
                              <div className="text-xs font-bold text-primary">
                                Cash: {currencyFormatter(dipendente.limiteContanti)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground italic">Non configurato</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dipendenti/${dipendente.id}`}>
                            <Button variant="ghost" size="sm">
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/dipendenti/${dipendente.id}/modifica`}>
                            <Button variant="ghost" size="sm">
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}