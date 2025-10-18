# Architettura PayCrew - Diagramma e Componenti

## Architettura Generale

```mermaid
graph TB
    subgraph "Frontend (Next.js)"
        A[App Router] --> B[Pages]
        A --> C[Components]
        A --> D[API Routes]
        C --> E[shadcn/ui]
        C --> F[Custom Components]
    end
    
    subgraph "Backend (Supabase)"
        G[PostgreSQL Database]
        H[Authentication]
        I[Storage]
        J[Realtime]
    end
    
    subgraph "ORM & Tools"
        K[Prisma]
        L[React Hook Form + Zod]
        M[jsPDF]
        N[Recharts]
    end
    
    D --> G
    D --> H
    D --> I
    K --> G
    B --> H
    F --> I
    
    A --> K
    B --> L
    B --> M
    B --> N
```

## Database Schema Architecture

```mermaid
erDiagram
    Azienda {
        string id PK
        string nome
        string partitaIva UK
        string codiceFiscale
        string indirizzo
        string citta
        string cap
        string telefono
        string email
        datetime createdAt
        datetime updatedAt
    }
    
    User {
        string id PK
        string email UK
        string name
        enum role
        string aziendaId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Sede {
        string id PK
        string nome
        string indirizzo
        string citta
        string aziendaId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Dipendente {
        string id PK
        string nome
        string cognome
        string codiceFiscale UK
        date dataNascita
        string luogoNascita
        string indirizzo
        string citta
        string cap
        string telefono
        string email
        string iban
        date dataAssunzione
        enum tipoContratto
        enum ccnl
        string livello
        decimal retribuzione
        int oreSettimanali
        string aziendaId FK
        string sedeId FK
        boolean attivo
        date dataCessazione
        datetime createdAt
        datetime updatedAt
    }
    
    Documento {
        string id PK
        enum tipo
        string numero
        date dataRilascio
        date dataScadenza
        string storagePath
        string fileName
        int fileSize
        string mimeType
        string dipendenteId FK
        datetime createdAt
    }
    
    Presenza {
        string id PK
        date data
        datetime entrata
        datetime uscita
        decimal oreLavorate
        decimal oreStraordinario
        string nota
        string dipendenteId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Turno {
        string id PK
        date data
        string oraInizio
        string oraFine
        enum tipoTurno
        string dipendenteId FK
        string sedeId FK
        datetime createdAt
    }
    
    FeriePermessi {
        string id PK
        enum tipo
        date dataInizio
        date dataFine
        int giorni
        enum stato
        string motivazione
        string dipendenteId FK
        datetime createdAt
        datetime updatedAt
    }
    
    BustaPaga {
        string id PK
        int mese
        int anno
        decimal retribuzioneLorda
        decimal straordinari
        decimal altreCompetenze
        decimal totaleLordo
        decimal contributiINPS
        decimal irpef
        decimal altreRitenute
        decimal totaleRitenute
        decimal netto
        decimal tfr
        decimal oreLavorate
        decimal oreStraordinario
        string storagePath
        string dipendenteId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Azienda ||--o{ User : "ha"
    Azienda ||--o{ Sede : "ha"
    Azienda ||--o{ Dipendente : "impiega"
    Sede ||--o{ Dipendente : "assegna"
    Sede ||--o{ Turno : "programma"
    Dipendente ||--o{ Documento : "possiede"
    Dipendente ||--o{ Presenza : "registra"
    Dipendente ||--o{ Turno : "lavora"
    Dipendente ||--o{ FeriePermessi : "richiede"
    Dipendente ||--o{ BustaPaga : "riceve"
```

## User Flow Architecture

```mermaid
flowchart TD
    A[Utente non autenticato] --> B{Login/Register}
    B --> C[Dashboard]
    C --> D[Gestione Dipendenti]
    C --> E[Presenze]
    C --> F[Turni]
    C --> G[Buste Paga]
    C --> H[Report]
    
    D --> D1[Lista Dipendenti]
    D --> D2[Nuovo Dipendente]
    D --> D3[Dettaglio Dipendente]
    D2 --> D4[Upload Documenti]
    
    E --> E1[Registro Presenze]
    E --> E2[Inserimento Manuale]
    E --> E3[Calcolo Ore]
    
    F --> F1[Calendario Turni]
    F --> F2[Assegnazione Turni]
    F --> F3[Storico Turni]
    
    G --> G1[Lista Buste Paga]
    G --> G2[Calcolo Busta Paga]
    G --> G3[Generazione PDF]
    G3 --> G4[Upload Storage]
    
    H --> H1[Report Dipendenti]
    H --> H2[Report Presenze]
    H --> H3[Report Buste Paga]
    H --> H4[Analytics]
```

