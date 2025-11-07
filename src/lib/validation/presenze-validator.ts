import { z } from 'zod'

/**
 * Schema di validazione per Presenze e Turni
 * Compatibile con Zod v4
 */

// Schema per la validazione delle presenze
export const presenzaSchema = z.object({
  dipendenteId: z.string().uuid('ID dipendente non valido'),
  data: z.string().min(1, 'La data è obbligatoria'),
  entrata: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Orario entrata non valido (formato HH:mm)').optional(),
  uscita: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Orario uscita non valido (formato HH:mm)').optional(),
  nota: z.string().max(500, 'La nota non può superare i 500 caratteri').optional()
}).refine((data) => {
  // Verifica che l'orario di uscita sia successivo a quello di entrata
  if (data.entrata && data.uscita) {
    const [entraOre, entraMinuti] = data.entrata.split(':').map(Number)
    const [esciOre, esciMinuti] = data.uscita.split(':').map(Number)

    const entraMinutiTotali = entraOre * 60 + entraMinuti
    let esciMinutiTotali = esciOre * 60 + esciMinuti

    // Gestione turni notturni (es. 22:00 - 06:00)
    if (esciMinutiTotali < entraMinutiTotali) {
      esciMinutiTotali += 24 * 60 // Aggiungi 24 ore
    }

    return esciMinutiTotali > entraMinutiTotali
  }
  return true
}, {
  message: "L'orario di uscita deve essere successivo a quello di entrata",
  path: ['uscita']
})

// Schema per la validazione dei turni
export const turnoSchema = z.object({
  dipendenteId: z.string().uuid('ID dipendente non valido'),
  data: z.string().min(1, 'La data è obbligatoria'),
  oraInizio: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Orario inizio non valido (formato HH:mm)'),
  oraFine: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Orario fine non valido (formato HH:mm)'),
  tipoTurno: z.enum(['MATTINA', 'PRANZO', 'SERA', 'NOTTE', 'SPEZZATO']),
  sedeId: z.string().uuid('ID sede non valido').optional().nullable()
}).refine((data) => {
  // Verifica che l'orario di fine sia successivo a quello di inizio
  if (data.oraInizio && data.oraFine) {
    const [inizioOre, inizioMinuti] = data.oraInizio.split(':').map(Number)
    const [fineOre, fineMinuti] = data.oraFine.split(':').map(Number)

    const inizioMinutiTotali = inizioOre * 60 + inizioMinuti
    let fineMinutiTotali = fineOre * 60 + fineMinuti

    // Gestione turni notturni (es. 22:00 - 06:00)
    if (fineMinutiTotali < inizioMinutiTotali) {
      fineMinutiTotali += 24 * 60 // Aggiungi 24 ore
    }

    return fineMinutiTotali > inizioMinutiTotali
  }
  return true
}, {
  message: "L'orario di fine deve essere successivo a quello di inizio",
  path: ['oraFine']
})

// Schema per il filtro delle presenze
export const presenzeFilterSchema = z.object({
  dipendenteId: z.string().uuid().optional(),
  sedeId: z.string().uuid().optional(),
  stato: z.enum(['DA_CONFERMARE', 'CONFERMATA', 'ASSENTE', 'MODIFICATA']).optional(),
  dataInizio: z.string().optional(),
  dataFine: z.string().optional(),
  page: z.number().int().positive().default(1).optional(),
  limit: z.number().int().positive().max(100).default(10).optional()
}).refine((data) => {
  // Verifica che la data di fine sia successiva a quella di inizio
  if (data.dataInizio && data.dataFine) {
    const dataInizio = new Date(data.dataInizio)
    const dataFine = new Date(data.dataFine)
    return dataFine >= dataInizio
  }
  return true
}, {
  message: "La data di fine deve essere successiva o uguale alla data di inizio",
  path: ['dataFine']
})

// Schema per il filtro dei turni
export const turniFilterSchema = z.object({
  dipendenteId: z.string().uuid().optional(),
  sedeId: z.string().uuid().optional(),
  tipoTurno: z.enum(['MATTINA', 'PRANZO', 'SERA', 'NOTTE', 'SPEZZATO']).optional(),
  dataInizio: z.string().optional(),
  dataFine: z.string().optional(),
  page: z.number().int().positive().default(1).optional(),
  limit: z.number().int().positive().max(100).default(10).optional()
}).refine((data) => {
  // Verifica che la data di fine sia successiva a quella di inizio
  if (data.dataInizio && data.dataFine) {
    const dataInizio = new Date(data.dataInizio)
    const dataFine = new Date(data.dataFine)
    return dataFine >= dataInizio
  }
  return true
}, {
  message: "La data di fine deve essere successiva o uguale alla data di inizio",
  path: ['dataFine']
})

// Schema per creazione batch presenze
export const presenzeBatchSchema = z.object({
  presenze: z.array(presenzaSchema).min(1, 'Almeno una presenza richiesta').max(50, 'Massimo 50 presenze per batch')
})

// Schema per creazione batch turni
export const turniBatchSchema = z.object({
  turni: z.array(turnoSchema).min(1, 'Almeno un turno richiesto').max(50, 'Massimo 50 turni per batch')
})

// Schema per aggiornamento presenza (campi opzionali)
export const presenzaUpdateSchema = presenzaSchema.partial().refine((data) => {
  // Se entrambi gli orari sono forniti, verifica che l'orario di uscita sia successivo a quello di entrata
  if (data.entrata && data.uscita) {
    const [entraOre, entraMinuti] = data.entrata.split(':').map(Number)
    const [esciOre, esciMinuti] = data.uscita.split(':').map(Number)

    const entraMinutiTotali = entraOre * 60 + entraMinuti
    let esciMinutiTotali = esciOre * 60 + esciMinuti

    if (esciMinutiTotali < entraMinutiTotali) {
      esciMinutiTotali += 24 * 60
    }

    return esciMinutiTotali > entraMinutiTotali
  }
  return true
}, {
  message: "L'orario di uscita deve essere successivo a quello di entrata",
  path: ['uscita']
})

// Schema per aggiornamento turno (campi opzionali)
export const turnoUpdateSchema = turnoSchema.partial().refine((data) => {
  // Se entrambi gli orari sono forniti, verifica che l'orario di fine sia successivo a quello di inizio
  if (data.oraInizio && data.oraFine) {
    const [inizioOre, inizioMinuti] = data.oraInizio.split(':').map(Number)
    const [fineOre, fineMinuti] = data.oraFine.split(':').map(Number)

    const inizioMinutiTotali = inizioOre * 60 + inizioMinuti
    let fineMinutiTotali = fineOre * 60 + fineMinuti

    if (fineMinutiTotali < inizioMinutiTotali) {
      fineMinutiTotali += 24 * 60
    }

    return fineMinutiTotali > inizioMinutiTotali
  }
  return true
}, {
  message: "L'orario di fine deve essere successivo a quello di inizio",
  path: ['oraFine']
})

// Tipi TypeScript inferiti dagli schemi
export type PresenzaInput = z.infer<typeof presenzaSchema>
export type PresenzaUpdateInput = z.infer<typeof presenzaUpdateSchema>
export type TurnoInput = z.infer<typeof turnoSchema>
export type TurnoUpdateInput = z.infer<typeof turnoUpdateSchema>
export type PresenzeFilter = z.infer<typeof presenzeFilterSchema>
export type TurniFilter = z.infer<typeof turniFilterSchema>
