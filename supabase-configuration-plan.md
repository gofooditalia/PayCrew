# Piano di Configurazione per Supabase MCP

## Chiavi Disponibili
- **Publishable Key**: `sb_publishable_cbFcZZoYjCqsUcXJ4d9Tvg__qlG8o1s`
- **Secret Key**: `sb_secret_bKmtF-AObvWJ6avh5LiJBw_jZelD65d`

## Configurazioni da Aggiornare

### 1. File `.kilocode/mcp.json`
Il file deve essere aggiornato per includere l'autenticazione corretta:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=jickuwblfiytnvgbhwio",
      "disabled": false,
      "alwaysAllow": [],
      "headers": {
        "Authorization": "Bearer sb_secret_bKmtF-AObvWJ6avh5LiJBw_jZelD65d"
      }
    }
  }
}
```

### 2. File `.env.local`
Aggiornare le chiavi Supabase con i nuovi valori:

```env
# Connect to Supabase via connection pooling
DATABASE_URL="postgresql://postgres.jickuwblfiytnvgbhwio:VxV1bbf0autMlN8V@aws-1-eu-central-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection to the database. Used for migrations
DIRECT_URL="postgresql://postgres.jickuwblfiytnvgbhwio:VxV1bbf0autMlN8V@aws-1-eu-central-2.pooler.supabase.com:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL=https://jickuwblfiytnvgbhwio.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_cbFcZZoYjCqsUcXJ4d9Tvg__qlG8o1s
SUPABASE_SERVICE_ROLE_KEY=sb_secret_bKmtF-AObvWJ6avh5LiJBw_jZelD65d
```

### 3. Dipendenze da Installare
Installare i pacchetti necessari per Supabase:

```bash
npm install @supabase/supabase-js
```

### 4. File di Configurazione Supabase
Creare un file `src/lib/supabase.ts` per inizializzare il client Supabase:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Per operazioni server-side con privilegi elevati
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### 5. Test di Connessione
Creare un semplice test per verificare che la connessione funzioni:

```typescript
// src/app/test-supabase/page.tsx
import { supabase } from '@/lib/supabase'

export default async function TestSupabase() {
  try {
    const { data, error } = await supabase.from('_test_connection').select('*')
    
    if (error) {
      return <div>Errore di connessione: {error.message}</div>
    }
    
    return <div>Connessione a Supabase riuscita!</div>
  } catch (err) {
    return <div>Errore: {err instanceof Error ? err.message : 'Errore sconosciuto'}</div>
  }
}
```

## Procedura di Implementazione

1. Aggiornare il file `.kilocode/mcp.json` con l'autenticazione corretta
2. Aggiornare il file `.env.local` con le nuove chiavi
3. Installare le dipendenze di Supabase
4. Creare il file di configurazione del client Supabase
5. Riavviare VSCode per applicare le modifiche al server MCP
6. Testare la connessione sia MCP che dell'applicazione

## Risoluzione Problemi

Se la connessione MCP continua a fallire:
- Verificare che la secret key sia corretta e non sia scaduta
- Controllare che il progetto Supabase sia attivo
- Verificare che non ci siano restrizioni IP sul progetto Supabase
- Provare a rigenerare le chiavi se necessario