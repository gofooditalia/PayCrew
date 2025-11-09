'use client'

import { Festivita } from '@/types/impostazioni'
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
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface FestivitaListProps {
  festivita: Festivita[]
  onModifica: (fest: Festivita) => void
  onElimina: (id: string) => void
}

export function FestivitaList({ festivita, onModifica, onElimina }: FestivitaListProps) {
  if (festivita.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">
          Nessuna festività configurata. Inizia creandone una nuova.
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Ricorrente</TableHead>
            <TableHead>Maggiorazione</TableHead>
            <TableHead className="text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {festivita.map((fest) => (
            <TableRow key={fest.id}>
              <TableCell className="font-medium">{fest.nome}</TableCell>
              <TableCell>
                {format(new Date(fest.data), 'dd MMMM yyyy', { locale: it })}
              </TableCell>
              <TableCell>
                <Badge variant={fest.ricorrente ? 'default' : 'secondary'}>
                  {fest.ricorrente ? 'Annuale' : 'Una tantum'}
                </Badge>
              </TableCell>
              <TableCell>
                {fest.maggiorazione > 0 ? `+${fest.maggiorazione}%` : '-'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onModifica(fest)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                        <AlertDialogDescription>
                          Sei sicuro di voler eliminare la festività &quot;{fest.nome}&quot;?
                          Questa azione non può essere annullata.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onElimina(fest.id)}
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
