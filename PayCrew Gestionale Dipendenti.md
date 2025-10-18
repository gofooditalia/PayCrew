# PayCrew - Gestionale Dipendenti e Buste Paga

## Contesto Progetto
Ho già inizializzato un progetto Next.js con `npx create-next-app@latest`.
Sviluppa un gestionale web per la gestione completa dei dipendenti e l'elaborazione delle buste paga, ottimizzato principalmente per il settore ristorazione ma utilizzabile da qualsiasi attività.

## Stack Tecnologico

### Già Presente
- **Framework**: Next.js (App Router)
- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS

### Da Integrare
- **Database & Backend**: Supabase (PostgreSQL + Auth + Storage)
- **ORM**: Prisma (con Supabase PostgreSQL)
- **Autenticazione**: Supabase Auth
- **Storage**: Supabase Storage (per documenti dipendenti)
- **UI Components**: shadcn/ui
- **Form Management**: React Hook Form + Zod validation
- **PDF Generation**: jsPDF
- **State Management**: React Context + Zustand (solo dove necessario)
- **Date Management**: date-fns
- **Charts**: Recharts
- **Tables**: TanStack Table (React Table v8)

## Setup Supabase

### 1. Crea Progetto Supabase
1. Vai su https://supabase.com
2. Crea nuovo progetto
3. Salva le credenziali:
   - Project URL
   - Anon/Public Key
   - Service Role Key (per operazioni admin)
   - Database Password

### 2. Installa Dipendenze
```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Prisma con Supabase
npm install prisma @prisma/client
npm install -D prisma

# UI Components
npx shadcn-ui@latest init

# Form e Validazione
npm install react-hook-form @hookform/resolvers zod

# Utilità
npm install date-fns
npm install recharts
npm install @tanstack/react-table

# PDF
npm install jspdf jspdf-autotable
npm install -D @types/jspdf

# State (se necessario)
npm install zustand
```

### 3. Environment Variables (.env.local)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (connection pooler per Prisma)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
```

### 4. Configurazione Supabase Client
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```
```typescript
// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie errors
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie errors
          }
        },
      },
    }
  )
}
```
```typescript
// lib/supabase/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}
```

### 5. Middleware (middleware.ts)
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## Struttura Cartelle Next.js
```
/app
  /(auth)
    /login
      page.tsx
    /register
      page.tsx
    /reset-password
      page.tsx
  /(dashboard)
    layout.tsx (protected layout)
    /dashboard
      page.tsx
    /dipendenti
      page.tsx
      /[id]
        page.tsx
      /nuovo
        page.tsx
    /presenze
      page.tsx
    /buste-paga
      page.tsx
      /[id]
        page.tsx
    /turni
      page.tsx
    /scadenzario
      page.tsx
    /report
      page.tsx
    /impostazioni
      page.tsx
  /api
    /dipendenti
      route.ts
      /[id]
        route.ts
    /presenze
      route.ts
    /buste-paga
      route.ts
      /[id]
        /pdf
          route.ts
    /upload
      route.ts
/components
  /ui (shadcn components)
  /auth
  /dipendenti
  /presenze
  /buste-paga
  /shared
/lib
  /supabase
    client.ts
    server.ts
    middleware.ts
  /prisma
    index.ts
  /utils
  /validations
  /calculations
/prisma
  schema.prisma
  /migrations
/types
  database.types.ts (generato da Supabase)
```

## Configurazione Prisma con Supabase

### prisma/schema.prisma
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id            String    @id @default(uuid()) @db.Uuid
  email         String    @unique
  name          String?
  role          UserRole  @default(USER)
  aziendaId     String?   @db.Uuid
  azienda       Azienda?  @relation(fields: [aziendaId], references: [id])
  createdAt     DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt     DateTime  @updatedAt @db.Timestamptz(6)
  
  @@map("users")
}

enum UserRole {
  SUPER_ADMIN
  ADMIN
  MANAGER
  USER
  
  @@map("user_role")
}

model Azienda {
  id                String      @id @default(uuid()) @db.Uuid
  nome              String
  partitaIva        String      @unique
  codiceFiscale     String?
  indirizzo         String?
  citta             String?
  cap               String?
  telefono          String?
  email             String?
  users             User[]
  dipendenti        Dipendente[]
  sedi              Sede[]
  createdAt         DateTime    @default(now()) @db.Timestamptz(6)
  updatedAt         DateTime    @updatedAt @db.Timestamptz(6)
  
  @@map("aziende")
}

