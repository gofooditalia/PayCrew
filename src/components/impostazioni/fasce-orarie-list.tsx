'use client'

import { FasciaOraria } from '@/types/impostazioni'
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
import { Edit, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface FasceOrarieListProps {
  fasceOrarie: FasciaOraria[]
  onModifica: (fascia: FasciaOraria) => void
  onElimina: (id: string) => void
}

const tipoTurnoLabels = {
  MATTINA: 'Mattina',
  PRANZO: 'Pranzo',
  SERA: 'Sera',
  NOTTE: 'Notte',
  SPEZZATO: 'Spezzato',
}

const tipoTurnoColors = {
  MATTINA: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  PRANZO: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  SERA: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  NOTTE: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  SPEZZATO: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
}

export function FasceOrarieList({ fasceOrarie, onModifica, onElimina }: FasceOrarieListProps) {
  if (fasceOrarie.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">
          Nessuna fascia oraria configurata. Inizia creandone una nuova.
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[20%] text-center">Nome</TableHead>
            <TableHead className="w-[15%] text-center">Tipo</TableHead>
            <TableHead className="w-[18%] text-center">Orario</TableHead>
            <TableHead className="w-[18%] text-center">Pausa</TableHead>
            <TableHead className="w-[10%] text-center">Magg.</TableHead>
            <TableHead className="w-[10%] text-center">Stato</TableHead>
            <TableHead className="w-[9%] text-center">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fasceOrarie.map((fascia) => (
            <TableRow key={fascia.id}>
              <TableCell className="font-medium py-3 text-center">{fascia.nome}</TableCell>
              <TableCell className="py-3 text-center">
                <Badge className={`${tipoTurnoColors[fascia.tipoTurno]} text-xs px-2 py-0.5`}>
                  {tipoTurnoLabels[fascia.tipoTurno]}
                </Badge>
              </TableCell>
              <TableCell className="py-3 text-sm text-center">
                {fascia.oraInizio} - {fascia.oraFine}
              </TableCell>
              <TableCell className="py-3 text-sm text-center">
                {fascia.pausaPranzoInizio && fascia.pausaPranzoFine ? (
                  <span>
                    {fascia.pausaPranzoInizio} - {fascia.pausaPranzoFine}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="py-3 text-sm text-center">
                {fascia.maggiorazione > 0 ? `+${fascia.maggiorazione}%` : '-'}
              </TableCell>
              <TableCell className="py-3 text-center">
                <Badge variant={fascia.attivo ? 'default' : 'secondary'} className="text-xs px-2 py-0.5">
                  {fascia.attivo ? 'Attiva' : 'Inattiva'}
                </Badge>
              </TableCell>
              <TableCell className="py-3 text-center">
                <div className="flex items-center justify-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onModifica(fascia)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                        <AlertDialogDescription>
                          Sei sicuro di voler eliminare la fascia oraria &quot;{fascia.nome}&quot;?
                          Questa azione non può essere annullata.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onElimina(fascia.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Elimina
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
