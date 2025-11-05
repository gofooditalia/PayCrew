import { Prisma } from "@prisma/client";

/**
 * Type per busta paga con relazioni dipendente
 */
export type BustaPagaWithDipendente = Prisma.buste_pagaGetPayload<{
  include: {
    dipendenti: {
      include: {
        sedi: true;
      };
    };
  };
}>;

/**
 * Type per busta paga semplice (solo dati)
 */
export type BustaPaga = Prisma.buste_pagaGetPayload<{}>;

/**
 * Type per statistiche mensili pagamenti
 */
export interface StatisticheMensili {
  mese: number;
  anno: number;
  totaleBustePaga: number;
  totaleRetribuzioneLorda: number;
  totaleNetto: number;
  totaleAcconti: number;
  totaleBonifici: number;
  totaleDifferenze: number;
  numeroDipendenti: number;
}

/**
 * Type per riepilogo pagamento dipendente
 */
export interface RiepilogoPagamentoDipendente {
  dipendenteId: string;
  nomeCompleto: string;
  sede?: string;
  retribuzione: number;
  oreLavorate: number;
  acconto1: number;
  acconto2: number;
  acconto3: number;
  acconto4: number;
  totaleAcconti: number;
  bonus: number;
  importoBonifico: number;
  differenza: number;
  note?: string;
}

/**
 * Type per filtri ricerca buste paga
 */
export interface FiltriBustePaga {
  dipendenteId?: string;
  mese?: number;
  anno?: number;
  sedeId?: string;
  search?: string;
}

/**
 * Type per dati generazione PDF
 */
export interface DatiCedolinoPDF {
  bustaPaga: BustaPagaWithDipendente;
  azienda: {
    nome: string;
    partitaIva: string;
    indirizzo?: string;
    citta?: string;
    cap?: string;
  };
}
