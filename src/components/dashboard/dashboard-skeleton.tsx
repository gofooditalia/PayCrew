import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton loading state per le stats cards della dashboard
 * Mostra 4 card con skeleton per numero, titolo e descrizione
 */
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Skeleton loading state per la sezione Azioni Rapide
 */
export function QuickActionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-3 border border-border rounded-lg">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton loading state completo per l'intera dashboard
 * Include header, stats, e sezioni principali
 */
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-4 sm:space-y-0">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
      </div>

      {/* Stats Cards */}
      <DashboardStatsSkeleton />

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <QuickActionsSkeleton />

        {/* Attività Recenti placeholder */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start space-x-4">
                  <Skeleton className="h-4 w-4 rounded mt-1" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-5 w-full" />
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
