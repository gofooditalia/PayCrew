# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PayCrew is a modern web application for managing employees and payroll, primarily optimized for the restaurant sector. It's a full-stack Next.js 15 application using Supabase for backend services and Prisma as the ORM.

**Stack**: Next.js 15 (App Router), TypeScript, Supabase (PostgreSQL), Prisma, Tailwind CSS, shadcn/ui

## Essential Commands

### Development
```bash
npm run dev              # Start development server (localhost:3000)
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
```

### Database Operations
```bash
npm run db:generate      # Generate Prisma client (runs automatically after npm install)
npm run db:push          # Push schema changes to database
npm run db:migrate       # Create and run migrations
npm run db:studio        # Open Prisma Studio (GUI for database)
npm run db:reset         # Reset database (WARNING: destructive)
npm run verify:deployment # Verify Prisma deployment setup
```

## Architecture

### Database & Data Layer

**Multi-tenant Architecture**: The application uses Row Level Security (RLS) policies to isolate data by company (`aziendaId`). Most operations must include proper company context.

**Key Models**:
- `users` - System users with roles (SUPER_ADMIN, ADMIN, MANAGER, USER)
- `aziende` - Companies (tenants)
- `sedi` - Company locations/branches
- `dipendenti` - Employees (the core entity)
- `presenze` - Attendance records with calculated hours
- `turni` - Shift schedules
- `buste_paga` - Payroll records with PDF generation
- `documenti` - Employee documents stored in Supabase Storage
- `attivita` - Activity log for audit trail

**Prisma Client**: Located in `src/lib/prisma.ts` with custom connection pooling configuration. Uses `DATABASE_URL` with pooler parameters and disables prepared statements for Vercel compatibility.

**Critical**: When working with Prisma queries:
- The client includes extensive error handling for connection issues
- Helper functions `safePrismaQuery()` and `isDatabaseReachable()` are available
- Prepared statement conflicts are handled automatically
- Use `$queryRawUnsafe` for enum casting in complex queries (see `attivita-logger.ts`)

### Authentication & Authorization

**Supabase Auth** with cookie-based sessions:
- Client creation: `src/lib/supabase/client.ts` (client components)
- Server creation: `src/lib/supabase/server.ts` (server components, API routes)
- Middleware: `src/lib/supabase/middleware.ts` (route protection)

**User Roles**:
- SUPER_ADMIN: Full system access
- ADMIN: Company-level administration
- MANAGER: Department/location management
- USER: Limited access

### Activity Logging System

**AttivitaLogger** (`src/lib/attivita-logger.ts`) - Centralized audit logging:
- Logs all CRUD operations on main entities
- Uses raw SQL queries with explicit enum casting for Vercel compatibility
- Includes retry logic and monitoring via `AttivitaMonitor`
- Never throws errors to avoid blocking main operations

**Usage Pattern**:
```typescript
await AttivitaLogger.logCreazioneDipendente(dipendente, userId, aziendaId)
```

Available methods: `logCreazioneDipendente`, `logModificaDipendente`, `logEliminazioneDipendente`, `logRegistrazionePresenza`, etc.

### File Structure

```
src/
├── app/
│   ├── (auth)/              # Auth pages (login, signup)
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── dashboard/       # Main dashboard with stats
│   │   ├── dipendenti/      # Employee management
│   │   ├── presenze/        # Attendance tracking
│   │   ├── azienda/         # Company settings
│   │   ├── buste-paga/      # Payroll
│   │   └── report/          # Reports
│   └── api/                 # API route handlers
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── shared/              # Sidebar, Header, Layout
│   ├── dipendenti/          # Employee-specific components
│   ├── presenze/            # Attendance components
│   └── attivita/            # Activity log components
├── lib/
│   ├── supabase/            # Supabase client utilities
│   ├── validation/          # Zod validators
│   ├── utils/               # Utility functions (currency, hours calculator)
│   ├── prisma.ts            # Prisma client with connection handling
│   ├── attivita-logger.ts   # Activity logging system
│   └── attivita-monitor.ts  # Performance monitoring
└── types/                   # TypeScript type definitions
```

### API Routes Pattern

API routes follow REST conventions and include:
- Authentication checks via Supabase
- Company-level data isolation
- Activity logging for audit trail
- Proper error handling

Example pattern (see `src/app/api/dipendenti/route.ts`):
```typescript
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // ... validation, Prisma operation, activity logging
}
```

