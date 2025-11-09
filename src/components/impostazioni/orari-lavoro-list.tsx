'use client'

import { OrarioLavoro } from '@/types/impostazioni'
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

interface OrariLavoroListProps {
  orariLavoro: OrarioLavoro[]
  onModifica: (orario: OrarioLavoro) => void
  onElimina: (id: string) => void
}

export function OrariLavoroList({ orariLavoro, onModifica, onElimina }: OrariLavoroListProps) {
  if (orariLavoro.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">
          Nessun orario di lavoro configurato. Inizia creandone uno nuovo.
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
            <TableHead>Orario</TableHead>
            <TableHead>Pausa Pranzo</TableHead>
            <TableHead>Ore Totali</TableHead>
            <TableHead>Stato</TableHead>
            <TableHead className="text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orariLavoro.map((orario) => (
            <TableRow key={orario.id}>
              <TableCell className="font-medium">{orario.nome}</TableCell>
              <TableCell>
                {orario.oraInizio} - {orario.oraFine}
              </TableCell>
              <TableCell>
                {orario.pausaPranzoInizio && orario.pausaPranzoFine
                  ? `${orario.pausaPranzoInizio} - ${orario.pausaPranzoFine}`
                  : '-'}
              </TableCell>
              <TableCell>{orario.oreTotali.toFixed(2)}h</TableCell>
              <TableCell>
                <Badge variant={orario.attivo ? 'default' : 'secondary'}>
                  {orario.attivo ? 'Attivo' : 'Inattivo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onModifica(orario)}
                  >
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
                          Sei sicuro di voler eliminare l&apos;orario &quot;{orario.nome}&quot;?
                          Questa azione non può essere annullata.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onElimina(orario.id)}
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
