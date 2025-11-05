import { PageLoader } from '@/components/loading'

/**
 * Loading UI globale per il layout dashboard
 * Viene mostrato automaticamente da Next.js durante le transizioni di route
 */
export default function DashboardLoading() {
  return (
    <PageLoader
      message="Caricamento Dashboard..."
      subtitle="Stiamo caricando i tuoi dati, attendere prego."
    />
  )
}