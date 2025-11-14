-- Migration: Rinomina 'contanti' in 'bonus' - Parte 2
-- Data: 2025-01-14
-- Descrizione: Aggiorna l'enum tipo_pagamento

-- 2. Aggiorna l'enum tipo_pagamento
-- Prima aggiungi il nuovo valore BONUS (deve essere in una transazione separata)
ALTER TYPE tipo_pagamento ADD VALUE IF NOT EXISTS 'BONUS';
