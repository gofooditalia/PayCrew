/**
 * Loading Components - PayCrew
 *
 * Componenti unificati per stati di loading nell'applicazione.
 *
 * ## Quando Usare Cosa
 *
 * ### PageLoader
 * - Caricamento full-page
 * - Fetch dati iniziali
 * - Dettagli dipendente/azienda
 * - Stati di navigazione
 *
 * ### Skeleton Components
 * - Liste e tabelle
 * - Dashboard cards
 * - Content che ha un layout definito
 *
 * ### InlineLoader
 * - Button loading state
 * - Azioni CRUD inline
 * - Submit form
 *
 * @see {@link ../skeletons} per skeleton components
 */

export { PageLoader, PageLoaderMinimal } from './page-loader'
export { InlineLoader } from './inline-loader'

// Re-export lucide Loader2 per consistenza
export { Loader2 } from 'lucide-react'
