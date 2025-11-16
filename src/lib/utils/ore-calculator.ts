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

/**
 * Calcola le ore totali di un turno (con gestione pausa pranzo)
 */
export function calcolaOreTurno(
  oraInizio: string,
  oraFine: string,
  pausaPranzoInizio?: string | null,
  pausaPranzoFine?: string | null
): number {
  const oreTotali = calcolaOreTraOrari(oraInizio, oraFine)

  // Se c'è una pausa pranzo, sottraila
  let pausaPranzoOre = 0
  if (pausaPranzoInizio && pausaPranzoFine) {
    pausaPranzoOre = calcolaOreTraOrari(pausaPranzoInizio, pausaPranzoFine, false)
  }

  return Math.round((oreTotali - pausaPranzoOre) * 100) / 100
}

/**
 * Interfaccia per turno semplificato
 */
export interface TurnoBase {
  data: Date | string
  oraInizio: string
  oraFine: string
  pausaPranzoInizio?: string | null
  pausaPranzoFine?: string | null
}

/**
 * Calcola le ore settimanali totali da una lista di turni
 * Raggruppa per settimana e somma le ore
 */
export function calcolaOreSettimanaliDaTurni(
  turni: TurnoBase[]
): Map<string, number> {
  // Raggruppa turni per settimana (chiave: anno-settimana, es: "2025-W3")
  const orePerSettimana = new Map<string, number>()

  for (const turno of turni) {
    const data = typeof turno.data === 'string' ? new Date(turno.data) : turno.data
    const settimanaKey = getWeekKey(data)

    const oreTurno = calcolaOreTurno(
      turno.oraInizio,
      turno.oraFine,
      turno.pausaPranzoInizio,
      turno.pausaPranzoFine
    )

    const oreAttuali = orePerSettimana.get(settimanaKey) || 0
    orePerSettimana.set(settimanaKey, Math.round((oreAttuali + oreTurno) * 100) / 100)
  }

  return orePerSettimana
}

/**
 * Genera chiave settimana in formato ISO 8601 (anno-W##)
 * ISO 8601: la settimana inizia di lunedì e finisce di domenica
 */