model Sede {
  id            String      @id @default(uuid()) @db.Uuid
  nome          String
  indirizzo     String?
  citta         String?
  aziendaId     String      @db.Uuid
  azienda       Azienda     @relation(fields: [aziendaId], references: [id], onDelete: Cascade)
  dipendenti    Dipendente[]
  turni         Turno[]
  createdAt     DateTime    @default(now()) @db.Timestamptz(6)
  updatedAt     DateTime    @updatedAt @db.Timestamptz(6)
  
  @@map("sedi")
}

model Dipendente {
  id                    String      @id @default(uuid()) @db.Uuid
  nome                  String
  cognome               String
  codiceFiscale         String      @unique
  dataNascita           DateTime    @db.Date
  luogoNascita          String?
  indirizzo             String?
  citta                 String?
  cap                   String?
  telefono              String?
  email                 String?
  iban                  String?
  
  // Dati contrattuali
  dataAssunzione        DateTime    @db.Date
  tipoContratto         TipoContratto
  ccnl                  CCNL
  livello               String
  retribuzione          Decimal     @db.Decimal(10, 2)
  oreSettimanali        Int         @default(40)
  
  // Relazioni
  aziendaId             String      @db.Uuid
  azienda               Azienda     @relation(fields: [aziendaId], references: [id], onDelete: Cascade)
  sedeId                String?     @db.Uuid
  sede                  Sede?       @relation(fields: [sedeId], references: [id])
  
  documenti             Documento[]
  presenze              Presenza[]
  bustePaga             BustaPaga[]
  feriePermessi         FeriePermessi[]
  turni                 Turno[]
  
  attivo                Boolean     @default(true)
  dataCessazione        DateTime?   @db.Date
  
  createdAt             DateTime    @default(now()) @db.Timestamptz(6)
  updatedAt             DateTime    @updatedAt @db.Timestamptz(6)
  
  @@index([aziendaId])
  @@index([codiceFiscale])
  @@map("dipendenti")
}

enum TipoContratto {
  TEMPO_INDETERMINATO
  TEMPO_DETERMINATO
  APPRENDISTATO
  STAGIONALE
  PARTTIME
  
  @@map("tipo_contratto")
}

enum CCNL {
  TURISMO
  COMMERCIO
  METALMECCANICI
  ALTRO
  
  @@map("ccnl")
}

model Documento {
  id              String        @id @default(uuid()) @db.Uuid
  tipo            TipoDocumento
  numero          String?
  dataRilascio    DateTime?     @db.Date
  dataScadenza    DateTime?     @db.Date
  storagePath     String        // Path in Supabase Storage
  fileName        String
  fileSize        Int?
  mimeType        String?
  dipendenteId    String        @db.Uuid
  dipendente      Dipendente    @relation(fields: [dipendenteId], references: [id], onDelete: Cascade)
  createdAt       DateTime      @default(now()) @db.Timestamptz(6)
  
  @@index([dipendenteId])
  @@index([dataScadenza])
  @@map("documenti")
}

enum TipoDocumento {
  CARTA_IDENTITA
  PERMESSO_SOGGIORNO
  CODICE_FISCALE
  CONTRATTO
  VISITA_MEDICA
  ALTRO
  
  @@map("tipo_documento")
}

model Presenza {
  id              String      @id @default(uuid()) @db.Uuid
  data            DateTime    @db.Date
  entrata         DateTime?   @db.Timestamptz(6)
  uscita          DateTime?   @db.Timestamptz(6)
  oreLavorate     Decimal?    @db.Decimal(5, 2)
  oreStraordinario Decimal?   @db.Decimal(5, 2)
  nota            String?
  dipendenteId    String      @db.Uuid
  dipendente      Dipendente  @relation(fields: [dipendenteId], references: [id], onDelete: Cascade)
  createdAt       DateTime    @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime    @updatedAt @db.Timestamptz(6)
  
  @@index([dipendenteId])
  @@index([data])
  @@map("presenze")
}

model Turno {
  id              String      @id @default(uuid()) @db.Uuid
  data            DateTime    @db.Date
  oraInizio       String      // formato HH:mm
  oraFine         String      // formato HH:mm
  tipoTurno       TipoTurno
  dipendenteId    String      @db.Uuid
  dipendente      Dipendente  @relation(fields: [dipendenteId], references: [id], onDelete: Cascade)
  sedeId          String?     @db.Uuid
  sede            Sede?       @relation(fields: [sedeId], references: [id])
  createdAt       DateTime    @default(now()) @db.Timestamptz(6)
  
  @@index([dipendenteId])
  @@index([data])
  @@map("turni")
}

enum TipoTurno {
  MATTINA
  PRANZO
  SERA
  NOTTE
  SPEZZATO
  
