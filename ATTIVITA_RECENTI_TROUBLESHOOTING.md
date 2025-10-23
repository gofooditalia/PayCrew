# Guida alla Risoluzione dei Problemi - Attività Recenti

## Problema: La sezione "Attività Recenti" non mostra nulla

### Possibili Cause e Soluzioni

### 1. RLS (Row Level Security) non abilitato

**Sintomo**: La tabella `attivita` restituisce dati vuoti, ma non ci sono errori visibili.

**Soluzione**:
1. Esegui l'API route per abilitare RLS:
   ```
   POST /api/setup-attivita-rls
   ```

2. Oppure esegui manualmente queste query SQL in Supabase:
   ```sql
   -- Abilita RLS sulla tabella
   ALTER TABLE attivita ENABLE ROW LEVEL SECURITY;
   
   -- Crea policy per visualizzare le attività della propria azienda
   CREATE POLICY "Users can view their company activities" ON attivita
   FOR SELECT USING (
     aziendaId IN (
       SELECT aziendaId FROM users WHERE id = auth.uid()
     )
   );
   
   -- Crea policy per inserire attività per la propria azienda
   CREATE POLICY "Users can insert activities for their company" ON attivita
   FOR INSERT WITH CHECK (
     aziendaId IN (
       SELECT aziendaId FROM users WHERE id = auth.uid()
     )
   );
   ```

### 2. Logger non funzionante

**Sintomo**: Le operazioni sui dipendenti funzionano, ma non vengono registrate attività.

**Test del Logger**:
1. Esegui l'API route di test:
   ```
   POST /api/test-attivita-logger
   ```

2. Se il test restituisce successo, controlla la tabella `attivita` in Supabase.

### 3. Problemi con le query SQL nel Logger

**Sintomo**: Errori 500 quando si tentano operazioni di logging.

**Soluzione**: Controlla i log del server per errori specifici nella query SQL.

## Procedura di Debug Completa

### Passo 1: Verifica la struttura della tabella

1. Esegui questa query in Supabase SQL Editor:
   ```sql
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'attivita' 
   ORDER BY ordinal_position;
   ```

2. Verifica che le colonne corrispondano a quelle usate nel logger.

### Passo 2: Verifica RLS

1. Esegui questa query in Supabase:
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'attivita';
   ```

2. Se `rowsecurity` è `false`, abilita RLS come descritto sopra.

### Passo 3: Test del Logger

1. Crea un dipendente di test e controlla se appare un'attività.
2. Se non appare, esegui il test del logger.

### Passo 4: Verifica le API Routes

1. Testa direttamente l'API delle attività:
   ```
   GET /api/attivita?limit=5
   ```

2. Verifica che restituisca dati o un errore specifico.

## Soluzioni Rapide

### 1. Reset Completo della Tabella

Se nulla funziona, puoi ricreare completamente la tabella:

```sql
-- Droppo la tabella esistente
DROP TABLE IF EXISTS attivita CASCADE;

-- Ricreo la tabella (esegui `npx prisma db push` dopo)
```

### 2. Inserimento Manuale di Test

Inserisci manualmente un'attività di test:

```sql
INSERT INTO attivita (
  id, "tipoAttivita", descrizione, "idEntita", "tipoEntita",
  "userId", "aziendaId", "datiAggiuntivi", "createdAt"
) VALUES (
  gen_random_uuid(),
  'CREAZIONE_DIPENDENTE',
  'Test manuale',
  'test-id',
  'DIPENDENTE',
  'user-id-here',
  'azienda-id-here',
  '{"test": true}',
  NOW()
);
```

Sostituisci `'user-id-here'` e `'azienda-id-here'` con ID reali.

## Checklist di Verifica

- [ ] RLS è abilitato sulla tabella `attivita`
- [ ] Le policy RLS sono configurate correttamente
- [ ] Il logger non genera errori nel server log
- [ ] Le API routes dei dipendenti chiamano il logger
- [ ] L'API `/api/attivita` restituisce dati quando esistono attività
- [ ] Il componente frontend mostra correttamente le attività

## Contatto

Se dopo aver seguito tutti questi passaggi il problema persiste, controlla:
1. I log del server per errori specifici
2. La console del browser per errori JavaScript
3. La scheda Network del browser per vedere le richieste API fallite