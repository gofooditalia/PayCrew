# Guida all'Integrazione di Prisma con Supabase

## Configurazione Completata

### 1. Dipendenze Installate
✅ `prisma` e `@prisma/client` installati

### 2. Schema Prisma Configurato
✅ File `prisma/schema.prisma` configurato con:
- Provider PostgreSQL
- Connessione a Supabase tramite `DATABASE_URL`
- Connessione diretta per migrazioni tramite `DIRECT_URL`
- Modello di esempio `Employee`

### 3. Client Prisma Configurato
✅ File `src/lib/prisma.ts` creato con istanza singleton del client

### 4. Script Aggiunti
✅ Script aggiunti a `package.json`:
- `db:generate` - Genera il client Prisma
- `db:push` - Sincronizza lo schema con il database
- `db:studio` - Apre Prisma Studio
- `db:migrate` - Crea e applica migrazioni
- `db:reset` - Resetta il database

### 5. Pagine di Test
✅ `src/app/test-prisma/page.tsx` - Test di connessione a Prisma + Supabase

## Prossimi Passi Manuali

### 1. Generare il Client Prisma
```bash
npx prisma generate
```

### 2. Sincronizzare il Database
```bash
npx prisma db push
```

### 3. (Opzionale) Creare Migrazione
```bash
npx prisma migrate dev --name init
```

### 4. Aprire Prisma Studio
```bash
npx prisma studio
```

## Esempio di Utilizzo

### Creare un Nuovo Dipendente
```typescript
import { prisma } from '@/lib/prisma'

async function createEmployee(data: {
  firstName: string
  lastName: string
  email: string
  position?: string
  salary?: number
}) {
  const employee = await prisma.employee.create({
    data
  })
  return employee
}
```

### Ottenere Tutti i Dipendenti
```typescript
import { prisma } from '@/lib/prisma'

async function getAllEmployees() {
  const employees = await prisma.employee.findMany({
    where: { isActive: true }
  })
  return employees
}
```

### Aggiornare un Dipendente
```typescript
import { prisma } from '@/lib/prisma'

async function updateEmployee(id: string, data: Partial<{
  firstName: string
  lastName: string
  position: string
  salary: number
}>) {
  const employee = await prisma.employee.update({
    where: { id },
    data
  })
  return employee
}
```

## Vantaggi dell'Integrazione

1. **Type Safety**: Prisma fornisce tipi TypeScript automatici
2. **Autocompletamento**: Supporto completo nell'IDE
3. **Migrazioni**: Gestione sicura delle modifiche al database
4. **Query Optimization**: Query efficienti e ottimizzate
5. **Development Experience**: Prisma Studio per visualizzare i dati

## Note Importanti

1. **Variabili d'Ambiente**: Assicurati che `DATABASE_URL` e `DIRECT_URL` siano corrette
2. **Connessione Diretta**: `DIRECT_URL` è necessaria per le migrazioni
3. **Generazione Client**: Ricorda di rigenerare il client dopo modifiche allo schema
4. **Sincronizzazione**: Usa `db:push` per sviluppo rapido o `db:migrate` per produzione

## Troubleshooting

### Errore di Connessione
- Verifica le variabili d'ambiente
- Controlla che il database Supabase sia attivo
- Assicurati che le credenziali siano corrette

### Errore di Generazione Client
- Esegui `npx prisma generate`
- Verifica che lo schema sia sintatticamente corretto

### Errore di Sincronizzazione
- Controlla la connessione diretta con `DIRECT_URL`
- Verifica i permessi del database