## Component Architecture

```mermaid
graph TB
    subgraph "Layout Components"
        A[AppLayout]
        B[DashboardLayout]
        C[AuthLayout]
        D[Sidebar]
        E[Header]
    end
    
    subgraph "Auth Components"
        F[LoginForm]
        G[RegisterForm]
        H[ProtectedRoute]
        I[UserMenu]
    end
    
    subgraph "Dipendenti Components"
        J[DipendentiList]
        K[DipendenteForm]
        L[DipendenteDetail]
        M[DocumentUpload]
        N[DocumentList]
    end
    
    subgraph "Presenze Components"
        O[PresenzeList]
        P[PresenzaForm]
        Q[CalendarioPresenze]
        R[OreCalculator]
    end
    
    subgraph "Buste Paga Components"
        S[BustePagaList]
        T[BustaPagaCalculator]
        U[PDFViewer]
        V[PDFGenerator]
    end
    
    subgraph "Shared Components"
        W[DataTable]
        X[SearchFilter]
        Y[DateRangePicker]
        Z[ExportButton]
    end
    
    A --> D
    A --> E
    B --> D
    B --> E
    C --> F
    C --> G
    
    J --> W
    J --> X
    K --> W
    O --> Q
    O --> R
    S --> Y
    S --> Z
```

## Security Architecture

```mermaid
graph LR
    subgraph "Authentication Layer"
        A[Supabase Auth]
        B[JWT Tokens]
        C[Session Management]
    end
    
    subgraph "Authorization Layer"
        D[Row Level Security]
        E[User Roles]
        F[Company Isolation]
    end
    
    subgraph "Data Protection"
        G[Encrypted Storage]
        H[Secure File Upload]
        I[API Rate Limiting]
    end
    
    A --> D
    B --> E
    C --> F
    D --> G
    E --> H
    F --> I
```

## Performance Architecture

```mermaid
graph TB
    subgraph "Frontend Optimization"
        A[Code Splitting]
        B[Lazy Loading]
        C[Image Optimization]
        D[Caching Strategy]
    end
    
    subgraph "Backend Optimization"
        E[Connection Pooling]
        F[Database Indexing]
        G[Query Optimization]
        H[CDN Integration]
    end
    
    subgraph "Monitoring"
        I[Performance Metrics]
        J[Error Tracking]
        K[User Analytics]
    end
    
    A --> E
    B --> F
    C --> G
    D --> H
    E --> I
    F --> J
    G --> K
```

## Deployment Architecture

```mermaid
graph LR
    subgraph "Development"
        A[Local Development]
        B[Database Local]
        C[Testing Environment]
    end
    
    subgraph "Staging"
        D[Staging Server]
        E[Staging Database]
        F[CI/CD Pipeline]
    end
    
    subgraph "Production"
        G[Vercel Deployment]
        H[Supabase Production]
        I[Monitoring & Alerts]
    end
    
    A --> D
    B --> E
    C --> F
    D --> G
    E --> H
    F --> I
```

## Technology Stack Details

### Frontend Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form + Zod
- **State Management**: React Context + Zustand
- **Data Fetching**: Native fetch + React Suspense
- **Charts**: Recharts
- **Tables**: TanStack Table
- **PDF Generation**: jsPDF

### Backend Stack
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Realtime**: Supabase Realtime
- **ORM**: Prisma
- **API**: Next.js API Routes

### Development Tools
- **Package Manager**: npm
- **Code Quality**: ESLint + Prettier
- **Testing**: Jest + React Testing Library
- **Type Checking**: TypeScript
- **Build Tool**: Turbopack
- **Version Control**: Git

Questa architettura fornisce una base solida e scalabile per PayCrew, con separazione chiara delle responsabilità e best practices per sicurezza e performance.