function getWeekKey(data: Date): string {
  // Clona la data per non modificare l'originale
  const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()))

  // ISO 8601: lunedì = 1, domenica = 7
  const dayNum = d.getUTCDay() || 7

  // Imposta alla data del giovedì della stessa settimana
  // (il giovedì è sempre nella settimana corretta secondo ISO)
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)

  // Ottieni l'anno del giovedì
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))

  // Calcola il numero della settimana
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)

  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`
}

/**
 * Interfaccia per una settimana ISO
 */
export interface WeekInfo {
  year: number
  weekNumber: number
  weekKey: string // es: "2025-W47"
  label: string // es: "Sett. 47 (17-23 Nov)"
  startDate: Date // lunedì
  endDate: Date // domenica
}

/**
 * Ottiene informazioni su una settimana ISO 8601 da una data
 */
export function getWeekInfo(data: Date): WeekInfo {
  const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()))
  const dayNum = d.getUTCDay() || 7

  // Trova il lunedì della settimana
  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() - dayNum + 1)

  // Trova la domenica della settimana
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)

  // Calcola il numero della settimana
  const thursday = new Date(monday)
  thursday.setUTCDate(monday.getUTCDate() + 3)
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((thursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)

  // Formatta le date per il label
  const startDay = monday.getUTCDate()
  const endDay = sunday.getUTCDate()
  const startMonth = monday.toLocaleDateString('it-IT', { month: 'short' })
  const endMonth = sunday.toLocaleDateString('it-IT', { month: 'short' })

  let dateRange = ''
  if (monday.getUTCMonth() === sunday.getUTCMonth()) {
    dateRange = `${startDay}-${endDay} ${startMonth}`
  } else {
    dateRange = `${startDay} ${startMonth} - ${endDay} ${endMonth}`
  }

  return {
    year: thursday.getUTCFullYear(),
    weekNumber: weekNo,
    weekKey: `${thursday.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`,
    label: `Sett. ${weekNo} (${dateRange})`,
    startDate: new Date(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate()),
    endDate: new Date(sunday.getUTCFullYear(), sunday.getUTCMonth(), sunday.getUTCDate())
  }
}

/**
 * Ottiene un array di settimane per un determinato periodo
 */
export function getWeeksInRange(dataInizio: Date, dataFine: Date): WeekInfo[] {
  const weeks = new Map<string, WeekInfo>()
  const current = new Date(dataInizio)

  while (current <= dataFine) {
    const weekInfo = getWeekInfo(current)
    weeks.set(weekInfo.weekKey, weekInfo)
    current.setDate(current.getDate() + 7)
  }

  return Array.from(weeks.values()).sort((a, b) => a.weekKey.localeCompare(b.weekKey))
}

/**
 * Ottiene le settimane del mese corrente e i 2 mesi successivi
 */
export function getUpcomingWeeks(numWeeks: number = 12): WeekInfo[] {
  const today = new Date()
  const endDate = new Date(today)
  endDate.setDate(today.getDate() + (numWeeks * 7))

  return getWeeksInRange(today, endDate)
}

/**
 * Converte una settimana ISO (anno-W##) in date di inizio/fine
 */
export function weekKeyToDates(weekKey: string): { startDate: Date; endDate: Date } {
  const [yearStr, weekStr] = weekKey.split('-W')
  const year = parseInt(yearStr)
  const weekNum = parseInt(weekStr)

  // Trova il primo giovedì dell'anno
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7
  const firstMonday = new Date(jan4)
  firstMonday.setUTCDate(jan4.getUTCDate() - jan4Day + 1)

  // Calcola il lunedì della settimana desiderata
  const monday = new Date(firstMonday)
  monday.setUTCDate(firstMonday.getUTCDate() + (weekNum - 1) * 7)

  // Calcola la domenica
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)

  return {
    startDate: new Date(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate()),
    endDate: new Date(sunday.getUTCFullYear(), sunday.getUTCMonth(), sunday.getUTCDate())
  }
}

/**
 * Interfaccia risultato analisi straordinari
 */
export interface AnalisiStraordinari {
  oreTotaliPianificate: number
  oreContrattuali: number
  oreStraordinarioPreviste: number
  percentualeStraordinari: number
  settimaneAnalizzate: number
  dettaglioSettimane: Array<{
    settimana: string
    orePianificate: number
    oreContrattuali: number
    straordinari: number
  }>
}

/**
 * Analizza i turni pianificati per calcolare gli straordinari previsti
 */
export function analizzaStraordinariDaTurni(
  turniPianificati: TurnoBase[],
  oreSettimanaliContrattuali: number
): AnalisiStraordinari {
  const orePerSettimana = calcolaOreSettimanaliDaTurni(turniPianificati)

  let oreTotali = 0
  let oreStraordinarioTotali = 0

  const dettaglioSettimane = Array.from(orePerSettimana.entries()).map(([settimana, orePianificate]) => {
    const straordinari = Math.max(0, orePianificate - oreSettimanaliContrattuali)
    oreTotali += orePianificate
    oreStraordinarioTotali += straordinari

    return {
      settimana,
      orePianificate: Math.round(orePianificate * 100) / 100,
      oreContrattuali: oreSettimanaliContrattuali,
      straordinari: Math.round(straordinari * 100) / 100
    }
  })

  const oreContrattualiTotali = orePerSettimana.size * oreSettimanaliContrattuali

  return {
    oreTotaliPianificate: Math.round(oreTotali * 100) / 100,
    oreContrattuali: oreContrattualiTotali,
    oreStraordinarioPreviste: Math.round(oreStraordinarioTotali * 100) / 100,
    percentualeStraordinari: oreContrattualiTotali > 0
      ? Math.round((oreStraordinarioTotali / oreContrattualiTotali) * 10000) / 100
      : 0,
    settimaneAnalizzate: orePerSettimana.size,
    dettaglioSettimane: dettaglioSettimane.sort((a, b) => a.settimana.localeCompare(b.settimana))
  }
}
