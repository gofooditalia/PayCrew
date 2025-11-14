-- Migration: Rinomina 'contanti' in 'bonus' - Parte 1
-- Data: 2025-01-14
-- Descrizione: Rinomina il campo limiteContanti in limiteBonus nella tabella dipendenti

-- 1. Rinomina la colonna limiteContanti in limiteBonus
ALTER TABLE dipendenti
RENAME COLUMN "limiteContanti" TO "limiteBonus";