  @@map("tipo_turno")
}

model FeriePermessi {
  id              String         @id @default(uuid()) @db.Uuid
  tipo            TipoAssenza
  dataInizio      DateTime       @db.Date
  dataFine        DateTime       @db.Date
  giorni          Int
  stato           StatoRichiesta @default(IN_ATTESA)
  motivazione     String?
  dipendenteId    String         @db.Uuid
  dipendente      Dipendente     @relation(fields: [dipendenteId], references: [id], onDelete: Cascade)
  createdAt       DateTime       @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime       @updatedAt @db.Timestamptz(6)
  
  @@index([dipendenteId])
  @@index([stato])
  @@map("ferie_permessi")
}

enum TipoAssenza {
  FERIE
  PERMESSO
  MALATTIA
  CONGEDO
  
  @@map("tipo_assenza")
}

enum StatoRichiesta {
  IN_ATTESA
  APPROVATA
  RIFIUTATA
  
  @@map("stato_richiesta")
}

model BustaPaga {
  id                  String      @id @default(uuid()) @db.Uuid
  mese                Int         // 1-12
  anno                Int
  
  // Competenze
  retribuzioneLorda   Decimal     @db.Decimal(10, 2)
  straordinari        Decimal     @db.Decimal(10, 2) @default(0)
  altreCompetenze     Decimal     @db.Decimal(10, 2) @default(0)
  totaleLordo         Decimal     @db.Decimal(10, 2)
  
  // Trattenute
  contributiINPS      Decimal     @db.Decimal(10, 2)
  irpef               Decimal     @db.Decimal(10, 2)
  altreRitenute       Decimal     @db.Decimal(10, 2) @default(0)
  totaleRitenute      Decimal     @db.Decimal(10, 2)
  
  // Netto
  netto               Decimal     @db.Decimal(10, 2)
  
  // TFR
  tfr                 Decimal     @db.Decimal(10, 2)
  
  // Dati ore
  oreLavorate         Decimal     @db.Decimal(6, 2)
  oreStraordinario    Decimal     @db.Decimal(6, 2) @default(0)
  
  // File PDF in Supabase Storage
  storagePath         String?
  
  dipendenteId        String      @db.Uuid
  dipendente          Dipendente  @relation(fields: [dipendenteId], references: [id], onDelete: Cascade)
  
  createdAt           DateTime    @default(now()) @db.Timestamptz(6)
  updatedAt           DateTime    @updatedAt @db.Timestamptz(6)
  
  @@unique([dipendenteId, mese, anno])
  @@index([dipendenteId])
  @@index([anno, mese])
  @@map("buste_paga")
}
```

### Inizializza Prisma
```bash
npx prisma generate
npx prisma db push
```

## Configurazione Supabase Storage

### 1. Crea Storage Buckets nella Dashboard Supabase

Vai su Storage e crea questi buckets:
- `documenti-dipendenti` (private)
- `cedolini` (private)

### 2. Storage Policies (RLS)

Nella dashboard Supabase, configura le Row Level Security policies:
```sql
-- Policy per documenti-dipendenti
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documenti-dipendenti');

CREATE POLICY "Users can view their company documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documenti-dipendenti');

-- Policy per cedolini
CREATE POLICY "Authenticated users can upload payslips"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cedolini');

CREATE POLICY "Users can view their company payslips"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'cedolini');
```

### 3. Helper per Upload File
```typescript
// lib/supabase/storage.ts
import { createClient } from '@/lib/supabase/client'

export async function uploadDocument(
  file: File,
  dipendenteId: string,
  tipo: string
) {
  const supabase = createClient()
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${dipendenteId}/${tipo}-${Date.now()}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('documenti-dipendenti')
    .upload(fileName, file)
  
  if (error) throw error
  
  return data.path
}

export async function getDocumentUrl(path: string) {
  const supabase = createClient()
  
  const { data } = supabase.storage
    .from('documenti-dipendenti')
    .getPublicUrl(path)
  
  return data.publicUrl
}

export async function deleteDocument(path: string) {
  const supabase = createClient()
  
  const { error } = await supabase.storage
    .from('documenti-dipendenti')
    .remove([path])
  
  if (error) throw error
}

