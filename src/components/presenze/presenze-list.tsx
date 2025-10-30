'use client'

import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2 } from 'lucide-react'

interface Presenza {
  id: string
  data: string | Date
  entrata: string | Date | null
  uscita: string | Date | null
  oreLavorate: number | null
  oreStraordinario: number | null
  nota: string | null
  dipendenti: {
    nome: string
    cognome: string
  }
}

interface PresenzeListProps {
  presenze: Presenza[]
  onEdit: (presenza: Presenza) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

export function PresenzeList({ presenze, onEdit, onDelete, isLoading }: PresenzeListProps) {
  const formatTime = (time: string | Date | null) => {
    if (!time) return '-'
    const date = new Date(time)
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: it })
  }

  if (presenze.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Nessuna presenza registrata</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Dipendente</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Data</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Entrata</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Uscita</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Ore</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Straord.</th>
            <th className="h-12 px-4 text-right align-middle font-medium text-gray-700">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {presenze.map((presenza) => (
            <tr key={presenza.id} className="border-b hover:bg-gray-50">
              <td className="p-4">
                <span className="font-medium">
                  {presenza.dipendenti.nome} {presenza.dipendenti.cognome}
                </span>
              </td>
              <td className="p-4">{formatDate(presenza.data)}</td>
              <td className="p-4">{formatTime(presenza.entrata)}</td>
              <td className="p-4">{formatTime(presenza.uscita)}</td>
              <td className="p-4">
                {presenza.oreLavorate !== null ? (
                  <Badge variant="secondary">{Number(presenza.oreLavorate).toFixed(2)}h</Badge>
                ) : (
                  '-'
                )}
              </td>
              <td className="p-4">
                {presenza.oreStraordinario && Number(presenza.oreStraordinario) > 0 ? (
                  <Badge className="bg-orange-100 text-orange-800">
                    +{Number(presenza.oreStraordinario).toFixed(2)}h
                  </Badge>
                ) : (
                  '-'
                )}
              </td>
              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(presenza)}
                    disabled={isLoading}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(presenza.id)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
