# Esempi di Utilizzo Skeleton Components

Esempi pratici di come utilizzare i componenti Skeleton in diverse situazioni.

## ESEMPIO 1: Server Component con Suspense

```tsx
import { Suspense } from 'react'
import { DashboardStatsSkeleton } from '@/components/skeletons'

async function DashboardStats() {
  const stats = await fetchStatsFromDatabase()
  return <StatsCards data={stats} />
}

export function DashboardWithSuspense() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats />
      </Suspense>
    </div>
  )
}
```

## ESEMPIO 2: Client Component con useState

```tsx
'use client'

import { useState, useEffect } from 'react'
import { DipendentiListSkeleton } from '@/components/skeletons'

export function DipendentiListWithLoading() {
  const [loading, setLoading] = useState(true)
  const [dipendenti, setDipendenti] = useState([])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const response = await fetch('/api/dipendenti')
      const data = await response.json()
      setDipendenti(data.dipendenti)
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return <DipendentiListSkeleton rows={10} />
  }

  return <DipendentiList dipendenti={dipendenti} />
}
```

## ESEMPIO 3: React Query / TanStack Query

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { DipendentiListSkeleton } from '@/components/skeletons'

export function DipendentiListWithReactQuery() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dipendenti'],
    queryFn: async () => {
      const res = await fetch('/api/dipendenti')
      return res.json()
    }
  })

  if (isLoading) {
    return <DipendentiListSkeleton rows={10} />
  }

  if (error) {
    return <ErrorMessage error={error} />
  }

  return <DipendentiList dipendenti={data.dipendenti} />
}
```

## ESEMPIO 4: SWR

```tsx
'use client'

import useSWR from 'swr'
import { PresenzeListSkeleton } from '@/components/skeletons'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function PresenzeListWithSWR() {
  const { data, error, isLoading } = useSWR('/api/presenze', fetcher)

  if (isLoading) {
    return <PresenzeListSkeleton rows={8} />
  }

  if (error) {
    return <ErrorMessage error={error} />
  }

  return <PresenzeList presenze={data.presenze} />
}
```

## ESEMPIO 5: Skeleton Generico Configurabile

```tsx
import { TableSkeleton } from '@/components/skeletons'

export function GenericTableWithSkeleton() {
  const [loading, setLoading] = useState(true)

  if (loading) {
    return (
      <TableSkeleton
        rows={12}
        columns={5}
        showHeader={true}
        title="Lista Cedolini"
      />
    )
  }

  return <BustePagaTable />
}
```

## ESEMPIO 6: Form con Skeleton

```tsx
import { Suspense } from 'react'
import { FormSkeleton } from '@/components/skeletons'

export function DipendenteFormPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Modifica Dipendente</h1>
      <Suspense fallback={<FormSkeleton fields={8} />}>
        <DipendenteForm id={params.id} />
      </Suspense>
    </div>
  )
}
```

## ESEMPIO 7: Skeleton Custom

```tsx
'use client'

import { Skeleton } from '@/components/skeletons'

export function CustomCardSkeleton() {
  return (
    <div className="border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>

      {/* Body */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Footer */}
      <div className="flex justify-end space-x-2 mt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}
```

## ESEMPIO 8: Multiple Skeletons in Parallel

```tsx
import { Suspense } from 'react'
import { DashboardStatsSkeleton, TableSkeleton } from '@/components/skeletons'

export function DashboardCompleteWithSkeletons() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* Grafici */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<TableSkeleton rows={5} columns={2} />}>
          <PresenzeChart />
        </Suspense>
        <Suspense fallback={<TableSkeleton rows={5} columns={2} />}>
          <TopDipendentiChart />
        </Suspense>
      </div>
    </div>
  )
}
```

## ESEMPIO 9: Conditional Skeleton

```tsx
'use client'

type DataState = 'idle' | 'loading' | 'success' | 'error'

export function SmartDataTable() {
  const [state, setState] = useState<DataState>('idle')
  const [data, setData] = useState([])

  switch (state) {
    case 'loading':
      return <TableSkeleton rows={10} columns={4} />

    case 'error':
      return <ErrorMessage />

    case 'success':
      return data.length > 0 ? (
        <DataTable data={data} />
      ) : (
        <EmptyState />
      )

    default:
      return <TableSkeleton rows={10} columns={4} />
  }
}
```

## ESEMPIO 10: Progressive Loading

```tsx
'use client'

/**
 * Carica prima i dati essenziali, poi quelli secondari
 */
export function ProgressiveLoadingDashboard() {
  const [essentialData, setEssentialData] = useState(null)
  const [secondaryData, setSecondaryData] = useState(null)

  useEffect(() => {
    fetchEssentialData().then(setEssentialData)
    fetchSecondaryData().then(setSecondaryData)
  }, [])

  return (
    <div className="space-y-6">
      {essentialData ? (
        <DashboardStats data={essentialData} />
      ) : (
        <DashboardStatsSkeleton />
      )}

      {secondaryData ? (
        <AttivitaList data={secondaryData} />
      ) : (
        <TableSkeleton rows={5} columns={3} />
      )}
    </div>
  )
}
```

## ESEMPIO 11: Smooth Transition

```tsx
'use client'

export function SmoothTransitionTable() {
  const [loading, setLoading] = useState(true)

  return (
    <div className="relative">
      {/* Skeleton con fade-out */}
      <div className={`transition-opacity duration-300 ${
        loading ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'
      }`}>
        <TableSkeleton rows={10} columns={4} />
      </div>

      {/* Dati reali con fade-in */}
      <div className={`transition-opacity duration-300 ${
        loading ? 'opacity-0' : 'opacity-100'
      }`}>
        {!loading && <DataTable data={data} />}
      </div>
    </div>
  )
}
```

## Best Practices

1. **Match Layout** - Lo skeleton deve replicare esattamente il layout finale
2. **Numero Appropriato** - 5-10 items è solitamente ottimale
3. **Performance** - Gli skeleton sono leggeri, usa pure Suspense multiple
4. **Responsive** - Testa su mobile, tablet, desktop
5. **Transizioni** - Opzionale: fade-in/out per transizione smooth
6. **Error Handling** - Non mostrare skeleton per errori
7. **Empty States** - Non skeleton per liste vuote
