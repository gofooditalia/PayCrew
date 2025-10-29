import { z } from 'zod'

// Schema per la validazione delle presenze
export const presenzaSchema = z.object({
  dipendenteId: z.string().uuid('ID dipendente non valido'),
  data: z.string().min(1, 'La data è obbligatoria'),
  entrata: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Orario entrata non valido (formato HH:mm)'),
  uscita: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Orario uscita non valido (formato HH:mm)'),
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
  tipoTurno: z.enum(['MATTINA', 'PRANZO', 'SERA', 'NOTTE', 'SPEZZATO'], {
    errorMap: (issue, ctx) => {
      switch (issue.code) {
        case 'invalid_enum_value':
          return { message: 'Tipo turno non valido. Valori ammessi: MATTINA, PRANZO, SERA, NOTTE, SPEZZATO' }
        default:
          return { message: ctx.defaultError }
      }
    }
  }),
  sedeId: z.string().uuid('ID sede non valido').optional()
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
  dataDa: z.string().optional(),
  dataA: z.string().optional(),
  sedeId: z.string().uuid().optional()
}).refine((data) => {
  // Verifica che la data di fine sia successiva a quella di inizio
  if (data.dataDa && data.dataA) {
    const dataDa = new Date(data.dataDa)
    const dataA = new Date(data.dataA)
    return dataA >= dataDa
  }
  return true
}, {
  message: "La data di fine deve essere successiva o uguale a quella di inizio",
  path: ['dataA']
})

// Schema per il filtro dei turni
export const turniFilterSchema = z.object({
  dipendenteId: z.string().uuid().optional(),
  dataDa: z.string().optional(),
  dataA: z.string().optional(),
  sedeId: z.string().uuid().optional(),
  tipoTurno: z.enum(['MATTINA', 'PRANZO', 'SERA', 'NOTTE', 'SPEZZATO']).optional()
}).refine((data) => {
  // Verifica che la data di fine sia successiva a quella di inizio
  if (data.dataDa && data.dataA) {
    const dataDa = new Date(data.dataDa)
    const dataA = new Date(data.dataA)
    return dataA >= dataDa
  }
  return true
}, {
  message: "La data di fine deve essere successiva o uguale a quella di inizio",
  path: ['dataA']
})

// Schema per la creazione di più presenze (batch)
export const presenzeBatchSchema = z.object({
  presenze: z.array(presenzaSchema).min(1, 'Almeno una presenza è richiesta').max(50, 'Massimo 50 presenze per batch'),
  dataInizio: z.string().optional(),
  dataFine: z.string().optional()
})

// Schema per la creazione di più turni (batch)
export const turniBatchSchema = z.object({
  turni: z.array(turnoSchema).min(1, 'Almeno un turno è richiesto').max(50, 'Massimo 50 turni per batch'),
  dataInizio: z.string().optional(),
  dataFine: z.string().optional()
})

// Funzioni di validazione helper
export const validateOrario = (orario: string): boolean => {
  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  return regex.test(orario)
}

export const validateData = (data: string): boolean => {
  const dataObj = new Date(data)
  return !isNaN(dataObj.getTime())
}

export const validatePeriodo = (dataDa: string, dataA: string): boolean => {
  if (!dataDa || !dataA) return true
  
  const da = new Date(dataDa)
  const a = new Date(dataA)
  
  return a >= da
}

// Tipi TypeScript
export type PresenzaInput = z.infer<typeof presenzaSchema>
export type TurnoInput = z.infer<typeof turnoSchema>
export type PresenzeFilterInput = z.infer<typeof presenzeFilterSchema>
export type TurniFilterInput = z.infer<typeof turniFilterSchema>
export type PresenzeBatchInput = z.infer<typeof presenzeBatchSchema>
export type TurniBatchInput = z.infer<typeof turniBatchSchema>