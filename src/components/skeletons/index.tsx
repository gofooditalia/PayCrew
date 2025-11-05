/**
 * Skeleton Components - PayCrew
 *
 * Componenti skeleton per migliorare la percezione delle performance
 * durante il caricamento dei dati. Utilizzano il componente Skeleton di shadcn/ui.
 *
 * Benefici:
 * - Miglior perceived performance
 * - Riduzione sensazione di lentezza
 * - Layout stabile (no layout shift)
 * - UX professionale
 */

// Dashboard Skeletons
export {
  DashboardSkeleton,
  DashboardStatsSkeleton,
  QuickActionsSkeleton
} from '../dashboard/dashboard-skeleton'

// Table & List Skeletons
export {
  TableSkeleton,
  DipendentiListSkeleton,
  PresenzeListSkeleton,
  FormSkeleton
} from '../shared/table-skeleton'

// Base Skeleton from shadcn/ui
export { Skeleton } from '../ui/skeleton'
