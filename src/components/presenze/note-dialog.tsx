'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface NoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentNote: string | null
  presenzaId: string
  dipendenteName: string
  onSave: () => void
}

export function NoteDialog({
  open,
  onOpenChange,
  currentNote,
  presenzaId,
  dipendenteName,
  onSave
}: NoteDialogProps) {
  const [nota, setNota] = useState(currentNote || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset nota quando il dialog si apre
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setNota(currentNote || '')
      setError(null)
    }
    onOpenChange(newOpen)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/presenze/${presenzaId}/nota`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nota: nota.trim() || null })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nel salvataggio della nota')
      }

      onSave()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel salvataggio della nota')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare questa nota?')) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/presenze/${presenzaId}/nota`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nota: null })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nell\'eliminazione della nota')
      }

      onSave()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'eliminazione della nota')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {currentNote ? 'Modifica Nota' : 'Aggiungi Nota'}
          </DialogTitle>
          <DialogDescription>
            Nota per la presenza di {dipendenteName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nota">Nota</Label>
            <Textarea
              id="nota"
              placeholder="Inserisci una nota per questa presenza..."
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={5}
              className="resize-none"
              disabled={isSaving}
            />
            <p className="text-sm text-gray-500">
              {nota.length} caratteri
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {currentNote && currentNote.trim() !== '' ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSaving}
              className="sm:mr-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminazione...
                </>
              ) : (
                'Elimina Nota'
              )}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Annulla
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvataggio...
              </>
            ) : (
              'Salva'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
