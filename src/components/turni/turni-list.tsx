'use client'

/**
 * Lista Turni Component
 *
 * Visualizza una lista paginata di turni con filtri e azioni CRUD
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Turno, TIPI_TURNO_CONFIG } from '@/types/turni'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreHorizontal, Pencil, Trash2, Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

interface TurniListProps {
  turni: Turno[]
  onEdit: (turno: Turno) => void
  onDelete: (id: string) => Promise<void>
}

export function TurniList({ turni, onEdit, onDelete }: TurniListProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [turnoToDelete, setTurnoToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (id: string) => {
    setTurnoToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!turnoToDelete) return

    setIsDeleting(true)
    try {
      await onDelete(turnoToDelete)
      setDeleteDialogOpen(false)
      setTurnoToDelete(null)
    } catch (error) {
      console.error('Errore eliminazione turno:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const calcolaOreTurno = (oraInizio: string, oraFine: string): string => {
    const [hInizio, mInizio] = oraInizio.split(':').map(Number)
    const [hFine, mFine] = oraFine.split(':').map(Number)

    let minutiTotali = (hFine * 60 + mFine) - (hInizio * 60 + mInizio)

    // Gestione turni notturni (che attraversano la mezzanotte)
    if (minutiTotali < 0) {
      minutiTotali += 24 * 60
    }

    const ore = Math.floor(minutiTotali / 60)
    const minuti = minutiTotali % 60

    return minuti > 0 ? `${ore}h ${minuti}m` : `${ore}h`
  }

  if (turni.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Nessun turno trovato</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Inizia creando il primo turno per i tuoi dipendenti
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Dipendente</TableHead>
              <TableHead>Tipo Turno</TableHead>
              <TableHead>Orario</TableHead>
              <TableHead>Ore</TableHead>
              <TableHead>Sede</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {turni.map((turno) => {
              const tipoTurnoConfig = TIPI_TURNO_CONFIG[turno.tipoTurno]
              const dataFormatted = typeof turno.data === 'string'
                ? format(parseISO(turno.data), 'EEE dd MMM yyyy', { locale: it })
                : format(turno.data, 'EEE dd MMM yyyy', { locale: it })

              return (
                <TableRow key={turno.id}>
                  <TableCell className="font-medium">
                    {dataFormatted}
                  </TableCell>
                  <TableCell>
                    {turno.dipendenti?.nome} {turno.dipendenti?.cognome}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${tipoTurnoConfig.bgColor} ${tipoTurnoConfig.color} border-0`}
                    >
                      {tipoTurnoConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">
                      {turno.oraInizio} - {turno.oraFine}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {calcolaOreTurno(turno.oraInizio, turno.oraFine)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {turno.sedi ? (
                      <span className="text-sm">{turno.sedi.nome}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/D</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Apri menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(turno)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Modifica
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(turno.id)}
                          className="text-destructive"
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
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. Il turno verrà eliminato permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminazione...' : 'Elimina'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
