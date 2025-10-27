'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
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
  livello: string
  retribuzione: number
  attivo: boolean
  sede?: {
    id: string
    nome: string
  }
}

interface DipendentiListProps {
  dipendenti: Dipendente[]
}

export default function DipendentiList({ dipendenti }: DipendentiListProps) {
  const [searchTerm, setSearchTerm] = useState('')

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

  return (
    <div className="animate-fade-in w-full">
      {/* Fixed Header Section */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50">
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
                    <TableHead>Dipendente</TableHead>
                    <TableHead>Contatti</TableHead>
                    <TableHead>Tipo Contratto</TableHead>
                    <TableHead>Retribuzione</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
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
                            <div className="text-sm font-semibold text-foreground">
                              {dipendente.nome} {dipendente.cognome}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center">
                              Assunto il {formatDate(dipendente.dataAssunzione)}
                            </div>
                            {dipendente.sede && (
                              <div className="text-xs text-muted-foreground flex items-center">
                                {dipendente.sede.nome}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-foreground font-medium truncate">{dipendente.email}</div>
                        {dipendente.telefono && (
                          <div className="text-xs text-muted-foreground">{dipendente.telefono}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground flex items-center">
                          {dipendente.tipoContratto}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-bold text-foreground bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent flex items-center">
                          {currencyFormatter(dipendente.retribuzione)}
                        </div>
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
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <TrashIcon className="h-4 w-4" />
                          </Button>
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