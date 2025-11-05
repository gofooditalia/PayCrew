import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface TurniListSkeletonProps {
  /** Numero di righe skeleton da mostrare */
  rows?: number
}

/**
 * Skeleton loading per lista turni
 * Replica il layout delle card turni con dipendente, data, orario, tipo e azioni
 */
export function TurniListSkeleton({ rows = 8 }: TurniListSkeletonProps) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <Card key={i} className="hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              {/* Info turno (sinistra) */}
              <div className="flex items-center gap-4 flex-1">
                {/* Avatar/Iniziali dipendente */}
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />

                {/* Dettagli turno */}
                <div className="space-y-2 flex-1 min-w-0">
                  {/* Nome dipendente */}
                  <Skeleton className="h-5 w-40" />

                  {/* Data e orario */}
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </div>

              {/* Badge e azioni (destra) */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Badge tipo turno */}
                <Skeleton className="h-6 w-20 rounded-full" />

                {/* Pulsanti azione */}
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Skeleton per la vista calendario turni (opzionale)
 */
export function TurniCalendarSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header calendario */}
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>

          {/* Griglia giorni settimana */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>

          {/* Griglia giorni mese */}
          <div className="grid grid-cols-7 gap-2">
            {[...Array(35)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
