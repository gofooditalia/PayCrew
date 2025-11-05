import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InlineLoaderProps {
  /**
   * Size dello spinner
   * @default "default"
   */
  size?: 'sm' | 'default' | 'lg'
  /**
   * Classe CSS aggiuntiva
   */
  className?: string
}

const sizeClasses = {
  sm: 'h-3 w-3',
  default: 'h-4 w-4',
  lg: 'h-5 w-5'
}

/**
 * InlineLoader - Spinner per azioni inline e button
 *
 * Usare per:
 * - Loading state nei button
 * - Azioni CRUD in corso
 * - Submit form
 *
 * @example
 * ```tsx
 * <Button disabled={loading}>
 *   {loading && <InlineLoader className="mr-2" />}
 *   Salva
 * </Button>
 * ```
 */
export function InlineLoader({ size = 'default', className }: InlineLoaderProps) {
  return (
    <Loader2
      className={cn(
        "animate-spin",
        sizeClasses[size],
        className
      )}
    />
  )
}
