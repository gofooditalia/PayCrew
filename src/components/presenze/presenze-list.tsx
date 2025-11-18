'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MessageSquare, Calendar, Edit, Plus, Pencil, UserX } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { NoteDialog } from './note-dialog'
import { PresenzaEditDialog } from './presenza-edit-dialog'
import { toast } from 'sonner'
import { TIPI_TURNO_CONFIG } from '@/types/turni'

interface Presenza {
  id: string
  data: string | Date
  entrata: string | Date | null
  uscita: string | Date | null
  oreLavorate: number | null
  oreStraordinario: number | null
  nota: string | null
  stato?: 'DA_CONFERMARE' | 'CONFERMATA' | 'ASSENTE' | 'MODIFICATA'
  generataDaTurno?: boolean
  dipendenti: {
    nome: string
    cognome: string
  }
  turni?: {
    tipoTurno?: 'MATTINA' | 'PRANZO' | 'SERA' | 'NOTTE' | 'SPEZZATO'
    pausaPranzoInizio?: string | null
    pausaPranzoFine?: string | null
    sedi?: {
      nome: string
    } | null
  } | null
}

interface PresenzeListProps {
  presenze: Presenza[]
  onConfirm?: (id: string) => void
  onMarkAsAbsent?: (id: string) => void
  onReset?: (id: string, currentStatus: string) => void
  onRefresh?: () => void
  isLoading?: boolean
}

export function PresenzeList({ presenze, onConfirm, onMarkAsAbsent, onReset, onRefresh, isLoading }: PresenzeListProps) {
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedPresenza, setSelectedPresenza] = useState<Presenza | null>(null)

  const handleOpenNoteDialog = (presenza: Presenza) => {
    setSelectedPresenza(presenza)
    setNoteDialogOpen(true)
  }

  const handleOpenEditDialog = (presenza: Presenza) => {
    setSelectedPresenza(presenza)
    setEditDialogOpen(true)
  }

  const handleNoteSaved = () => {
    toast.success('Nota salvata con successo')
    if (onRefresh) {
      onRefresh()
    }
  }

  const handlePresenzaSaved = () => {
    if (onRefresh) {
      onRefresh()
    }
  }
  const formatTime = (time: string | Date | null) => {
    if (!time) return '-'
    const date = new Date(time)
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: it })
  }

  const formatPausaPranzo = (pausaInizio?: string | null, pausaFine?: string | null) => {
    if (!pausaInizio || !pausaFine) return '-'
    return `${pausaInizio} - ${pausaFine}`
  }

  // Mostra skeleton durante il caricamento iniziale
  if (isLoading && presenze.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Data</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Dipendente</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Sede</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Orario</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Pausa Pranzo</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Ore</th>
              <th className="h-12 px-4 text-center align-middle font-medium text-gray-700">Note</th>
              <th className="h-12 px-4 text-right align-middle font-medium text-gray-700">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(10)].map((_, i) => (
              <tr key={i} className="border-b">
                <td className="p-4">
                  <Skeleton className="h-5 w-24" />
                </td>
                <td className="p-4">
                  <Skeleton className="h-5 w-32" />
                </td>
                <td className="p-4">
                  <Skeleton className="h-5 w-20" />
                </td>
                <td className="p-4">
                  <Skeleton className="h-5 w-28" />
                </td>
                <td className="p-4">
                  <Skeleton className="h-5 w-24" />
                </td>
                <td className="p-4">
                  <Skeleton className="h-6 w-20" />
                </td>
                <td className="p-4 text-center">
                  <div className="flex justify-center">
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    )
  }

  if (presenze.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="space-y-3">
          <p className="text-gray-700 font-medium text-lg">Nessuna presenza da gestire</p>
          <p className="text-gray-500 text-sm">
            Le presenze vengono generate automaticamente dai turni registrati.
          </p>
          <p className="text-gray-500 text-sm">
            Vai alla sezione <span className="font-semibold text-blue-600">Turni</span> per pianificare i turni del personale.
          </p>
        </div>
        <div className="flex justify-center pt-2">
          <Link href="/turni">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Calendar className="mr-2 h-4 w-4" />
              Vai a Gestione Turni
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Data</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Dipendente</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Sede</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Orario</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Pausa Pranzo</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Ore</th>
              <th className="h-12 px-4 text-center align-middle font-medium text-gray-700">Note</th>
              <th className="h-12 px-4 text-right align-middle font-medium text-gray-700">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {presenze.map((presenza) => (
            <tr key={presenza.id} className="border-b hover:bg-gray-50">
              <td className="p-4">{formatDate(presenza.data)}</td>
              <td className="p-4">
                <span className="font-medium">
                  {presenza.dipendenti.nome} {presenza.dipendenti.cognome}
                </span>
              </td>
              <td className="p-4">
                {presenza.turni?.sedi?.nome ? (
                  <span className="text-sm">{presenza.turni.sedi.nome}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">N/D</span>
                )}
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  {presenza.turni?.tipoTurno && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={`inline-block w-3 h-3 rounded-full ${TIPI_TURNO_CONFIG[presenza.turni.tipoTurno].bgColor} cursor-help`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Turno {TIPI_TURNO_CONFIG[presenza.turni.tipoTurno].label}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <span className="font-mono text-sm">
                    {formatTime(presenza.entrata)} - {formatTime(presenza.uscita)}
                  </span>
                </div>
              </td>
              <td className="p-4">
                <span className="text-sm text-gray-600 font-mono">
                  {formatPausaPranzo(presenza.turni?.pausaPranzoInizio, presenza.turni?.pausaPranzoFine)}
                </span>
              </td>
              <td className="p-4">
                {presenza.oreLavorate !== null ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{Number(presenza.oreLavorate).toFixed(2)}h</Badge>
                    {presenza.oreStraordinario && Number(presenza.oreStraordinario) > 0 && (
                      <Badge className="bg-orange-100 text-orange-800">
                        +{Number(presenza.oreStraordinario).toFixed(2)}h
                      </Badge>
                    )}
                  </div>
                ) : (
                  '-'
                )}
              </td>
              <td className="p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  {presenza.nota && presenza.nota.trim() !== '' ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="center">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm text-gray-900">Nota</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenNoteDialog(presenza)}
                              className="h-7 w-7 p-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                              title="Modifica nota"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{presenza.nota}</p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenNoteDialog(presenza)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                      title="Aggiungi nota"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </td>
              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEditDialog(presenza)}
                    disabled={isLoading}
                    className="text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50"
                    title="Modifica orari e dettagli"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {presenza.stato !== 'ASSENTE' && onMarkAsAbsent && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMarkAsAbsent(presenza.id)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                      title="Segna assente"
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  )}
                  {presenza.stato === 'ASSENTE' && onReset && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onReset(presenza.id, presenza.stato!)}
                      disabled={isLoading}
                      className="text-orange-600 hover:text-orange-700 border-orange-300 hover:bg-orange-50"
                    >
                      Annulla Assenza
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>

    {selectedPresenza && (
      <>
        <NoteDialog
          open={noteDialogOpen}
          onOpenChange={setNoteDialogOpen}
          currentNote={selectedPresenza.nota}
          presenzaId={selectedPresenza.id}
          dipendenteName={`${selectedPresenza.dipendenti.nome} ${selectedPresenza.dipendenti.cognome}`}
          onSave={handleNoteSaved}
        />
        <PresenzaEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          presenza={selectedPresenza}
          onSave={handlePresenzaSaved}
        />
      </>
    )}
  </>
  )
}
