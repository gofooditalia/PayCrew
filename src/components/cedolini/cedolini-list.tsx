'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, FileText, Eye } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { Skeleton } from '@/components/ui/skeleton'

interface CedoliniListProps {
  bustePaga: any[]
  isLoading: boolean
  onEdit: (busta: any) => void
  onViewDetail: (busta: any) => void
  onDelete: (id: string) => void
}

export function CedoliniList({
  bustePaga,
  isLoading,
  onEdit,
  onViewDetail,
  onDelete,
}: CedoliniListProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Periodo</TableHead>
              <TableHead>Dipendente</TableHead>
              <TableHead className="text-right">Straord.</TableHead>
              <TableHead className="text-right">Retribuzione</TableHead>
              <TableHead className="text-right">Acconti</TableHead>
              <TableHead className="text-right">Bonus</TableHead>
              <TableHead className="text-right">Netto</TableHead>
              <TableHead className="text-right">Differenza</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(8)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="space-y-2 flex flex-col items-end">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-8 w-8 rounded ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (bustePaga.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Nessun cedolino trovato
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Non ci sono cedolini per i filtri selezionati. Crea un nuovo cedolino per iniziare.
        </p>
      </div>
    )
  }

  const getMeseNome = (mese: number) => {
    const mesi = [
      'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
      'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
    ]
    return mesi[mese - 1] || mese
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Periodo</TableHead>
            <TableHead>Dipendente</TableHead>
            <TableHead className="text-right">Straord.</TableHead>
            <TableHead className="text-right">Retribuzione</TableHead>
            <TableHead className="text-right">Acconti</TableHead>
            <TableHead className="text-right">Bonus</TableHead>
            <TableHead className="text-right">Netto</TableHead>
            <TableHead className="text-right">Differenza</TableHead>
            <TableHead className="text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bustePaga.map((busta) => {
            const differenzaPositiva = (busta.differenza || 0) >= 0

            return (
              <TableRow key={busta.id}>
                {/* Periodo */}
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {getMeseNome(busta.mese)} {busta.anno}
                    </Badge>
                  </div>
                </TableCell>

                {/* Dipendente */}
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {busta.dipendenti.nome} {busta.dipendenti.cognome}
                    </div>
                    <div className="text-xs text-gray-500">
                      {busta.oreLavorate}h totali
                    </div>
                  </div>
                </TableCell>

                {/* Straordinari */}
                <TableCell className="text-right">
                  {busta.oreStraordinario > 0 ? (
                    <div>
                      <div className="font-medium text-orange-600">
                        {busta.oreStraordinario.toFixed(2)}h
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(busta.straordinari)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </TableCell>

                {/* Retribuzione */}
                <TableCell className="text-right font-medium">
                  {formatCurrency(busta.retribuzioneLorda)}
                </TableCell>

                {/* Acconti */}
                <TableCell className="text-right">
                  <div className="text-sm">
                    {formatCurrency(busta.totaleAcconti)}
                  </div>
                  {busta.totaleAcconti > 0 && (
                    <div className="text-xs text-gray-500">
                      {[
                        busta.acconto1,
                        busta.acconto2,
                        busta.acconto3,
                        busta.acconto4,
                      ]
                        .filter((a) => a > 0)
                        .length}{' '}
                      acconti
                    </div>
                  )}
                </TableCell>

                {/* Bonus */}
                <TableCell className="text-right">
                  {busta.bonus > 0 ? (
                    <Badge variant="default" className="bg-green-600">
                      +{formatCurrency(busta.bonus)}
                    </Badge>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </TableCell>

                {/* Netto */}
                <TableCell className="text-right font-semibold">
                  {formatCurrency(busta.netto)}
                </TableCell>

                {/* Differenza */}
                <TableCell className="text-right">
                  <span
                    className={`font-medium ${
                      differenzaPositiva
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {differenzaPositiva ? '+' : ''}
                    {formatCurrency(busta.differenza || 0)}
                  </span>
                </TableCell>

                {/* Azioni */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(busta)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Modifica
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onViewDetail(busta)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Dettaglio
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          // TODO: Implementare generazione PDF
                          console.log('Genera PDF', busta)
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Genera PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(busta.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Elimina
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Footer con totali */}
      {bustePaga.length > 0 && (
        <div className="border-t bg-gray-50 dark:bg-gray-800/50 px-6 py-4">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500 dark:text-gray-400">
                Totale Retribuzioni
              </div>
              <div className="font-semibold text-lg">
                {formatCurrency(
                  bustePaga.reduce(
                    (sum, b) => sum + (b.retribuzioneLorda || 0),
                    0
                  )
                )}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">
                Totale Acconti
              </div>
              <div className="font-semibold text-lg">
                {formatCurrency(
                  bustePaga.reduce((sum, b) => sum + (b.totaleAcconti || 0), 0)
                )}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">
                Totale Netto
              </div>
              <div className="font-semibold text-lg">
                {formatCurrency(
                  bustePaga.reduce((sum, b) => sum + (b.netto || 0), 0)
                )}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">
                Totale Differenze
              </div>
              <div className="font-semibold text-lg">
                {formatCurrency(
                  bustePaga.reduce((sum, b) => sum + (b.differenza || 0), 0)
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