export async function uploadCedolino(
  pdfBlob: Blob,
  dipendenteId: string,
  mese: number,
  anno: number
) {
  const supabase = createClient()
  
  const fileName = `${dipendenteId}/cedolino-${anno}-${mese.toString().padStart(2, '0')}.pdf`
  
  const { data, error } = await supabase.storage
    .from('cedolini')
    .upload(fileName, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true
    })
  
  if (error) throw error
  
  return data.path
}
```

## Autenticazione con Supabase Auth

### Login Page
```typescript
// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleLogin} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Login PayCrew</h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded">
            {error}
          </div>
        )}
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Accedi
        </button>
      </form>
    </div>
  )
}
```

### Protected Layout
```typescript
// app/(dashboard)/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white">
        {/* Navigation */}
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
```

## Row Level Security (RLS) su Supabase

Configura RLS per proteggere i dati. Esempio per la tabella dipendenti:
```sql
-- Enable RLS
ALTER TABLE dipendenti ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see dipendenti of their azienda
CREATE POLICY "Users view own company dipendenti"
ON dipendenti FOR SELECT
TO authenticated
USING (
  azienda_id IN (
    SELECT azienda_id FROM users WHERE id = auth.uid()
  )
);

-- Policy: Users can insert dipendenti only in their azienda
CREATE POLICY "Users insert own company dipendenti"
ON dipendenti FOR INSERT
TO authenticated
WITH CHECK (
  azienda_id IN (
    SELECT azienda_id FROM users WHERE id = auth.uid()
  )
);
```

Ripeti per tutte le tabelle sensibili (presenze, buste_paga, documenti, ecc.)

## API Route Example con Supabase
```typescript
// app/api/dipendenti/route.ts
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient()
  
  // Verifica autenticazione
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Ottieni l'azienda dell'utente
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { aziendaId: true, role: true }
  })
  
  if (!userData?.aziendaId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }
  
  // Query dipendenti
  const dipendenti = await prisma.dipendente.findMany({
    where: { aziendaId: userData.aziendaId },
    include: {
      sede: true
    },
    orderBy: { cognome: 'asc' }
  })
  
  return NextResponse.json(dipendenti)
}

export async function POST(request: Request) {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await request.json()
  
  // Validazione con Zod qui...
  
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { aziendaId: true }
  })
  
  if (!userData?.aziendaId) {
    return NextResponse.json({ error: 'No company assigned' }, { status: 403 })
  }
  
  const dipendente = await prisma.dipendente.create({
    data: {
      ...body,
      aziendaId: userData.aziendaId
    }
  })
  
  return NextResponse.json(dipendente, { status: 201 })
}
```

## Generazione TypeScript Types da Supabase
```bash
# Genera i types dal database Supabase
npx supabase gen types typescript --project-id "your-project-ref" > types/database.types.ts
```

## Priorità Sviluppo con Supabase

### Sprint 1 (Settimana 1)
1. ✅ Setup Supabase project
2. ✅ Configura Prisma con connection pooler
3. ✅ Schema database + migrations
4. ✅ Supabase Auth configurazione
5. ✅ Layout base + Protected routes
6. ✅ CRUD Dipendenti base

### Sprint 2 (Settimana 2)
1. Setup Supabase Storage buckets
2. Upload documenti con Supabase Storage
3. Gestione presenze
4. Gestione turni
5. Dashboard con KPI

### Sprint 3 (Settimana 3)
1. Logica calcolo buste paga
2. Generazione PDF cedolini
3. Upload cedolini su Supabase Storage
4. Report base
5. Scadenzario

### Sprint 4 (Settimana 4)
1. Ferie/Permessi workflow
2. Multi-azienda/Multi-sede
3. RLS policies ottimizzate
4. Analytics avanzate
5. Testing e ottimizzazioni

## Comandi Utili
```bash
# Sviluppo
npm run dev

# Prisma
npx prisma generate
npx prisma db push
npx prisma studio
npx prisma migrate dev --name init

# Supabase Types
npx supabase gen types typescript --project-id "ref" > types/database.types.ts

# Build
npm run build
npm start
```

## Note Importanti Supabase

### Connection Pooler
- Usa **Transaction mode** per Prisma (porta 6543)
- Usa **Direct connection** per migrations (porta 5432)
- Imposta `connection_limit=1` in DATABASE_URL

### Storage Limits
- Free tier: 1GB storage
- Upgrade per più spazio se necessario
- Considera compressione immagini

### Database Limits
- Free tier: 500MB database
- Pianifica cleanup dati vecchi
- Considera archiving per dati storici

### Auth
- Email confirmation opzionale
- Password reset flow integrato
- OAuth providers disponibili (Google, GitHub, ecc.)

## Inizia con questo comando in Cursor:

"Seguendo queste specifiche per Next.js + Supabase, iniziamo con:
1. Configurazione dei client Supabase (client, server, middleware)
2. Setup Prisma con connection pooler Supabase
3. Creazione schema database e migration
4. Implementazione autenticazione Supabase Auth
5. Layout protetto con middleware"
