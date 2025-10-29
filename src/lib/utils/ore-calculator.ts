/**
 * Utilità per il calcolo delle ore lavorate e straordinari
 */

export interface CalcoloOreResult {
  oreLavorate: number
  oreStraordinario: number
  oreNormali: number
  pausaPranzo: number
  note?: string
}

export interface FasciaOraria {
  inizio: string // formato HH:mm
  fine: string // formato HH:mm
  tipo: 'normale' | 'straordinario' | 'notturno'
}

export interface Timbratura {
  entrata: string // formato HH:mm
  uscita: string // formato HH:mm
  data: Date
}

/**
 * Calcola le ore lavorate tra due orari
 */
export function calcolaOreTraOrari(
  oraInizio: string,
  oraFine: string,
  consideraNightShift = true
): number {
  const [inizioOre, inizioMinuti] = oraInizio.split(':').map(Number)
  const [fineOre, fineMinuti] = oraFine.split(':').map(Number)
  
  const inizioMinutiTotali = inizioOre * 60 + inizioMinuti
  let fineMinutiTotali = fineOre * 60 + fineMinuti
  
  // Gestione turni notturni (es. 22:00 - 06:00)
  if (consideraNightShift && fineMinutiTotali < inizioMinutiTotali) {
    fineMinutiTotali += 24 * 60 // Aggiungi 24 ore
  }
  
  const diffMinuti = fineMinutiTotali - inizioMinutiTotali
  return Math.round((diffMinuti / 60) * 100) / 100
}

/**
 * Calcola le ore lavorate con gestione pause automatiche
 */
export function calcolaOreLavorate(
  timbratura: Timbratura,
  oreContrattoGiornaliere: number = 8,
  pausaPranzoMinuti: number = 30,
  sogliaPausaAutomatica: number = 6 // ore
): CalcoloOreResult {
  const oreTotali = calcolaOreTraOrari(timbratura.entrata, timbratura.uscita)
  
  // Calcola pausa pranzo automatica
  let pausaApplicata = 0
  if (oreTotali >= sogliaPausaAutomatica) {
    pausaApplicata = pausaPranzoMinuti / 60 // Converti in ore
  }
  
  const oreLavorateNette = Math.max(0, oreTotali - pausaApplicata)
  
  // Calcola straordinari
  let oreStraordinario = 0
  let oreNormali = oreLavorateNette
  
  if (oreLavorateNette > oreContrattoGiornaliere) {
    oreStraordinario = Math.round((oreLavorateNette - oreContrattoGiornaliere) * 100) / 100
    oreNormali = oreContrattoGiornaliere
  }
  
  return {
    oreLavorate: Math.round(oreLavorateNette * 100) / 100,
    oreStraordinario: Math.round(oreStraordinario * 100) / 100,
    oreNormali: Math.round(oreNormali * 100) / 100,
    pausaPranzo: Math.round(pausaApplicata * 100) / 100,
    note: oreTotali >= sogliaPausaAutomatica ? `Pausa pranzo automatica di ${pausaPranzoMinuti} minuti applicata` : undefined
  }
}

/**
 * Calcola le ore settimanali totali da una lista di presenze
 */
export function calcolaOreSettimanali(
  presenze: Array<{
    data: Date
    entrata?: string
    uscita?: string
    oreLavorate?: number
    oreStraordinario?: number
  }>,
  oreContrattoSettimanali: number = 40
): {
  oreTotali: number
  oreNormali: number
  oreStraordinario: number
  giorniLavorati: number
  mediaGiornaliera: number
} {
  const presenzeConOre = presenze.filter(p => p.oreLavorate && p.oreLavorate > 0)
  
  const oreTotali = presenzeConOre.reduce((sum, p) => sum + (p.oreLavorate || 0), 0)
  const oreStraordinario = presenzeConOre.reduce((sum, p) => sum + (p.oreStraordinario || 0), 0)
  const oreNormali = oreTotali - oreStraordinario
  const giorniLavorati = presenzeConOre.length
  const mediaGiornaliera = giorniLavorati > 0 ? oreTotali / giorniLavorati : 0
  
  return {
    oreTotali: Math.round(oreTotali * 100) / 100,
    oreNormali: Math.round(oreNormali * 100) / 100,
    oreStraordinario: Math.round(oreStraordinario * 100) / 100,
    giorniLavorati,
    mediaGiornaliera: Math.round(mediaGiornaliera * 100) / 100
  }
}