### Form Validation

**Zod schemas** in `src/lib/validation/`:
- `attivita-validator.ts` - Activity log validation
- `presenze-validator.ts` - Attendance validation

**React Hook Form** with Zod resolvers for all forms.

### Styling

- **Tailwind CSS** with custom configuration
- **shadcn/ui** components (installed via `npx shadcn@latest add [component]`)
- Path alias: `@/*` maps to `src/*`
- Responsive design with mobile-first approach

## Important Technical Details

### Enum Handling with Prisma

When inserting data with enum fields via raw SQL, explicitly cast to the enum type:
```sql
$1::tipo_attivita  -- Cast parameter to enum
$2::uuid           -- Cast to UUID
```

### Decimal to Number Conversion

Prisma returns `Decimal` types for numeric fields. Convert to numbers before passing to components:
```typescript
oreLavorate: presenza.oreLavorate ? Number(presenza.oreLavorate) : 0
```

### Supabase Storage

Storage buckets: `documenti-dipendenti`, `cedolini`
- Configure RLS policies in Supabase dashboard
- File uploads handled via Supabase client
- Storage paths tracked in database

### Connection Pooling

The Prisma client uses connection pooling with:
- `connection_limit=1` and `pgbouncer=true` parameters
- Disabled prepared statements for serverless compatibility
- Automatic reconnection on failure

### Error Handling Philosophy

- Database operations use `safePrismaQuery()` for graceful degradation
- Activity logging never blocks main operations (catch and log errors)
- Connection issues are logged but don't crash the app

## Development Workflow

1. **Database changes**:
   - Modify `prisma/schema.prisma`
   - Run `npm run db:push` (development) or `npm run db:migrate` (production)
   - Prisma client regenerates automatically

2. **Adding UI components**:
   - Use shadcn: `npx shadcn@latest add [component-name]`
   - Components install to `src/components/ui/`

3. **Creating new features**:
   - Add route in `src/app/(dashboard)/[feature]/`
   - Create API route in `src/app/api/[feature]/route.ts`
   - Add components in `src/components/[feature]/`
   - Update sidebar in `src/components/shared/sidebar.tsx`
   - Add activity logging if needed

## Current Development Status

### ✅ Sprint 1-2 Complete
- Foundation (Next.js 16, Supabase, Prisma setup)
- Authentication system with roles (SUPER_ADMIN, ADMIN, MANAGER, USER)
- Company management (CRUD aziende)
- Employee CRUD (gestione completa dipendenti)

### ✅ Sprint 3 - Partially Complete
**Attendance Tracking** ✅
- Attendance list page with filtering and search
- Presence registration with automatic hour calculation
- Note column with popover display in attendance list
- Manual entry and edit of attendance records
- Integration with activity logging system

**Branch/Location Management** ✅ (Added)
- Complete CRUD for company locations (sedi)
- Integrated into Company Profile page
- Employee-to-location assignment
- Location display in employee list and detail pages
- Validation to prevent deletion of locations with assigned employees

**UX Improvements** ✅
- Redirect to employee list after save/update
- Reorganized employee table columns for better readability
- Contract column consolidates: contract type, hire date, and weekly hours
- Employee column streamlined to show: name, location (if assigned)

**Shift Management** ❌ (NOT Implemented - Moved to Sprint 4)
- Database schema exists (turni table) but no frontend implementation

### 🔄 Sprint 4 (Next - In Planning)
**Shift Management** (From Sprint 3 - Not Yet Implemented)
- Shift scheduling interface
- Weekly shift planning and calendar view
- Shift templates and recurring schedules
- Employee shift assignment
- Integration with attendance tracking

**Payroll System**
- Payroll calculations engine
- Monthly payslip generation
- PDF generation for payslips (cedolini)
- Payroll history and reports

## Common Pitfalls

1. **RLS Policies**: Always include `aziendaId` filter in queries for models with RLS
2. **Async Cookies**: In Next.js 15+, always await `cookies()` call
3. **Enum Casting**: Use explicit casting in raw SQL queries with enums
4. **Decimal Types**: Convert Prisma Decimal to Number for JSON serialization
5. **Activity Logging**: Use the centralized `AttivitaLogger` class, never direct Prisma inserts

## Environment Variables

Required variables (see `.env` file):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `DATABASE_URL` - PostgreSQL connection string (with pooler)
- `DIRECT_URL` - Direct PostgreSQL connection (for migrations)
