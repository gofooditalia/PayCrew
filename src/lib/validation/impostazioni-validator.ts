import { z } from 'zod'

// Regex per validare il formato HH:mm (24h)
const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

// Helper per convertire stringa HH:mm in minuti
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Helper per calcolare ore totali tra due orari
export function calcolaOreTotali(
  oraInizio: string,
  oraFine: string,
  pausaInizio?: string,
  pausaFine?: string
): number {
  const inizioMin = timeToMinutes(oraInizio)
  const fineMin = timeToMinutes(oraFine)

  let totaleMin = fineMin - inizioMin

  // Se c'è pausa pranzo, sottrai i minuti
  if (pausaInizio && pausaFine) {
    const pausaInizioMin = timeToMinutes(pausaInizio)
    const pausaFineMin = timeToMinutes(pausaFine)
    const pausaMin = pausaFineMin - pausaInizioMin
    totaleMin -= pausaMin
  }

  // Converti in ore con 2 decimali
  return Math.round((totaleMin / 60) * 100) / 100
}

// Schema per Orari di Lavoro
export const orarioLavoroSchema = z.object({
  nome: z.string().min(1, 'Il nome è obbligatorio').max(100),
  oraInizio: z.string().regex(timeFormatRegex, 'Formato orario non valido (HH:mm)'),
  oraFine: z.string().regex(timeFormatRegex, 'Formato orario non valido (HH:mm)'),
  pausaPranzoInizio: z.string().regex(timeFormatRegex, 'Formato orario non valido (HH:mm)').optional().nullable(),
  pausaPranzoFine: z.string().regex(timeFormatRegex, 'Formato orario non valido (HH:mm)').optional().nullable(),
  attivo: z.boolean(),
}).refine(
  (data) => {
    // Verifica che oraFine sia dopo oraInizio
    return timeToMinutes(data.oraFine) > timeToMinutes(data.oraInizio)
  },
  {
    message: "L'orario di fine deve essere successivo all'orario di inizio",
    path: ['oraFine'],
  }
).refine(
  (data) => {
    // Se c'è pausa pranzo, verifica che siano entrambi i campi
    if (data.pausaPranzoInizio || data.pausaPranzoFine) {
      return data.pausaPranzoInizio && data.pausaPranzoFine
    }
    return true
  },
  {
    message: 'Specificare sia inizio che fine della pausa pranzo',
    path: ['pausaPranzoFine'],
  }
).refine(
  (data) => {
    // Se c'è pausa pranzo, verifica che sia nell'intervallo di lavoro
    if (data.pausaPranzoInizio && data.pausaPranzoFine) {
      const pausaInizioMin = timeToMinutes(data.pausaPranzoInizio)
      const pausaFineMin = timeToMinutes(data.pausaPranzoFine)
      const inizioMin = timeToMinutes(data.oraInizio)
      const fineMin = timeToMinutes(data.oraFine)

      return (
        pausaFineMin > pausaInizioMin &&
        pausaInizioMin >= inizioMin &&
        pausaFineMin <= fineMin
      )
    }
    return true
  },
  {
    message: 'La pausa pranzo deve essere compresa nell\'orario di lavoro',
    path: ['pausaPranzoFine'],
  }
)

export type OrarioLavoroInput = z.infer<typeof orarioLavoroSchema>

// Schema per Fasce Orarie
export const fasciaOrariaSchema = z.object({
  nome: z.string().min(1, 'Il nome è obbligatorio').max(100),
  tipoTurno: z.enum(['MATTINA', 'PRANZO', 'SERA', 'NOTTE', 'SPEZZATO']),
  oraInizio: z.string().regex(timeFormatRegex, 'Formato orario non valido (HH:mm)'),
  oraFine: z.string().regex(timeFormatRegex, 'Formato orario non valido (HH:mm)'),
  pausaPranzoInizio: z.string().regex(timeFormatRegex, 'Formato orario non valido (HH:mm)').optional().nullable(),
  pausaPranzoFine: z.string().regex(timeFormatRegex, 'Formato orario non valido (HH:mm)').optional().nullable(),
  maggiorazione: z.number().min(0, 'La maggiorazione non può essere negativa').max(100, 'La maggiorazione massima è 100%'),
  attivo: z.boolean(),
}).refine(
  (data) => {
    // Per turni notturni, oraFine può essere prima di oraInizio (es. 22:00 - 06:00)
    // Per altri turni, oraFine deve essere dopo oraInizio
    if (data.tipoTurno === 'NOTTE') {
      return true // Accetta qualsiasi combinazione per turni notturni
    }
    return timeToMinutes(data.oraFine) > timeToMinutes(data.oraInizio)
  },
  {
    message: "L'orario di fine deve essere successivo all'orario di inizio",
    path: ['oraFine'],
  }
).refine(
  (data) => {
    // Se turno SPEZZATO con pausa pranzo, verifica che siano entrambi i campi
    if (data.tipoTurno === 'SPEZZATO') {
      if (data.pausaPranzoInizio || data.pausaPranzoFine) {
        return data.pausaPranzoInizio && data.pausaPranzoFine
      }
    }
    return true
  },
  {
    message: 'Per turni SPEZZATO specificare sia inizio che fine della pausa pranzo',
    path: ['pausaPranzoFine'],
  }
).refine(
  (data) => {
    // Se c'è pausa pranzo per SPEZZATO, verifica che sia nell'intervallo di lavoro
    if (data.tipoTurno === 'SPEZZATO' && data.pausaPranzoInizio && data.pausaPranzoFine) {
      const pausaInizioMin = timeToMinutes(data.pausaPranzoInizio)
      const pausaFineMin = timeToMinutes(data.pausaPranzoFine)
      const inizioMin = timeToMinutes(data.oraInizio)
      const fineMin = timeToMinutes(data.oraFine)

      return (
        pausaFineMin > pausaInizioMin &&
        pausaInizioMin >= inizioMin &&
        pausaFineMin <= fineMin
      )
    }
    return true
  },
  {
    message: 'La pausa pranzo deve essere compresa nell\'orario di lavoro',
    path: ['pausaPranzoFine'],
  }
)

export type FasciaOrariaInput = z.infer<typeof fasciaOrariaSchema>

// Schema per Festività
export const festivitaSchema = z.object({
  nome: z.string().min(1, 'Il nome è obbligatorio').max(100),
  data: z.string().min(1, 'La data è obbligatoria'), // Formato ISO date string
  ricorrente: z.boolean(),
  maggiorazione: z.number().min(0, 'La maggiorazione non può essere negativa').max(100, 'La maggiorazione massima è 100%'),
})

export type FestivitaInput = z.infer<typeof festivitaSchema>