/**
 * Calcola le ore mensili da una lista di presenze
 */
export function calcolaOreMensili(
  presenze: Array<{
    data: Date
    entrata?: string
    uscita?: string
    oreLavorate?: number
    oreStraordinario?: number
  }>,
  mese: number,
  anno: number,
  oreContrattoSettimanali: number = 40
): {
  oreTotali: number
  oreNormali: number
  oreStraordinario: number
  giorniLavorati: number
  oreContrattoMese: number
  differenzaContratto: number
  mediaGiornaliera: number
} {
  const presenzeMese = presenze.filter(p => {
    const data = new Date(p.data)
    return data.getMonth() === mese - 1 && data.getFullYear() === anno
  })
  
  const mensili = calcolaOreSettimanali(presenzeMese, oreContrattoSettimanali)
  
  // Calcola ore contrattuali per il mese (basato su giorni lavorativi)
  const giorniNelMese = new Date(anno, mese, 0).getDate()
  const giorniLavorativi = calcolaGiorniLavorativi(anno, mese - 1)
  const oreContrattoMese = Math.round((giorniLavorativi * oreContrattoSettimanali / 5) * 100) / 100
  const differenzaContratto = mensili.oreTotali - oreContrattoMese
  
  return {
    ...mensili,
    oreContrattoMese,
    differenzaContratto: Math.round(differenzaContratto * 100) / 100
  }
}

/**
 * Calcola i giorni lavorativi in un mese (esclusi sabato e domenica)
 */
function calcolaGiorniLavorativi(anno: number, mese: number): number {
  let giorniLavorativi = 0
  const giorniNelMese = new Date(anno, mese + 1, 0).getDate()
  
  for (let giorno = 1; giorno <= giorniNelMese; giorno++) {
    const data = new Date(anno, mese, giorno)
    const giornoSettimana = data.getDay()
    
    // 0 = domenica, 6 = sabato
    if (giornoSettimana !== 0 && giornoSettimana !== 6) {
      giorniLavorativi++
    }
  }
  
  return giorniLavorativi
}

/**
 * Verifica se un orario è valido
 */
export function validaOrario(orario: string): boolean {
  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  return regex.test(orario)
}

/**
 * Formatta un numero di ore in formato HH:mm
 */
export function formattaOreDecimaliInHHmm(oreDecimali: number): string {
  const ore = Math.floor(oreDecimali)
  const minuti = Math.round((oreDecimali - ore) * 60)
  
  return `${ore.toString().padStart(2, '0')}:${minuti.toString().padStart(2, '0')}`
}

/**
 * Converte formato HH:mm in ore decimali
 */
export function formattaHHmmInOreDecimali(hhmm: string): number {
  const [ore, minuti] = hhmm.split(':').map(Number)
  return Math.round((ore + minuti / 60) * 100) / 100
}

/**
 * Calcola la retribuzione oraria da mensile
 */
export function calcolaRetribuzioneOraria(
  retribuzioneMensile: number,
  oreContrattoSettimanali: number = 40
): number {
  const oreMensiliContratto = (oreContrattoSettimanali / 5) * 4.33 // Media giorni lavorativi al mese
  return Math.round((retribuzioneMensile / oreMensiliContratto) * 100) / 100
}

/**
 * Calcola il costo dello straordinario
 */
export function calcolaCostoStraordinario(
  oreStraordinario: number,
  retribuzioneOraria: number,
  maggiorazione: number = 1.25 // 25% di maggiorazione standard
): number {
  return Math.round((oreStraordinario * retribuzioneOraria * maggiorazione) * 100) / 100
}