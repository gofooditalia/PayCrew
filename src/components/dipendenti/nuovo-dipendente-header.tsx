'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface Sede {
  id: string
  nome: string
}

interface NuovoDipendenteHeaderProps {
  sedi: Sede[]
  sedeId: string
  attivo: boolean
  onSedeChange: (sedeId: string) => void
  onAttivoChange: (attivo: boolean) => void
}

export default function NuovoDipendenteHeader({
  sedi,
  sedeId,
  attivo,
  onSedeChange,
  onAttivoChange
}: NuovoDipendenteHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
      {/* Sede di Lavoro */}
      <div className="flex-1">
        <Label htmlFor="header-sedeId" className="text-sm font-medium mb-2 block text-blue-900">
          📍 Sede di Lavoro
        </Label>
        <select
          id="header-sedeId"
          value={sedeId}
          onChange={(e) => onSedeChange(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Seleziona una sede</option>
          {sedi.map((sede) => (
            <option key={sede.id} value={sede.id}>
              {sede.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Toggle Stato Attivo */}
      <div className="flex items-center space-x-3 sm:pt-6">
        <Switch
          id="header-attivo"
          checked={attivo}
          onCheckedChange={onAttivoChange}
        />
        <Label
          htmlFor="header-attivo"
          className="text-sm font-medium cursor-pointer text-blue-900"
        >
          {attivo ? '✓ Dipendente Attivo' : '✗ Dipendente Non Attivo'}
        </Label>
      </div>
    </div>
  )
}
