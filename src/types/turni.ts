/**
 * Tipi TypeScript per Turni
 *
 * Definisce le interfacce utilizzate nel modulo Turni
 * per evitare duplicazione e garantire consistenza dei tipi.
 */

import { tipo_turno } from '@prisma/client'

/**
 * Turno - Rappresenta un turno pianificato per un dipendente
 */
export interface Turno {
  id: string
  data: Date | string
  oraInizio: string // HH:mm format
  oraFine: string // HH:mm format
  tipoTurno: tipo_turno
  dipendenteId: string
  sedeId: string | null
  createdAt: Date | string
  // Relazioni opzionali
  dipendenti?: {
    id: string
    nome: string
    cognome: string
  }
  sedi?: {
    id: string
    nome: string
  } | null
}

/**
 * Input per creazione turno
 */
export interface TurnoCreateInput {
  dipendenteId: string
  data: string // YYYY-MM-DD
  oraInizio: string // HH:mm
  oraFine: string // HH:mm
  tipoTurno: tipo_turno
  sedeId?: string
}

/**
 * Input per aggiornamento turno
 */
export interface TurnoUpdateInput {
  data?: string
  oraInizio?: string
  oraFine?: string
  tipoTurno?: tipo_turno
  sedeId?: string | null
}

/**
 * Filtri per ricerca turni
 */
export interface TurniFilters {
  dipendenteId?: string
  sedeId?: string
  tipoTurno?: tipo_turno
  dataInizio?: string // YYYY-MM-DD
  dataFine?: string // YYYY-MM-DD
  page?: number
  limit?: number
}

/**
 * Risposta API lista turni con paginazione
 */
export interface TurniListResponse {
  turni: Turno[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

/**
 * Configurazione tipo turno per UI
 */
export interface TipoTurnoConfig {
  value: tipo_turno
  label: string
  color: string
  bgColor: string
  icon: string
}

/**
 * Tipi turno con configurazione UI
 */
export const TIPI_TURNO_CONFIG: Record<tipo_turno, TipoTurnoConfig> = {
  MATTINA: {
    value: 'MATTINA',
    label: 'Mattina',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    icon: 'sunrise'
  },
  PRANZO: {
    value: 'PRANZO',
    label: 'Pranzo',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: 'sun'
  },
  SERA: {
    value: 'SERA',
    label: 'Sera',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: 'sunset'
  },
  NOTTE: {
    value: 'NOTTE',
    label: 'Notte',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    icon: 'moon'
  },
  SPEZZATO: {
    value: 'SPEZZATO',
    label: 'Spezzato',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: 'clock'
  }
}

/**
 * Statistiche turni
 */
export interface TurniStats {
  totaleTurni: number
  turniPerTipo: Record<tipo_turno, number>
  oreTotali: number
  mediaOreTurno: number
}

/**
 * Conflitto turno (sovrapposizione)
 */
export interface TurnoConflict {
  turnoId: string
  dipendenteId: string
  data: string
  oraInizio: string
  oraFine: string
  message: string
}
