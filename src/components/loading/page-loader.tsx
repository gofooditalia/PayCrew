import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageLoaderProps {
  /**
   * Messaggio da mostrare sotto lo spinner
   * @default "Caricamento..."
   */
  message?: string
  /**
   * Mostra il messaggio sotto lo spinner
   * @default true
   */
  showMessage?: boolean
  /**
   * Classe CSS aggiuntiva per il container
   */
  className?: string
  /**
   * Size dello spinner
   * @default "default"
   */
  size?: 'sm' | 'default' | 'lg'
}

const sizeClasses = {
  sm: 'h-8 w-8',
  default: 'h-12 w-12',
  lg: 'h-16 w-16'
}

/**
 * PageLoader - Componente unificato per loading full-page
 *
 * Usare per:
 * - Caricamento iniziale dati di una pagina
 * - Fetch di dettagli (dipendente, azienda, etc.)
 * - Stati di navigazione
 *
 * NON usare per:
 * - Liste/tabelle (usare Skeleton components)
 * - Button loading (usare InlineLoader)
 *
 * @example
 * ```tsx
 * if (loading) {
 *   return <PageLoader message="Caricamento dipendente..." />
 * }
 * ```
 */
export function PageLoader({
  message = 'Caricamento...',
  showMessage = true,
  className,
  size = 'default'
}: PageLoaderProps) {
  return (
    <div className={cn(
      "flex items-center justify-center min-h-screen bg-background",
      className
    )}>
      <div className="text-center">
        <Loader2
          className={cn(
            "mx-auto text-primary animate-spin",
            sizeClasses[size]
          )}
        />
        {showMessage && (
          <p className="mt-4 text-muted-foreground">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * PageLoaderMinimal - Versione minimale senza testo
 */
export function PageLoaderMinimal({ size = 'default', className }: Pick<PageLoaderProps, 'size' | 'className'>) {
  return <PageLoader size={size} showMessage={false} className={className} />
}
