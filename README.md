# PayCrew - Gestionale Dipendenti e Buste Paga

Applicazione web moderna per la gestione completa dei dipendenti e l'elaborazione delle buste paga, ottimizzata principalmente per il settore ristorazione ma utilizzabile da qualsiasi attività.

## 🚀 Caratteristiche Principali

- **Gestione Dipendenti**: Anagrafica completa con documenti e dati contrattuali
- **Turni**: Pianificazione turni singoli e multipli (settimanale/mensile)
- **Presenze**: Auto-generazione da turni con stati e conferma
- **Workflow Integrato**: Turno → Presenza (DA_CONFERMARE) → Conferma/Modifica/Assente
- **Buste Paga**: Calcolo automatico con generazione PDF cedolini
- **Documenti**: Upload e gestione scadenze documentali
- **Dashboard**: Analytics e KPI in tempo reale
- **Multi-azienda**: Supporto per gestione più aziende/sedi
- **Sicurezza**: Autenticazione multi-livello con isolamento dati

## 🛠️ Stack Tecnologico

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Linguaggio**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form + Zod
- **State Management**: React Context + Zustand
- **Charts**: Recharts
- **Tables**: TanStack Table

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **ORM**: Prisma
- **PDF Generation**: jsPDF

## 📋 Stato Sviluppo

### ✅ Sprint 1 - Fondamenta (Completato)
- [x] Configurazione Supabase + Prisma
- [x] Schema database completo
- [x] Autenticazione base
- [x] Layout protetto con navigazione
- [x] Dashboard con statistiche

### ✅ Sprint 2 - Gestione Dipendenti (Completato)
- [x] CRUD Dipendenti completo
- [x] Gestione documenti con upload
- [x] Gestione Aziende/Sedi
- [x] Autenticazione avanzata con ruoli
- [x] API routes complete per dipendenti e aziende
- [x] Componenti UI per gestione dipendenti
- [x] Validazione form con Zod

### ✅ Sprint 3 - Presenze (Completato)
- [x] Registro presenze con filtri e ricerca
- [x] Calcolo ore lavorate automatico
- [x] Note con popover in lista presenze
- [x] Gestione sedi aziendali (CRUD completo)
- [x] Assegnazione sede ai dipendenti
- [x] Skeleton loading su tutte le pagine dinamiche
- [x] **Reset/Undo presenze confermate o assenti**
- [x] **Messaggio guidato per stato vuoto con link a Turni**

### ✅ Sprint 4 - Turni e Buste Paga (Completato)
- [x] **Gestione turni completa** con filtri avanzati
- [x] **Pianificazione multipla turni** (settimanale/mensile)
- [x] **Auto-generazione presenze da turni**
- [x] **Stati presenze** (DA_CONFERMARE, CONFERMATA, MODIFICATA, ASSENTE)
- [x] **Badge e azioni rapide** per conferma presenze
- [x] Calcolo buste paga con PDF cedolini
- [x] Report presenze e cedolini
- [x] Sistema completo buste paga

### 🎉 Sprint 5 - Integrazione Turni-Presenze (Completato)
- [x] **Relazione turno → presenza** nel database
- [x] **Service layer** PresenzeFromTurniService
- [x] **API batch generation** presenze da turni
- [x] **API conferma/modifica** presenze con stati
- [x] **UI completa** con badge colorati per stati
- [x] **Test automatizzati** (11/12 passati - 91.7%)
- [x] **Workflow completo**: Turno → Presenza (DA_CONFERMARE) → Conferma/Modifica/Assente

## 🚀 Release v0.5.0 - Integrazione Turni-Presenze

PayCrew v0.5.0 introduce il workflow completo di gestione turni con auto-generazione presenze:

### ✅ Funzionalità Disponibili

#### Core Features
- **Gestione Aziende e Sedi**: CRUD completo con supporto multi-sede
- **Gestione Dipendenti**: Anagrafica completa con documenti, contratti, scadenze
- **Autenticazione**: Sistema multi-livello con ruoli (SUPER_ADMIN, ADMIN, MANAGER, USER)
- **Activity Logger**: Sistema audit trail per tutte le operazioni critiche

#### Workflow Turni → Presenze
- **Pianificazione Turni**: CRUD completo con filtri avanzati per dipendente, sede, tipo, date
- **Pianificazione Multipla**: Creazione batch turni per settimanale/mensile
- **Auto-generazione Presenze**: Le presenze vengono create automaticamente dai turni pianificati
- **Stati Presenza**: DA_CONFERMARE → CONFERMATA / MODIFICATA / ASSENTE
- **Azioni Rapide**: Conferma/Assente presenze con un click direttamente dalla lista
- **Reset/Undo**: Annulla conferme o assenze per ripristinare stato DA_CONFERMARE
- **Badge Visivi**: Indicatori colorati per stato presenza (giallo, verde, blu, rosso)
- **UX Guidata**: Messaggio informativo con link diretto alla sezione Turni quando non ci sono presenze

