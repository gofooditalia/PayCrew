/**
 * Validatori Zod per Turni
 *
 * Definisce gli schemi di validazione per le operazioni sui turni
 */

import { z } from 'zod'
import { tipo_turno } from '@prisma/client'

/**
 * Schema per creazione turno
 */
export const turnoCreateSchema = z.object({
  dipendenteId: z.string().uuid({ message: 'ID dipendente non valido' }),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Data non valida. Formato richiesto: YYYY-MM-DD'
  }),
  oraInizio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Ora di inizio non valida. Formato richiesto: HH:mm'
  }),
  oraFine: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Ora di fine non valida. Formato richiesto: HH:mm'
  }),
  tipoTurno: z.nativeEnum(tipo_turno, {
    message: 'Tipo turno non valido'
  }),
  sedeId: z.string().uuid({ message: 'ID sede non valido' }).optional().or(z.literal('none')),
}).refine(
  (data) => {
    // Validazione: oraFine deve essere dopo oraInizio
    const [oraInizioH, oraInizioM] = data.oraInizio.split(':').map(Number)
    const [oraFineH, oraFineM] = data.oraFine.split(':').map(Number)
    const minutiInizio = oraInizioH * 60 + oraInizioM
    const minutiFine = oraFineH * 60 + oraFineM

    // Gestione turni notturni (che possono andare oltre la mezzanotte)
    if (data.tipoTurno === 'NOTTE') {
      return true // I turni notturni possono avere fine < inizio
    }

    return minutiFine > minutiInizio
  },
  {
    message: 'L\'ora di fine deve essere successiva all\'ora di inizio',
    path: ['oraFine'],
  }
)

/**
 * Schema per aggiornamento turno
 */
export const turnoUpdateSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Data non valida. Formato richiesto: YYYY-MM-DD'
  }).optional(),
  oraInizio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Ora di inizio non valida. Formato richiesto: HH:mm'
  }).optional(),
  oraFine: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Ora di fine non valida. Formato richiesto: HH:mm'
  }).optional(),
  tipoTurno: z.nativeEnum(tipo_turno, {
    message: 'Tipo turno non valido'
  }).optional(),
  sedeId: z.string().uuid({ message: 'ID sede non valido' }).optional().nullable(),
}).refine(
  (data) => {
    // Se entrambe le ore sono fornite, validale
    if (data.oraInizio && data.oraFine) {
      const [oraInizioH, oraInizioM] = data.oraInizio.split(':').map(Number)
      const [oraFineH, oraFineM] = data.oraFine.split(':').map(Number)
      const minutiInizio = oraInizioH * 60 + oraInizioM
      const minutiFine = oraFineH * 60 + oraFineM

      // Per turni notturni, permettiamo fine < inizio
      if (data.tipoTurno === 'NOTTE') {
        return true
      }

      return minutiFine > minutiInizio
    }
    return true
  },
  {
    message: 'L\'ora di fine deve essere successiva all\'ora di inizio',
    path: ['oraFine'],
  }
)

/**
 * Schema per filtri ricerca turni
 */
export const turniFiltriSchema = z.object({
  dipendenteId: z.string().uuid().optional(),
  sedeId: z.string().uuid().optional(),
  tipoTurno: z.nativeEnum(tipo_turno).optional(),
  dataInizio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dataFine: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.number().int().positive().default(1).optional(),
  limit: z.number().int().positive().max(100).default(50).optional(),
}).refine(
  (data) => {
    // Se entrambe le date sono fornite, dataFine deve essere >= dataInizio
    if (data.dataInizio && data.dataFine) {
      return new Date(data.dataFine) >= new Date(data.dataInizio)
    }
    return true
  },
  {
    message: 'La data di fine deve essere successiva o uguale alla data di inizio',
    path: ['dataFine'],
  }
)

/**
 * Schema per creazione turni multipli (pianificazione settimanale)
 */
export const turniMultipliCreateSchema = z.object({
  dipendenteId: z.string().uuid({ message: 'ID dipendente non valido' }),
  dataInizio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Data inizio non valida. Formato richiesto: YYYY-MM-DD'
  }),
  dataFine: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Data fine non valida. Formato richiesto: YYYY-MM-DD'
  }),
  giorni: z.array(z.number().int().min(0).max(6)), // 0=Domenica, 6=Sabato
  oraInizio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  oraFine: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  tipoTurno: z.nativeEnum(tipo_turno),
  sedeId: z.string().uuid().optional().or(z.literal('none')),
}).refine(
  (data) => new Date(data.dataFine) >= new Date(data.dataInizio),
  {
    message: 'La data di fine deve essere successiva o uguale alla data di inizio',
    path: ['dataFine'],
  }
)

/**
 * Tipo TypeScript inferito dallo schema di creazione
 */
export type TurnoCreateInput = z.infer<typeof turnoCreateSchema>

/**
 * Tipo TypeScript inferito dallo schema di aggiornamento
 */
export type TurnoUpdateInput = z.infer<typeof turnoUpdateSchema>

/**
 * Tipo TypeScript inferito dallo schema filtri
 */
export type TurniFiltri = z.infer<typeof turniFiltriSchema>

/**
 * Tipo TypeScript inferito dallo schema turni multipli
 */
export type TurniMultipliCreateInput = z.infer<typeof turniMultipliCreateSchema>
