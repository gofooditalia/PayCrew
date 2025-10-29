/**
 * Tipi TypeScript per Presenze
 *
 * Definisce le interfacce utilizzate nel modulo Presenze
 * per evitare duplicazione e garantire consistenza dei tipi.
 */

import { tipo_turno } from '@prisma/client'

/**
 * Presenza - Rappresenta una registrazione di presenza di un dipendente
 */
export interface Presenza {
  id: string
  data: Date | string
  entrata: Date | string | null
  uscita: Date | string | null
  oreLavorate: number | null
  oreStraordinario: number | null
  nota: string | null
  dipendenteId: string
  createdAt: Date | string
  updatedAt: Date | string
  // Relazioni opzionali
  dipendenti?: {
    id: string
    nome: string
    cognome: string
  }
}

/**
 * Input per creazione presenza
 */
export interface PresenzaCreateInput {
  dipendenteId: string
  data: string // YYYY-MM-DD
  entrata?: string // HH:mm
  uscita?: string // HH:mm
  nota?: string
}

/**
 * Input per aggiornamento presenza
 */
export interface PresenzaUpdateInput {
  data?: string
  entrata?: string | null
  uscita?: string | null
  nota?: string | null
}

/**
 * Filtri per ricerca presenze
 */
export interface PresenzeFilters {
  dipendenteId?: string
  sedeId?: string
  dataInizio?: string // YYYY-MM-DD
  dataFine?: string // YYYY-MM-DD
  page?: number
  limit?: number
}

/**
 * Risposta API lista presenze con paginazione
 */
export interface PresenzeListResponse {
  presenze: Presenza[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

/**
 * Statistiche presenze
 */
export interface PresenzeStats {
  totalePresenze: number
  oreTotali: number
  oreStraordinario: number
  giorniLavorativi: number
  mediaOreGiorno: number
}

/**
 * Dettaglio presenza per calcoli
 */
export interface PresenzaCalcolo {
  entrata: string // HH:mm
  uscita: string // HH:mm
  oreLavorate: number
  oreStraordinario: number
  orePausa?: number
}