#### Elaborazione Cedolini
- **Calcolo Automatico**: Generazione cedolini con calcolo ore lavorate e straordinari
- **PDF Cedolini**: Generazione PDF professionali con dettaglio completo retribuzione
- **Storico Cedolini**: Report mensili per dipendente con filtri avanzati

#### Reports e Analytics
- **Dashboard**: KPI in tempo reale (dipendenti attivi, presenze, turni, cedolini)
- **Report Presenze**: Export e visualizzazione report presenze filtrabili
- **Report Cedolini**: Storico e analisi cedolini per periodo

### 🌐 Deploy
L'applicazione è attualmente in beta test e deployata su:
- **Vercel**: https://pay-crew.vercel.app/ (ambiente di test)
- **Database**: Supabase PostgreSQL con Session pooler per performance ottimali
- **Storage**: Supabase Storage per documenti e PDF cedolini

### 🧪 Testing
Test automatizzati disponibili per validare il workflow turni-presenze:
```bash
npm run test:turni-presenze  # 11/12 test passati (91.7% successo)
```

## 🚀 Quick Start

### Prerequisiti
- Node.js 18+ 
- Account Supabase

### Installazione

1. **Clona la repository**
   ```bash
   git clone https://github.com/tu-username/paycrew.git
   cd paycrew
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Configura le variabili d'ambiente**
   ```bash
   cp .env.example .env.local
   ```
   
   Modifica `.env.local` con le tue credenziali Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
   DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
   ```

4. **Configura il database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Configura Supabase Storage**
   - Crea buckets `documenti-dipendenti` e `cedolini`
   - Configura le RLS policies (vedi documentazione)

6. **Avvia l'applicazione**
   ```bash
   npm run dev
   ```

7. **Apri il browser**
   Vai su [http://localhost:3000](http://localhost:3000)

## 📁 Struttura Progetto

```
/paycrew
├── /app                    # Next.js App Router
│   ├── /(auth)             # Pagine autenticazione
│   ├── (dashboard)         # Dashboard protetto
│   └── /api                # API routes
├── /components             # Componenti React
│   ├── /ui                 # shadcn/ui components
│   ├── /auth               # Componenti autenticazione
│   ├── /dipendenti         # Componenti dipendenti
│   └── /shared             # Componenti condivisi
├── /lib                    # Librerie e utility
│   ├── /supabase           # Client Supabase
│   ├── /prisma             # Client Prisma
│   ├── /validations        # Schemi Zod
│   └── /calculations       # Logiche calcolo
├── /prisma                 # Schema e migrazioni
├── /types                  # Tipi TypeScript
└── /public                 # File statici
```

## 🗄️ Database Schema

Il progetto utilizza 11 modelli principali:

- **User**: Utenti del sistema con ruoli
- **Azienda**: Aziende clienti
- **Sede**: Sedi operative
- **Dipendente**: Anagrafica dipendenti
- **Documento**: Documenti dipendenti con scadenze
- **Presenza**: Registro presenze
- **Turno**: Turni lavorativi
- **FeriePermessi**: Richieste assenze
- **BustaPaga**: Cedolini mensili

Per il diagramma completo delle relazioni, vedi [`paycrew-architecture-diagram.md`](paycrew-architecture-diagram.md).

## 🔐 Sicurezza

- **Autenticazione**: Supabase Auth con JWT
- **Autorizzazione**: Row Level Security (RLS) policies
- **Isolamento Dati**: Multi-tenant con isolamento per azienda
- **Validazione**: Zod per validazione input lato client e server
- **File Upload**: Sicuro con controllo tipi e dimensioni

## 🧪 Testing

```bash
# Test integrazione turni-presenze (11/12 test - 91.7% successo)
npm run test:turni-presenze

# Esegui test unitari
npm run test

# Esegui test E2E
npm run test:e2e
```

## 📚 Documentazione

- [Piano Implementazione](paycrew-implementation-plan.md)
- [Sprint 1 - Piano Dettagliato](sprint-1-detailed-plan.md)
- [Diagrammi Architettura](paycrew-architecture-diagram.md)
- [Riepilogo Sprint 1](sprint-1-completion-summary.md)

## 🤝 Contribuire

1. Fork la repository
2. Crea un branch feature (`git checkout -b feature/amazing-feature`)
3. Commit le modifiche (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file [LICENSE](LICENSE) per dettagli.

## 🙏 Ringraziamenti

- [Supabase](https://supabase.com/) - Backend as a Service
- [Next.js](https://nextjs.org/) - React Framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework
- [shadcn/ui](https://ui.shadcn.com/) - Component Library

## 📞 Contatto

Per domande o supporto, contatta:

- Email: info@paycrew.it
- Website: [paycrew.it](https://paycrew.it)

---

**PayCrew** - Semplifica la gestione delle risorse umane 🚀
