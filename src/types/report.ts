/**
 * Types per Report e Statistiche
 */

// Report Cedolini
export interface ReportCedoliniMensile {
  mese: number
  anno: number
  dipendenti: ReportDipendente[]
  totali: TotaliReport
}

export interface ReportDipendente {
  dipendenteId: string
  nome: string
  cognome: string
  sede?: {
    id: string
    nome: string
  }
  retribuzioneLorda: number
  straordinari: number
  bonus: number
  totaleLordo: number
  contributiINPS: number
  irpef: number
  totaleRitenute: number
  netto: number
  tfr: number
  acconto1: number
  acconto2: number
  acconto3: number
  acconto4: number
  totaleAcconti: number
  importoBonifico: number
  differenza: number
  oreLavorate: number
  oreStraordinario: number
}

export interface TotaliReport {
  totaleDipendenti: number
  totaleRetribuzioneLorda: number
  totaleStraordinari: number
  totaleBonus: number
  totaleLordo: number
  totaleContributiINPS: number
  totaleIrpef: number
  totaleRitenute: number
  totaleNetto: number
  totaleTfr: number
  totaleAcconti: number
  totaleImportoBonifico: number
  totaleDifferenza: number
  totaleOreLavorate: number
  totaleOreStraordinario: number
}

// Report Presenze
export interface ReportPresenzeMensile {
  mese: number
  anno: number
  dipendenti: ReportPresenzeDipendente[]
  riepilogo: RiepilogoPresenze
}

export interface ReportPresenzeDipendente {
  dipendenteId: string
  nome: string
  cognome: string
  sede?: {
    id: string
    nome: string
  }
  oreContrattualizzate: number // ore settimanali * 4.33 (media settimane/mese)
  oreLavorate: number
  oreStraordinario: number
  giorniLavorati: number
  assenze: number
  percentualePresenza: number
}

export interface RiepilogoPresenze {
  totaleDipendenti: number
  totaleOreLavorate: number
  totaleOreStraordinario: number
  totaleGiorniLavorati: number
  totaleAssenze: number
  mediaOrePerDipendente: number
  mediaPercentualePresenza: number
}

// Filtri Report
export interface FiltriReport {
  mese: number
  anno: number
  sedeId?: string
  dipendenteId?: string
}
