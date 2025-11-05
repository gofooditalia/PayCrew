import { redirect } from 'next/navigation'

/**
 * Redirect da /buste-paga a /cedolini
 *
 * Unificazione nomenclatura:
 * - Backend/API: /api/buste-paga (mantiene naming standard DB)
 * - Frontend: /cedolini (user-friendly)
 *
 * Questa route esiste solo per retrocompatibilità con eventuali link salvati.
 */
export default function BustePagaPage() {
  redirect('/cedolini')
}