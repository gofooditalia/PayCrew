# Sprint 1 - Piano Dettagliato: Fondamenta PayCrew

## Obiettivo Sprint
Stabilire le fondamenta tecniche e architetturali per PayCrew, configurando l'infrastruttura completa e i componenti base.

## Task 1: Aggiornamento Schema Prisma

### 1.1 Sostituire Schema Esistente
**File da modificare**: `prisma/schema.prisma`

**Azioni**:
- Sostituire il modello Employee base con lo schema completo del documento
- Implementare tutti i modelli: User, Azienda, Sede, Dipendente, Documento, Presenza, Turno, FeriePermessi, BustaPaga
- Configurare tutti gli enum e le relazioni

**Risultato atteso**: Schema completo con 11 modelli e relazioni corrette

### 1.2 Generare e Applicare Migrazioni
**Comandi**:
```bash
npx prisma generate
npx prisma db push
```

**Risultato atteso**: Database Supabase sincronizzato con il nuovo schema

## Task 2: Configurazione Supabase Avanzata

### 2.1 Setup Client Supabase
**File da creare**:
- `src/lib/supabase/client.ts` - Client browser
- `src/lib/supabase/server.ts` - Client server-side
- `src/lib/supabase/middleware.ts` - Helper per middleware

### 2.2 Configurare Middleware
**File da creare**: `middleware.ts` (root)

**Funzionalità**: Gestione sessioni auth e refresh automatici

### 2.3 Setup Storage Buckets
**Azioni in Dashboard Supabase**:
- Creare bucket `documenti-dipendenti` (private)
- Creare bucket `cedolini` (private)
- Configurare RLS policies per entrambi i bucket

### 2.4 Configurare RLS Policies
**SQL da eseguire in Supabase SQL Editor**:
- Abilitare RLS su tutte le tabelle
- Creare policies per SELECT/INSERT/UPDATE/DELETE basate su aziendaId
- Configurare policies per storage buckets

## Task 3: Installazione Dipendenze Aggiuntive

### 3.1 Installare Pacchetti
```bash
# Supabase SSR
npm install @supabase/ssr

# UI Components
npx shadcn-ui@latest init

# Forms e Validazione
npm install react-hook-form @hookform/resolvers zod

# Utilità
npm install date-fns recharts @tanstack/react-table

# PDF Generation
npm install jspdf jspdf-autotable
npm install -D @types/jspdf

# State Management
npm install zustand
```

### 3.2 Configurare shadcn/ui
**Azioni**:
- Eseguire `npx shadcn-ui@latest init`
- Installare componenti base: Button, Input, Card, Table, Dialog, Form

## Task 4: Struttura Cartelle e File Base

### 4.1 Creare Struttura Cartelle
```
/app
  /(auth)
    /login
    /register
  /(dashboard)
    /layout.tsx
    /dashboard
    /dipendenti
    /presenze
    /buste-paga
/components
  /ui
  /auth
  /dipendenti
  /shared
/lib
  /supabase
  /validations
  /calculations
/types
```

### 4.2 File di Configurazione
**File da creare**:
- `types/database.types.ts` (generato da Supabase)
- `lib/validations/index.ts` (schemi Zod)
- `lib/calculations/index.ts` (logiche di calcolo)

## Task 5: Autenticazione Base

### 5.1 Login Page
**File**: `app/(auth)/login/page.tsx`

**Funzionalità**:
- Form login con email/password
- Gestione errori
- Redirect dopo login
- Integration con Supabase Auth

### 5.2 Register Page
**File**: `app/(auth)/register/page.tsx`

**Funzionalità**:
- Form registrazione
- Validazione input
- Creazione utente in Supabase Auth
- Creazione profilo in database

### 5.3 Protected Layout
**File**: `app/(dashboard)/layout.tsx`

**Funzionalità**:
- Verifica autenticazione
- Sidebar navigation
- Header con user menu
- Logout functionality

## Task 6: UI Components Base

### 6.1 Layout Principale
**Componenti**:
- Sidebar con navigazione
- Header con profilo utente
- Main content area
- Responsive design

### 6.2 Componenti UI Riutilizzabili
**Componenti shadcn/ui da installare**:
- Button, Input, Label
- Card, CardHeader, CardContent
- Table, TableHeader, TableBody
- Dialog, DialogContent
- Form, FormItem, FormLabel

## Task 7: Setup Ambiente Sviluppo

### 7.1 TypeScript Configuration
**File da verificare**: `tsconfig.json`
- Assicurarsi che path aliases siano configurati
- Verificare strict mode

### 7.2 Environment Variables
**File da verificare**: `.env.local`
- Tutte le variabili Supabase presenti
- Variabili database corrette

### 7.3 Testing Setup
**Azioni**:
- Testare connessione Supabase
- Testare autenticazione
- Testare connessione Prisma

## Deliverables Sprint 1

### Tecnici
1. ✅ Schema Prisma completo e sincronizzato
2. ✅ Configurazione Supabase completa (Auth + Storage + RLS)
3. ✅ Tutte le dipendenze installate e configurate
4. ✅ Struttura cartelle creata
5. ✅ Sistema di autenticazione funzionante
6. ✅ Layout base con navigazione protetta

### Documentazione
1. 📄 Guida setup ambiente sviluppo
2. 📄 Architettura database e relazioni
3. 📄 Guida autenticazione e permessi
4. 📄 API documentation base

## Criteri di Successo

### Funzionali
- [ ] Utente può registrarsi e fare login
- [ ] Utente autenticato accede al dashboard
- [ ] Utente non autenticato viene reindirizzato al login
- [ ] Database risponde correttamente alle query
- [ ] Upload file funziona su Supabase Storage

### Tecnici
- [ ] TypeScript senza errori
- [ ] Tutti i test passano
- [ ] Performance accettabili (< 2s load time)
- [ ] Responsive design su mobile/desktop
- [ ] Accessibilità base (WCAG 2.1 AA)

## Rischi e Mitigazioni

### Rischio: Problemi con RLS Policies
**Mitigazione**: Testare approfonditamente con diversi ruoli utente

### Rischio: Performance Database
**Mitigazione**: Ottimizzare query e indici Prisma

### Rischio: Complessità Schema
**Mitigazione**: Documentazione dettagliata e revisione architettura

## Prossimi Sprint

Sprint 1 getta le basi per:
- Sprint 2: CRUD Dipendenti e Gestione Aziende
- Sprint 3: Presenze e Turni
- Sprint 4: Buste Paga e Report

Questo sprint è fondamentale per il successo del progetto, quindi dedicare attenzione particolare alla qualità del codice e alla completezza della configurazione.