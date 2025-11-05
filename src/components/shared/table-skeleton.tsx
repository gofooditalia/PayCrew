import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface TableSkeletonProps {
  /** Numero di righe da mostrare nello skeleton */
  rows?: number
  /** Numero di colonne da mostrare */
  columns?: number
  /** Mostra header della tabella */
  showHeader?: boolean
  /** Titolo della card container (opzionale) */
  title?: string
}

/**
 * Skeleton loading state generico per tabelle
 * Utilizzabile per liste di dipendenti, presenze, buste paga, ecc.
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  title
}: TableSkeletonProps) {
  return (
    <Card>
      {title && (
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-4">
          {/* Header della tabella */}
          {showHeader && (
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {[...Array(columns)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          )}

          {/* Righe della tabella */}
          <div className="space-y-3">
            {[...Array(rows)].map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="grid gap-4 items-center py-2"
                style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
              >
                {[...Array(columns)].map((_, colIndex) => (
                  <Skeleton
                    key={colIndex}
                    className="h-6 w-full"
                    style={{
                      width: colIndex === 0 ? '80%' : '100%' // Prima colonna più stretta
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton specifico per lista dipendenti
 * Include avatar, nome, ruolo e azioni
 */
export function DipendentiListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                {/* Avatar */}
                <Skeleton className="h-10 w-10 rounded-full" />

                {/* Info dipendente */}
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>

              {/* Badges e azioni */}
              <div className="flex items-center space-x-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Skeleton specifico per lista presenze
 * Include data, dipendente, ore lavorate
 */
export function PresenzeListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <div className="flex justify-end space-x-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton per form di dettaglio
 * Include campi form e pulsanti
 */
export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {[...Array(fields)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}

          {/* Pulsanti azione */}
          <div className="flex justify-end space-x-2 pt-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
