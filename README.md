# PayCrew - Gestionale Dipendenti e Buste Paga

Applicazione web moderna per la gestione completa dei dipendenti e l'elaborazione delle buste paga, ottimizzata principalmente per il settore ristorazione ma utilizzabile da qualsiasi attività.

## 🚀 Caratteristiche Principali

- **Gestione Dipendenti**: Anagrafica completa con documenti e dati contrattuali
- **Presenze e Turni**: Registro presenze e pianificazione turni settimanali
- **Buste Paga**: Calcolo automatico con generazione PDF cedolini
- **Documenti**: Upload e gestione scadenze documentali
- **Dashboard**: Analytics e KPI in tempo reale
- **Multi-azienda**: Supporto per gestione più aziende/sedi
- **Sicurezza**: Autenticazione multi-livello con isolamento dati

## 🛠️ Stack Tecnologico

### Frontend
- **Framework**: Next.js 15 (App Router)
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

### 🔄 Sprint 2 - Gestione Dipendenti (In Corso)
- [ ] CRUD Dipendenti completo
- [ ] Gestione documenti con upload
- [ ] Gestione Aziende/Sedi
- [ ] Autenticazione avanzata con ruoli

### ⏳ Sprint 3 - Presenze e Turni (Pianificato)
- [ ] Registro presenze
- [ ] Gestione turni
- [ ] Calcolo ore lavorate

### ⏳ Sprint 4 - Buste Paga e Report (Pianificato)
- [ ] Calcolo buste paga
- [ ] Generazione PDF cedolini
- [ ] Report avanzati

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
