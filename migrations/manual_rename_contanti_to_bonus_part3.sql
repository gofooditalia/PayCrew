-- Migration: Rinomina 'contanti' in 'bonus' - Parte 3
-- Data: 2025-01-14
-- Descrizione: Aggiorna i record esistenti

-- 3. Aggiorna tutti i record esistenti da CONTANTI a BONUS
UPDATE pagamenti_dipendenti
SET "tipoPagamento" = 'BONUS'
WHERE "tipoPagamento" = 'CONTANTI';
