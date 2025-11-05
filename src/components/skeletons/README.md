# Skeleton Components

Componenti skeleton per migliorare la **perceived performance** dell'applicazione PayCrew durante il caricamento dei dati.

## Perché gli Skeleton?

Basato sull'analisi Lighthouse del 2025-11-05:
- **Performance Score**: 93/100
- **Speed Index**: 7.1s (principale bottleneck)
- **LCP Element Render Delay**: 4037ms

Il delay è causato principalmente dal **fetch client-side dei dati da Supabase**, non dal JavaScript bundle. Gli skeleton migliorano la percezione dell'utente rendendo visibile che qualcosa sta caricando, invece di mostrare uno schermo vuoto o un semplice spinner.

## Componenti Disponibili

### 1. Dashboard Skeletons

#### `DashboardSkeleton`
Skeleton completo per l'intera dashboard.

```tsx
import { DashboardSkeleton } from '@/components/skeletons'

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
```

#### `DashboardStatsSkeleton`
Solo per le 4 stats cards.

```tsx
import { DashboardStatsSkeleton } from '@/components/skeletons'

{loading ? <DashboardStatsSkeleton /> : <DashboardStats data={data} />}
```

#### `QuickActionsSkeleton`
Per la sezione azioni rapide.

```tsx
import { QuickActionsSkeleton } from '@/components/skeletons'

<Suspense fallback={<QuickActionsSkeleton />}>
  <QuickActions />
</Suspense>
```

### 2. Table & List Skeletons

#### `TableSkeleton`
Skeleton generico e configurabile per tabelle.

```tsx
import { TableSkeleton } from '@/components/skeletons'

<TableSkeleton
  rows={10}
  columns={5}
  showHeader={true}
  title="Lista Dipendenti"
/>
```

**Props**:
- `rows`: Numero di righe (default: 5)
- `columns`: Numero di colonne (default: 4)
- `showHeader`: Mostra intestazione (default: true)
- `title`: Titolo opzionale della card

#### `DipendentiListSkeleton`
Skeleton ottimizzato per lista dipendenti con avatar.

```tsx
import { DipendentiListSkeleton } from '@/components/skeletons'

{loading ? <DipendentiListSkeleton rows={10} /> : <DipendentiList />}
```

#### `PresenzeListSkeleton`
Skeleton per lista presenze.

```tsx
import { PresenzeListSkeleton } from '@/components/skeletons'

{loading ? <PresenzeListSkeleton rows={8} /> : <PresenzeList />}
```

#### `FormSkeleton`
Skeleton per form di dettaglio.

```tsx
import { FormSkeleton } from '@/components/skeletons'

<Suspense fallback={<FormSkeleton fields={8} />}>
  <DipendenteForm />
</Suspense>
```

### 3. Base Skeleton Component

Il componente base di shadcn/ui per skeleton custom.

```tsx
import { Skeleton } from '@/components/skeletons'

<div className="flex items-center space-x-4">
  <Skeleton className="h-12 w-12 rounded-full" />
  <div className="space-y-2">
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
  </div>
</div>
```

## Pattern di Utilizzo

### Server Components con Suspense

```tsx
import { Suspense } from 'react'
import { DashboardStatsSkeleton } from '@/components/skeletons'

export default function Page() {
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

### Client Components con Loading State

```tsx
'use client'

import { useState, useEffect } from 'react'
import { DipendentiListSkeleton } from '@/components/skeletons'

export function DipendentiList() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])

  useEffect(() => {
    fetchData().then(data => {
      setData(data)
      setLoading(false)
    })
  }, [])

  if (loading) return <DipendentiListSkeleton />

  return <div>{/* render data */}</div>
}
```

### React Query / SWR

```tsx
import { useQuery } from '@tanstack/react-query'
import { TableSkeleton } from '@/components/skeletons'

export function DataTable() {
  const { data, isLoading } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData
  })

  if (isLoading) return <TableSkeleton rows={10} columns={4} />

  return <Table data={data} />
}
```

## Best Practices

1. **Match Layout**: Lo skeleton deve replicare il layout finale per evitare layout shift
2. **Numero Appropriato**: Mostra un numero realistico di righe (non troppo poche, non troppe)
3. **Responsive**: Gli skeleton devono essere responsive come i componenti reali
4. **Performance**: Gli skeleton sono leggeri, non aggiungono bundle size significativo

## Implementazioni Esistenti

### ✅ Già Implementato

- `AttivitaRecenti` component - Usa `Skeleton` di shadcn per loading state (src/components/attivita/attivita-recenti.tsx:116-144)

### 🎯 Dove Implementare Prossimamente

1. **Pagina Dipendenti** (`/dipendenti`)
   - Usa `DipendentiListSkeleton` durante fetch iniziale

2. **Pagina Presenze** (`/presenze`)
   - Usa `PresenzeListSkeleton` per la lista

3. **Form Dipendente** (`/dipendenti/[id]`)
   - Usa `FormSkeleton` durante caricamento dati

4. **Pagina Buste Paga** (`/buste-paga`)
   - Usa `TableSkeleton` per la lista cedolini

## Impatto Performance

### Prima (senza skeleton)
- Schermo bianco per 4+ secondi
- "Stiamo caricando..." visibile come LCP
- **Speed Index**: 7.1s

### Dopo (con skeleton) - Aspettato
- Layout visibile immediatamente
- Skeleton mostra struttura della pagina
- **Speed Index**: Miglioramento stimato ~20-30%
- **Perceived Performance**: Significativamente migliore

Gli skeleton NON riducono il tempo effettivo di caricamento dei dati da Supabase, ma migliorano drasticamente la **percezione dell'utente**.

## Riferimenti

- [shadcn/ui Skeleton](https://ui.shadcn.com/docs/components/skeleton)
- [React Suspense](https://react.dev/reference/react/Suspense)
- [Core Web Vitals - LCP](https://web.dev/articles/lcp)
