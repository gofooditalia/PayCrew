# Risoluzione Problema Variabili d'Ambiente Prisma

## Problema Riscontrato
```
Error: Environment variable not found: DIRECT_URL.
```

## Soluzione Applicata

### 1. Pulito File .env.local
Rimosse le righe duplicate e formattato correttamente il file.

### 2. Creato File .env
Aggiunto un file `.env` nella radice del progetto con le variabili necessarie per Prisma.

### 3. Verificato .gitignore
Confermato che i file `.env*` sono correttamente esclusi dal version control.

## Prossimi Passi

Ora dovresti poter eseguire con successo:

```bash
npx prisma generate
npx prisma db push
```

## Spiegazione del Problema

Prisma CLI cerca le variabili d'ambiente in questo ordine:
1. File `.env` nella radice del progetto
2. File `.env.local`
3. Variabili d'ambiente del sistema

A volte, specialmente dopo modifiche recenti ai file, Prisma potrebbe non caricare correttamente le variabili da `.env.local`. Avere un file `.env` ridondante risolve questo problema.

## Verifica

Per verificare che le variabili siano caricate correttamente:

```bash
npx prisma validate
```

Se questo comando funziona senza errori, le variabili d'ambiente sono state caricate correttamente.

## Struttura Finale dei File

### .env (per Prisma CLI)
```
DATABASE_URL="postgresql://postgres.jickuwblfiytnvgbhwio:VxV1bbf0autMlN8V@aws-1-eu-central-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.jickuwblfiytnvgbhwio:VxV1bbf0autMlN8V@aws-1-eu-central-2.pooler.supabase.com:5432/postgres"
```

### .env.local (per Next.js)
```
# Connect to Supabase via connection pooling
DATABASE_URL="postgresql://postgres.jickuwblfiytnvgbhwio:VxV1bbf0autMlN8V@aws-1-eu-central-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection to the database. Used for migrations
DIRECT_URL="postgresql://postgres.jickuwblfiytnvgbhwio:VxV1bbf0autMlN8V@aws-1-eu-central-2.pooler.supabase.com:5432/postgres"

# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=https://jickuwblfiytnvgbhwio.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_cbFcZZoYjCqsUcXJ4d9Tvg__qlG8o1s
SUPABASE_SERVICE_ROLE_KEY=sb_secret_bKmtF-AObvWJ6avh5LiJBw_jZelD65d
```

Questa configurazione assicura che sia Prisma CLI che Next.js abbiano accesso alle variabili d'ambiente necessarie.