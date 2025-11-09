import { z } from 'zod'

// Schema Collaboratore
export const collaboratoreSchema = z.object({
  nome: z.string().min(2, 'Nome troppo corto').max(100),
  cognome: z.string().min(2, 'Cognome troppo corto').max(100),
  codiceFiscale: z.string()
    .length(16, 'Codice fiscale deve essere di 16 caratteri')
    .toUpperCase(),
  partitaIva: z.string()
    .length(11, 'Partita IVA deve essere di 11 cifre')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
  telefono: z.string().optional(),
  indirizzo: z.string().optional(),
  tipo: z.enum(['PRESTAZIONE_OCCASIONALE', 'PARTITA_IVA', 'CONSULENTE']),
  tariffaOraria: z.number()
    .positive('Tariffa deve essere positiva')
    .optional()
    .nullable(),
  note: z.string().optional(),
  attivo: z.boolean().default(true),
})

export type CollaboratoreInput = z.infer<typeof collaboratoreSchema>

// Schema Prestazione
export const prestazioneSchema = z.object({
  collaboratoreId: z.string().uuid(),
  tipo: z.enum(['ORARIA', 'PROGETTO']),
  descrizione: z.string().min(5, 'Descrizione troppo corta'),
  dataInizio: z.string().or(z.date()),
  dataFine: z.string().or(z.date()).optional().nullable(),

  // Campi condizionali per ORARIA
  oreLavorate: z.number().positive().optional().nullable(),
  tariffaOraria: z.number().positive().optional().nullable(),

  // Campi condizionali per PROGETTO
  nomeProgetto: z.string().optional(),
  compensoFisso: z.number().positive().optional().nullable(),

  importoTotale: z.number().positive(),
  statoPagamento: z.enum(['DA_PAGARE', 'PAGATO', 'ANNULLATO']).default('DA_PAGARE'),
  dataPagamento: z.string().or(z.date()).optional().nullable(),
  note: z.string().optional(),
}).refine(
  (data) => {
    // Se tipo ORARIA, richiedi ore e tariffa
    if (data.tipo === 'ORARIA') {
      return data.oreLavorate && data.tariffaOraria
    }
    // Se tipo PROGETTO, richiedi nome e compenso
    if (data.tipo === 'PROGETTO') {
      return data.nomeProgetto && data.compensoFisso
    }
    return true
  },
  {
    message: 'Campi mancanti per il tipo di prestazione selezionato',
  }
)

export type PrestazioneInput = z.infer<typeof prestazioneSchema>

// Schema per query params (GET)
export const collaboratoriQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  search: z.string().optional(),
  tipo: z.enum(['PRESTAZIONE_OCCASIONALE', 'PARTITA_IVA', 'CONSULENTE']).optional(),
  attivo: z.string().optional().transform(val => {
    if (val === 'true') return true
    if (val === 'false') return false
    return undefined
  }),
})

export const prestazioniQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  collaboratoreId: z.string().uuid().optional(),
  tipo: z.enum(['ORARIA', 'PROGETTO']).optional(),
  statoPagamento: z.enum(['DA_PAGARE', 'PAGATO', 'ANNULLATO']).optional(),
  dataInizio: z.string().optional(),
  dataFine: z.string().optional(),
})

// Helper function per calcolo importo prestazione
export function calcolaImportoPrestazione(
  tipo: 'ORARIA' | 'PROGETTO',
  oreLavorate?: number,
  tariffaOraria?: number,
  compensoFisso?: number
): number {
  if (tipo === 'ORARIA' && oreLavorate && tariffaOraria) {
    return oreLavorate * tariffaOraria
  }
  if (tipo === 'PROGETTO' && compensoFisso) {
    return compensoFisso
  }
  return 0
}
