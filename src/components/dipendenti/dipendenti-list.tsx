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
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            📊 Elenco Dipendenti ({dipendenti.length})
          </CardTitle>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-input rounded-lg leading-5 bg-background/50 backdrop-blur-sm placeholder-muted-foreground focus:outline-none focus:placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary focus:bg-background sm:text-sm transition-all duration-200 hover:border-primary/50"
              placeholder="Cerca dipendenti..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Cerca dipendenti"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredDipendenti.length === 0 ? (
          <div className="text-center py-12 animate-slide-up">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-muted-foreground text-lg">
              {searchTerm ? 'Nessun dipendente trovato per questa ricerca.' : 'Nessun dipendente registrato.'}
            </p>
            <Link href="/dipendenti/nuovo" className="mt-6 inline-block">
              <Button className="button-scale">
                <PlusIcon className="h-5 w-5 mr-2" />
                Aggiungi il primo dipendente
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border/50">
              <thead className="bg-gradient-to-r from-muted/50 to-muted/30">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    👤 Dipendente
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    📧 Contatti
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    📋 Contratto
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    💰 Retribuzione
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    🏢 Sede
                  </th>
                  <th scope="col" className="relative px-6 py-4">
                    <span className="sr-only">Azioni</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card/50 backdrop-blur-sm divide-y divide-border/30">
                {filteredDipendenti.map((dipendente, index) => (
                  <tr
                    key={dipendente.id}
                    className="table-row-hover hover:bg-gradient-to-r hover:from-primary-light/20 hover:to-accent/20 transition-all duration-200 animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full avatar-gradient shadow-md">
                          <span className="text-white font-bold text-lg">
                            {dipendente.nome.charAt(0)}{dipendente.cognome.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-foreground">
                            {dipendente.nome} {dipendente.cognome}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            📅 Assunto il {formatDate(dipendente.dataAssunzione)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground font-medium">📧 {dipendente.email}</div>
                      {dipendente.telefono && (
                        <div className="text-sm text-muted-foreground">📞 {dipendente.telefono}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground font-medium">{dipendente.tipoContratto}</div>
                      <div className="text-sm text-muted-foreground">Livello {dipendente.livello}</div>
                      <Badge variant="attivo" className="mt-1">
                        Attivo
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-foreground bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                        {currencyFormatter(dipendente.retribuzione)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      <div className="flex items-center">
                        📍 {dipendente.sede?.nome || 'Non assegnato'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/dipendenti/${dipendente.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-info hover:bg-info/10 button-scale"
                            aria-label={`Visualizza ${dipendente.nome} ${dipendente.cognome}`}
                          >
                            <EyeIcon className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </Link>
                        <Link href={`/dipendenti/${dipendente.id}/modifica`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-warning hover:bg-warning/10 button-scale"
                            aria-label={`Modifica ${dipendente.nome} ${dipendente.cognome}`}
                          >
                            <PencilIcon className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 button-scale"
                          aria-label={`Elimina ${dipendente.nome} ${dipendente.cognome}`}
                        >
                          <TrashIcon className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}