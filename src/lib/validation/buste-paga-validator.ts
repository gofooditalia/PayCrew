import { z } from "zod";

/**
 * Schema di validazione per la creazione/aggiornamento di una busta paga
 * Include campi per gestione pagamenti con terminologia discreta
 */
export const bustaPagaSchema = z.object({
  // Identificativi e periodo
  dipendenteId: z.string().uuid("ID dipendente non valido"),
  mese: z.number().int().min(1, "Il mese deve essere tra 1 e 12").max(12, "Il mese deve essere tra 1 e 12"),
  anno: z.number().int().min(2000, "Anno non valido").max(2100, "Anno non valido"),

  // Dati retributivi standard (per busta paga ufficiale)
  retribuzioneLorda: z.number().nonnegative("La retribuzione lorda deve essere positiva"),
  straordinari: z.number().nonnegative("Gli straordinari devono essere positivi").optional().default(0),
  altreCompetenze: z.number().nonnegative("Le altre competenze devono essere positive").optional().default(0),
  totaleLordo: z.number().nonnegative("Il totale lordo deve essere positivo"),
  contributiINPS: z.number().nonnegative("I contributi INPS devono essere positivi"),
  irpef: z.number().nonnegative("L'IRPEF deve essere positiva"),
  altreRitenute: z.number().nonnegative("Le altre ritenute devono essere positive").optional().default(0),
  totaleRitenute: z.number().nonnegative("Il totale ritenute deve essere positivo"),
  netto: z.number().nonnegative("Il netto deve essere positivo"),
  tfr: z.number().nonnegative("Il TFR deve essere positivo"),
  oreLavorate: z.number().nonnegative("Le ore lavorate devono essere positive"),
  oreStraordinario: z.number().nonnegative("Le ore straordinario devono essere positive").optional().default(0),

  // Nuovi campi per gestione pagamenti interna (discreta)
  acconto1: z.number().nonnegative("L'acconto 1 deve essere positivo").optional().default(0),
  acconto2: z.number().nonnegative("L'acconto 2 deve essere positivo").optional().default(0),
  acconto3: z.number().nonnegative("L'acconto 3 deve essere positivo").optional().default(0),
  acconto4: z.number().nonnegative("L'acconto 4 deve essere positivo").optional().default(0),
  totaleAcconti: z.number().nonnegative("Il totale acconti deve essere positivo").optional().default(0),
  bonus: z.number().nonnegative("Il bonus deve essere positivo").optional().default(0),
  importoBonifico: z.number().nonnegative("L'importo bonifico deve essere positivo").optional(),
  differenza: z.number().optional(),
  note: z.string().max(1000, "Le note non possono superare 1000 caratteri").optional(),

  // Storage path per PDF
  storagePath: z.string().optional(),
});

/**
 * Schema semplificato per l'inserimento veloce
 * Calcola automaticamente i totali
 */
export const bustaPagaQuickSchema = z.object({
  dipendenteId: z.string().uuid("ID dipendente non valido"),
  mese: z.number().int().min(1).max(12),
  anno: z.number().int().min(2000).max(2100),

  // Campi essenziali
  retribuzioneLorda: z.number().nonnegative(),
  oreLavorate: z.number().nonnegative(),
  oreStraordinario: z.number().nonnegative().optional().default(0),

  // Acconti settimanali
  acconto1: z.number().nonnegative().optional().default(0),
  acconto2: z.number().nonnegative().optional().default(0),
  acconto3: z.number().nonnegative().optional().default(0),
  acconto4: z.number().nonnegative().optional().default(0),

  // Bonus e note
  bonus: z.number().nonnegative().optional().default(0),
  note: z.string().max(1000).optional(),
});

/**
 * Schema per la query di ricerca buste paga
 */
export const bustaPagaQuerySchema = z.object({
  dipendenteId: z.string().uuid().optional(),
  mese: z.number().int().min(1).max(12).optional(),
  anno: z.number().int().min(2000).max(2100).optional(),
  sedeId: z.string().uuid().optional(),
});

/**
 * Schema per l'aggiornamento parziale
 */
export const bustaPagaUpdateSchema = bustaPagaSchema.partial().extend({
  id: z.string().uuid("ID busta paga non valido"),
});

// Types inferiti dagli schemi
export type BustaPagaInput = z.infer<typeof bustaPagaSchema>;
export type BustaPagaQuickInput = z.infer<typeof bustaPagaQuickSchema>;
export type BustaPagaQuery = z.infer<typeof bustaPagaQuerySchema>;
export type BustaPagaUpdate = z.infer<typeof bustaPagaUpdateSchema>;

/**
 * Funzione helper per calcolare i totali automaticamente
 */
export function calcolaTotali(input: Partial<BustaPagaInput>): Partial<BustaPagaInput> {
  // Calcola totale acconti
  const totaleAcconti =
    (input.acconto1 || 0) +
    (input.acconto2 || 0) +
    (input.acconto3 || 0) +
    (input.acconto4 || 0);

  // Calcola totale lordo
  const totaleLordo =
    (input.retribuzioneLorda || 0) +
    (input.straordinari || 0) +
    (input.altreCompetenze || 0) +
    (input.bonus || 0);

  // Calcola totale ritenute
  const totaleRitenute =
    (input.contributiINPS || 0) +
    (input.irpef || 0) +
    (input.altreRitenute || 0);

  // Calcola netto
  const netto = totaleLordo - totaleRitenute;

  // Calcola differenza (netto - acconti già erogati)
  const differenza = netto - totaleAcconti;

  return {
    ...input,
    totaleAcconti,
    totaleLordo,
    totaleRitenute,
    netto,
    differenza,
  };
}
