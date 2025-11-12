# TODO: Implementazione Pagamenti Mensili

## Richiesta Utente
Modificare la gestione pagamenti per renderla simile alla sezione cedolini:
- I pagamenti devono essere organizzati per mese/anno (retribuzioni mensili)
- L'utente crea il pagamento selezionando il dipendente e registrando un pagamento relativo al mese corrente
- Vista aggregata per mese con filtri mese/anno
- Ogni pagamento associato a un mese specifico di riferimento
- Saldo che si resetta ogni mese (non cumulativo)

## Implementazione Proposta

### 1. Database Schema
Aggiungere campi alla tabella `pagamenti_dipendenti`:
- `mese` (Int) - mese di riferimento (1-12)
- `anno` (Int) - anno di riferimento (es. 2025)

```prisma
model pagamenti_dipendenti {
  // ... campi esistenti
  mese           Int
  anno           Int
  // ...
}
```

### 2. Pagina Pagamenti (`src/app/(dashboard)/pagamenti/page.tsx`)
- Aggiungere filtri mese/anno in alto (default: mese corrente)
- Mostrare solo i pagamenti del mese selezionato
- Calcolare saldo disponibile basato solo sui pagamenti del mese corrente
- UI simile a quella dei cedolini

### 3. Dialog Pagamento (`src/components/pagamenti/pagamento-dialog.tsx`)
- Aggiungere selettore mese/anno (default: mese corrente)
- Inviare mese/anno all'API durante la creazione
- Calcolare limiti disponibili solo per il mese selezionato

### 4. API Routes (`src/app/api/pagamenti/route.ts`)
- Modificare POST per richiedere mese/anno obbligatori
- Modificare GET per filtrare per mese/anno
- Validare che mese sia 1-12 e anno sia valido

### 5. Migration Database
```bash
npm run db:push
# o
npm run db:migrate
```

## Note Tecniche
- Attualmente `dataPagamento` esiste ma non c'è un campo per mese/anno di riferimento
- I limiti (contanti/bonifico) devono essere calcolati per mese
- Il saldo disponibile si resetta ogni mese
- Mantenere compatibilità con pagamenti esistenti (possibile migrazione dati)

## Riferimenti
- Data conversazione: 2025-11-13
- Branch: main
- Ultimo commit: feat: aggiunge visualizzazione note pagamenti nella lista
- Sessione terminata prima dell'implementazione

## Alla Prossima Sessione
Eseguire: `npm run db:push` dopo aver modificato lo schema Prisma
