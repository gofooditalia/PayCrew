/**
 * EXAMPLES.tsx
 *
 * Esempi pratici di utilizzo dei componenti Skeleton
 * Questo file serve come reference per gli sviluppatori
 */

import { Suspense } from 'react'
import {
  DashboardSkeleton,
  DashboardStatsSkeleton,
  TableSkeleton,
  DipendentiListSkeleton,
  PresenzeListSkeleton,
  FormSkeleton,
  Skeleton
} from '@/components/skeletons'

// ============================================================================
// ESEMPIO 1: Server Component con Suspense
// ============================================================================

async function DashboardStats() {
  // Simulazione fetch dati da database
  const stats = await fetchStatsFromDatabase()
  return <StatsCards data={stats} />
}

export function DashboardWithSuspense() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Le stats mostreranno lo skeleton durante il fetch */}
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* Altri componenti... */}
    </div>
  )
}

// ============================================================================
// ESEMPIO 2: Client Component con useState
// ============================================================================

'use client'

import { useState, useEffect } from 'react'

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

  // Mostra skeleton durante il caricamento
  if (loading) {
    return <DipendentiListSkeleton rows={10} />
  }

  // Mostra lista quando i dati sono pronti
  return <DipendentiList dipendenti={dipendenti} />
}

// ============================================================================
// ESEMPIO 3: React Query / TanStack Query
// ============================================================================

'use client'

import { useQuery } from '@tanstack/react-query'

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

// ============================================================================
// ESEMPIO 4: SWR
// ============================================================================

'use client'

import useSWR from 'swr'

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

// ============================================================================
// ESEMPIO 5: Skeleton Generico Configurabile
// ============================================================================

export function GenericTableWithSkeleton() {
  const [loading, setLoading] = useState(true)

  if (loading) {
    return (
      <TableSkeleton
        rows={12}           // 12 righe
        columns={5}         // 5 colonne
        showHeader={true}   // Mostra header
        title="Lista Cedolini"
      />
    )
  }

  return <BustePagaTable />
}

// ============================================================================
// ESEMPIO 6: Form con Skeleton
// ============================================================================

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

// ============================================================================
// ESEMPIO 7: Skeleton Custom con componente base
// ============================================================================

'use client'

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

// ============================================================================
// ESEMPIO 8: Multiple Skeletons in Parallel
// ============================================================================

export function DashboardCompleteWithSkeletons() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Benvenuto nel gestionale</p>
      </div>

      {/* Stats Cards con skeleton */}
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* Layout a due colonne */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions (statico, no skeleton necessario) */}
        <QuickActions />

        {/* Attività Recenti con skeleton integrato */}
        <AttivitaRecenti limit={5} />
      </div>

      {/* Grafici con skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<TableSkeleton rows={5} columns={2} title="Presenze Settimanali" />}>
          <PresenzeWeeklyChart />
        </Suspense>

        <Suspense fallback={<TableSkeleton rows={5} columns={2} title="Top Dipendenti" />}>
          <TopDipendentiChart />
        </Suspense>
      </div>
    </div>
  )
}

// ============================================================================
// ESEMPIO 9: Conditional Skeleton Based on Data State
// ============================================================================

'use client'

type DataState = 'idle' | 'loading' | 'success' | 'error'

export function SmartDataTable() {
  const [state, setState] = useState<DataState>('idle')
  const [data, setData] = useState([])

  // Rendering basato sullo stato
  switch (state) {
    case 'loading':
      return <TableSkeleton rows={10} columns={4} />

    case 'error':
      return (
        <div className="text-center py-8">
          <p className="text-red-600">Errore nel caricamento</p>
          <button onClick={() => setState('loading')}>Riprova</button>
        </div>
      )

    case 'success':
      return data.length > 0 ? (
        <DataTable data={data} />
      ) : (
        <EmptyState message="Nessun dato disponibile" />
      )

    case 'idle':
    default:
      return <TableSkeleton rows={10} columns={4} />
  }
}

// ============================================================================
// ESEMPIO 10: Progressive Loading con Skeleton
// ============================================================================

'use client'

/**
 * Carica prima i dati essenziali, poi quelli secondari
 * Mostra skeleton per i dati non ancora caricati
 */
export function ProgressiveLoadingDashboard() {
  const [essentialData, setEssentialData] = useState(null)
  const [secondaryData, setSecondaryData] = useState(null)

  useEffect(() => {
    // Carica prima i dati essenziali (stats)
    fetchEssentialData().then(setEssentialData)

    // Poi carica i dati secondari (attività recenti)
    fetchSecondaryData().then(setSecondaryData)
  }, [])

  return (
    <div className="space-y-6">
      {/* Stats - Caricano per prime */}
      {essentialData ? (
        <DashboardStats data={essentialData} />
      ) : (
        <DashboardStatsSkeleton />
      )}

      {/* Attività - Caricano dopo */}
      {secondaryData ? (
        <AttivitaRecentiList data={secondaryData} />
      ) : (
        <TableSkeleton rows={5} columns={3} title="Attività Recenti" />
      )}
    </div>
  )
}

// ============================================================================
// ESEMPIO 11: Skeleton con Transizione Smooth
// ============================================================================

'use client'

export function SmoothTransitionTable() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])

  return (
    <div className="relative">
      {/* Skeleton con fade-out */}
      <div
        className={`transition-opacity duration-300 ${
          loading ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'
        }`}
      >
        <TableSkeleton rows={10} columns={4} />
      </div>

      {/* Dati reali con fade-in */}
      <div
        className={`transition-opacity duration-300 ${
          loading ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {!loading && <DataTable data={data} />}
      </div>
    </div>
  )
}

// ============================================================================
// Note sull'utilizzo
// ============================================================================

/**
 * BEST PRACTICES:
 *
 * 1. Match Layout
 *    - Lo skeleton deve replicare esattamente il layout finale
 *    - Stessi spacing, sizing, e struttura
 *
 * 2. Numero Appropriato
 *    - Non troppo pochi (sembra vuoto)
 *    - Non troppi (confusione)
 *    - 5-10 items è solitamente ottimale
 *
 * 3. Performance
 *    - Gli skeleton sono leggeri, usa pure Suspense multiple
 *    - Non preoccuparti del "over-skeletoning"
 *
 * 4. Responsive
 *    - Gli skeleton devono essere responsive come i componenti reali
 *    - Testa su mobile, tablet, desktop
 *
 * 5. Transizioni
 *    - Opzionale: aggiungi fade-in/out per transizione smooth
 *    - Non necessario, ma migliora ulteriormente la UX
 *
 * 6. Error Handling
 *    - Non mostrare skeleton per errori
 *    - Mostra un messaggio di errore chiaro invece
 *
 * 7. Empty States
 *    - Quando non ci sono dati, mostra empty state
 *    - Non skeleton per liste vuote
 */
