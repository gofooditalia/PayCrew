-- Aggiungi campo retribuzioneNetta alla tabella dipendenti
ALTER TABLE "dipendenti" ADD COLUMN IF NOT EXISTS "retribuzioneNetta" DECIMAL(10,2);

-- Crea enum tipo_pagamento
DO $$ BEGIN
    CREATE TYPE "tipo_pagamento" AS ENUM ('CONTANTI', 'BONIFICO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crea tabella pagamenti_dipendenti
CREATE TABLE IF NOT EXISTS "pagamenti_dipendenti" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "importo" DECIMAL(10,2) NOT NULL,
    "tipoPagamento" "tipo_pagamento" NOT NULL,
    "dataPagamento" DATE NOT NULL,
    "note" TEXT,
    "dipendenteId" UUID NOT NULL,
    "bustaPagaId" UUID,
    "aziendaId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pagamenti_dipendenti_pkey" PRIMARY KEY ("id")
);

-- Aggiungi foreign keys
ALTER TABLE "pagamenti_dipendenti" ADD CONSTRAINT "pagamenti_dipendenti_dipendenteId_fkey"
    FOREIGN KEY ("dipendenteId") REFERENCES "dipendenti"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pagamenti_dipendenti" ADD CONSTRAINT "pagamenti_dipendenti_bustaPagaId_fkey"
    FOREIGN KEY ("bustaPagaId") REFERENCES "buste_paga"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "pagamenti_dipendenti" ADD CONSTRAINT "pagamenti_dipendenti_aziendaId_fkey"
    FOREIGN KEY ("aziendaId") REFERENCES "aziende"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Crea indici
CREATE INDEX IF NOT EXISTS "pagamenti_dipendenti_dipendenteId_idx" ON "pagamenti_dipendenti"("dipendenteId");
CREATE INDEX IF NOT EXISTS "pagamenti_dipendenti_aziendaId_idx" ON "pagamenti_dipendenti"("aziendaId");
CREATE INDEX IF NOT EXISTS "pagamenti_dipendenti_dataPagamento_idx" ON "pagamenti_dipendenti"("dataPagamento");
CREATE INDEX IF NOT EXISTS "pagamenti_dipendenti_bustaPagaId_idx" ON "pagamenti_dipendenti"("bustaPagaId");

-- Abilita Row Level Security
ALTER TABLE "pagamenti_dipendenti" ENABLE ROW LEVEL SECURITY;

-- Crea policy RLS per pagamenti_dipendenti (simile alle altre tabelle)
CREATE POLICY "Users can view pagamenti_dipendenti from their company"
    ON "pagamenti_dipendenti" FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM users WHERE "aziendaId" = "pagamenti_dipendenti"."aziendaId"
    ));

CREATE POLICY "Users can insert pagamenti_dipendenti for their company"
    ON "pagamenti_dipendenti" FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM users WHERE "aziendaId" = "pagamenti_dipendenti"."aziendaId"
    ));

CREATE POLICY "Users can update pagamenti_dipendenti from their company"
    ON "pagamenti_dipendenti" FOR UPDATE
    USING (auth.uid() IN (
        SELECT id FROM users WHERE "aziendaId" = "pagamenti_dipendenti"."aziendaId"
    ));

CREATE POLICY "Users can delete pagamenti_dipendenti from their company"
    ON "pagamenti_dipendenti" FOR DELETE
    USING (auth.uid() IN (
        SELECT id FROM users WHERE "aziendaId" = "pagamenti_dipendenti"."aziendaId"
    ));
