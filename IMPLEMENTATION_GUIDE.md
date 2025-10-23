# Guida all'Implementazione Completa - shadcn/ui e Tema Chiaro

## Panoramica

Questa guida fornisce tutti i passaggi necessari per correggere i problemi di design e implementare correttamente shadcn/ui con un tema chiaro moderno e leggibile.

## Problemi da Risolvere

1. **Testo illeggibile nell'header**: Il nome "PayCrew" non è visibile
2. **Tema scuro prominente**: Sfondo grigio scuro in dashboard e dipendenti
3. **Configurazione Tailwind non standard**: Uso di @theme inline non compatibile con shadcn/ui
4. **Componenti non conformi**: Implementazione non standard di shadcn/ui

## Passo 1: Installazione Dipendenze

Eseguire questi comandi nella directory del progetto:

```bash
npm install -D tailwindcss-animate
npm install class-variance-authority clsx tailwind-merge lucide-react
```

## Passo 2: Creazione tailwind.config.js

Creare il file `tailwind.config.js` con questo contenuto:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

## Passo 3: Sostituzione Completa di globals.css

Sostituire completamente il contenuto di `src/app/globals.css` con:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Utility classes per miglioramenti specifici */
@layer utilities {
  .text-high-contrast {
    color: hsl(var(--foreground));
    font-weight: 600;
  }
  
  .background-clean {
    background-color: hsl(var(--background));
  }
  
  .card-clean {
    background-color: hsl(var(--card));
    border: 1px solid hsl(var(--border));
  }
}

/* Fix specifici per mobile */
@media (max-width: 768px) {
  .text-2xl {
    color: hsl(var(--foreground)) !important;
    font-weight: 700 !important;
  }
  
  .text-card-foreground {
    color: hsl(var(--card-foreground)) !important;
  }
  
  .text-muted-foreground {
    color: hsl(var(--muted-foreground)) !important;
  }
}
```

## Passo 4: Aggiornamento Componente Button

Sostituire il contenuto di `src/components/ui/button.tsx` con:

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-green-600 text-white hover:bg-green-700",
        warning: "bg-yellow-600 text-white hover:bg-yellow-700",
        info: "bg-blue-600 text-white hover:bg-blue-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

## Passo 5: Aggiornamento Componente Card

Sostituire il contenuto di `src/components/ui/card.tsx` con:

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

## Passo 6: Aggiornamento Componente Badge

Sostituire il contenuto di `src/components/ui/badge.tsx` con:

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-600 text-white hover:bg-green-700",
        warning: "border-transparent bg-yellow-600 text-white hover:bg-yellow-700",
        info: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, className }))} {...props} />
  )
}

export { Badge, badgeVariants }
```

## Passo 7: Correzione Critica dell'Header

Sostituire il contenuto di `src/components/shared/header.tsx` con:

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useSidebar } from '@/contexts/sidebar-context'
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'

interface HeaderProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      name?: string;
    };
  };
  companyName?: string;
}

export default function Header({ user, companyName }: HeaderProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { sidebarState, toggleSidebar } = useSidebar()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-background border-b shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Company Name and Burger Menu */}
          <div className="flex items-center">
            {/* Burger menu - visible when sidebar is open, hidden when collapsed */}
            {sidebarState !== 'collapsed' && (
              <button
                type="button"
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary mr-4 transition-colors duration-200"
                onClick={toggleSidebar}
                aria-label="Apri menu laterale"
              >
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
            )}
            
            {/* Company Name - CRITICAL FIX per leggibilità */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-foreground text-high-contrast" title={companyName || 'PayCrew'}>
                {companyName || 'PayCrew'}
              </h1>
            </div>
          </div>

          {/* Right side of header - Notifications and User */}
          <div className="flex items-center space-x-4 ml-4">
            {/* Notifications - Hidden on mobile, visible on desktop and tablet */}
            <button
              type="button"
              className="hidden sm:block p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
              aria-label="Notifiche"
            >
              <BellIcon className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                aria-label="Menu profilo utente"
                aria-expanded={profileMenuOpen}
                aria-haspopup="true"
              >
                <span className="sr-only">Apri menu utente</span>
                <UserCircleIcon className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors duration-200" aria-hidden="true" />
              </button>

              {profileMenuOpen && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-popover ring-1 ring-border divide-y divide-border focus:outline-none z-50 transition-all duration-200"
                  role="menu"
                >
                  <div className="px-4 py-3" role="none">
                    <p className="text-sm text-muted-foreground" role="none">Loggato come</p>
                    <p className="text-sm font-medium text-foreground truncate" role="none">
                      {user?.email}
                    </p>
                  </div>
                  <div className="py-1" role="none">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                      role="menuitem"
                    >
                      Esci
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
```

## Passo 8: Correzione Sidebar per Tema Chiaro

Sostituire il contenuto di `src/components/shared/sidebar.tsx` con:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/contexts/sidebar-context'
import {
  HomeIcon,
  UserGroupIcon,
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, enabled: true },
  { name: 'Dipendenti', href: '/dipendenti', icon: UserGroupIcon, enabled: true },
  { name: 'Presenze', href: '/presenze', icon: ClockIcon, enabled: false },
  { name: 'Turni', href: '/turni', icon: CalendarIcon, enabled: false },
  { name: 'Buste Paga', href: '/buste-paga', icon: DocumentTextIcon, enabled: false },
  { name: 'Report', href: '/report', icon: ChartBarIcon, enabled: false },
  { name: 'Impostazioni', href: '/impostazioni', icon: CogIcon, enabled: false },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { sidebarState, toggleSidebar } = useSidebar()

  return (
    <div className={`flex flex-col bg-background border-r border-border transition-all duration-300 ease-in-out ${
      sidebarState === 'open' ? 'w-64' : sidebarState === 'collapsed' ? 'w-16' : 'w-64'
    } ${
      sidebarState === 'closed' ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
    } fixed lg:relative h-full z-40`}>
      <div className="flex items-center h-16 px-4 bg-background border-b border-border justify-between">
        {sidebarState === 'open' && (
          <h1 className="text-xl font-bold text-foreground text-high-contrast">PayCrew</h1>
        )}
        {sidebarState === 'collapsed' && (
          <button
            type="button"
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors duration-200"
            onClick={toggleSidebar}
            aria-label="Espandi menu laterale"
          >
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1" role="navigation" aria-label="Navigazione principale">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
                           (item.href !== '/dashboard' && pathname.startsWith(item.href))
            
            if (item.enabled) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive
                      ? 'bg-accent text-foreground border-l-4 border-primary'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  } group flex items-center px-3 py-2 text-sm font-medium rounded-r-md transition-colors duration-150`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon
                    className={`${
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    } ${sidebarState === 'collapsed' ? 'h-6 w-6' : 'mr-3 h-5 w-5'} transition-colors duration-150`}
                    aria-hidden="true"
                  />
                  {sidebarState === 'open' && <span>{item.name}</span>}
                  {sidebarState === 'collapsed' && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg border border-border">
                      {item.name}
                    </div>
                  )}
                </Link>
              )
            } else {
              return (
                <div
                  key={item.name}
                  className="text-muted-foreground group flex items-center px-3 py-2 text-sm font-medium rounded-r-md cursor-not-allowed relative opacity-60"
                  role="button"
                  tabIndex={-1}
                  aria-disabled="true"
                >
                  <item.icon
                    className={`text-muted-foreground ${sidebarState === 'collapsed' ? 'h-6 w-6' : 'mr-3 h-5 w-5'}`}
                    aria-hidden="true"
                  />
                  {sidebarState === 'open' && (
                    <span className="flex items-center">
                      {item.name}
                      <span className="ml-2 text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                        Presto
                      </span>
                    </span>
                  )}
                  {sidebarState === 'collapsed' && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg border border-border">
                      <div className="flex flex-col">
                        <span>{item.name}</span>
                        <span className="text-xs text-muted-foreground mt-1">Presto disponibile</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            }
          })}
        </nav>
      </div>
    </div>
  )
}
```

## Passo 9: Aggiornamento Pagina Dashboard

Aggiornare `src/app/(dashboard)/dashboard/page.tsx` per utilizzare le classi corrette:

```tsx
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserGroupIcon, ClockIcon, DocumentTextIcon, CurrencyEuroIcon, PencilIcon } from '@heroicons/react/24/outline'
import { AttivitaRecenti } from '@/components/attivita/attivita-recenti'
import { formatCurrency } from '@/lib/utils/currency'
import Link from 'next/link'

// ... mantenere il resto del codice esistente ...

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="background-clean min-h-screen">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-high-contrast">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Benvenuto nel gestionale PayCrew</p>
        </div>
        <Link href="/azienda/modifica">
          <Button variant="outline" className="flex items-center">
            <PencilIcon className="h-4 w-4 mr-2" />
            Modifica Azienda
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="card-clean hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dipendenti Totali</CardTitle>
            <UserGroupIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground text-high-contrast">{stats.totalDipendenti}</div>
            <p className="text-sm text-muted-foreground">
              Dipendenti attivi
            </p>
          </CardContent>
        </Card>

        <Card className="card-clean hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Presenze Oggi</CardTitle>
            <ClockIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground text-high-contrast">{stats.presenzeOggi}</div>
            <p className="text-sm text-muted-foreground">
              Registrazioni odierna
            </p>
          </CardContent>
        </Card>

        <Card className="card-clean hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Buste Paga</CardTitle>
            <DocumentTextIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground text-high-contrast">{stats.bustePagaMese}</div>
            <p className="text-sm text-muted-foreground">
              Questo mese
            </p>
          </CardContent>
        </Card>

        <Card className="card-clean hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Massa Salariale</CardTitle>
            <CurrencyEuroIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground text-high-contrast">
              {formatCurrency(stats.totaleSalari)}
            </div>
            <p className="text-sm text-muted-foreground">
              Mensile
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-clean">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Azioni Rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/dipendenti/nuovo"
                className="p-4 border border-border rounded-lg hover:bg-accent transition-all duration-200"
              >
                <h3 className="font-medium text-foreground">Nuovo Dipendente</h3>
                <p className="text-sm text-muted-foreground mt-1">Aggiungi un nuovo dipendente</p>
              </Link>
              <Link
                href="/presenze"
                className="p-4 border border-border rounded-lg hover:bg-accent transition-all duration-200"
              >
                <h3 className="font-medium text-foreground">Registra Presenza</h3>
                <p className="text-sm text-muted-foreground mt-1">Inserisci presenza giornaliera</p>
              </Link>
              <Link
                href="/buste-paga"
                className="p-4 border border-border rounded-lg hover:bg-accent transition-all duration-200"
              >
                <h3 className="font-medium text-foreground">Genera Busta Paga</h3>
                <p className="text-sm text-muted-foreground mt-1">Crea nuovo cedolino</p>
              </Link>
              <Link
                href="/report"
                className="p-4 border border-border rounded-lg hover:bg-accent transition-all duration-200"
              >
                <h3 className="font-medium text-foreground">Visualizza Report</h3>
                <p className="text-sm text-muted-foreground mt-1">Analisi e statistiche</p>
              </Link>
            </div>
          </CardContent>
        </Card>

        <AttivitaRecenti limit={5} />
      </div>
    </div>
  )
}
```

## Passo 10: Aggiornamento Pagina Dipendenti

Aggiornare `src/app/(dashboard)/dipendenti/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DipendentiList from '@/components/dipendenti/dipendenti-list'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/24/outline'

// ... mantenere il resto del codice esistente ...

export default async function DipendentiPage() {
  const dipendenti = await getDipendenti()

  return (
    <div className="background-clean min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-high-contrast">Dipendenti</h1>
          <p className="text-muted-foreground">Gestisci l'anagrafica dei dipendenti</p>
        </div>
        <Link href="/dipendenti/nuovo">
          <Button className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            Nuovo Dipendente
          </Button>
        </Link>
      </div>

      <DipendentiList dipendenti={dipendenti} />
    </div>
  )
}
```

## Passo 11: Aggiornamento Componente DipendentiList

Aggiornare `src/components/dipendenti/dipendenti-list.tsx` per utilizzare le classi corrette:

```tsx
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/currency'

// ... mantenere le interfacce esistenti ...

export default function DipendentiList({ dipendenti }: DipendentiListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredDipendenti = dipendenti.filter(dipendente =>
    `${dipendente.nome} ${dipendente.cognome} ${dipendente.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // ... mantenere il resto del codice ...

  return (
    <Card className="card-clean">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg font-semibold text-foreground">Elenco Dipendenti ({dipendenti.length})</CardTitle>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-input rounded-md leading-5 bg-background placeholder-muted-foreground focus:outline-none focus:placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors duration-200"
              placeholder="Cerca dipendenti..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Cerca dipendenti"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredDipendenti.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm ? 'Nessun dipendente trovato per questa ricerca.' : 'Nessun dipendente registrato.'}
            </p>
            <Link href="/dipendenti/nuovo" className="mt-4 inline-block">
              <Button>Aggiungi il primo dipendente</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Dipendente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Contatti
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Contratto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Retribuzione
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Sede
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Azioni</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredDipendenti.map((dipendente) => (
                  <tr key={dipendente.id} className="hover:bg-muted/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-primary/10">
                          <span className="text-primary font-medium">
                            {dipendente.nome.charAt(0)}{dipendente.cognome.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-foreground text-high-contrast">
                            {dipendente.nome} {dipendente.cognome}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Assunto il {formatDate(dipendente.dataAssunzione)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{dipendente.email}</div>
                      {dipendente.telefono && (
                        <div className="text-sm text-muted-foreground">{dipendente.telefono}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{dipendente.tipoContratto}</div>
                      <div className="text-sm text-muted-foreground">Livello {dipendente.livello}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground text-high-contrast">
                        {currencyFormatter(dipendente.retribuzione)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {dipendente.sede?.nome || 'Non assegnato'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/dipendenti/${dipendente.id}`}>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label={`Visualizza ${dipendente.nome} ${dipendente.cognome}`}>
                            <EyeIcon className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </Link>
                        <Link href={`/dipendenti/${dipendente.id}/modifica`}>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label={`Modifica ${dipendente.nome} ${dipendente.cognome}`}>
                            <PencilIcon className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" aria-label={`Elimina ${dipendente.nome} ${dipendente.cognome}`}>
                          <TrashIcon className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

## Passo 12: Verifica e Test

Dopo aver completato tutti i passaggi:

1. **Riavviare il server di sviluppo**:
   ```bash
   npm run dev
   ```

2. **Verificare i seguenti punti**:
   - Il nome "PayCrew" nell'header è perfettamente leggibile
   - Lo sfondo è completamente bianco/tema chiaro
   - Tutti i testi hanno contrasto adeguato
   - Le card hanno sfondo bianco e bordi visibili
   - I pulsanti hanno colori corretti e leggibili
   - La sidebar è completamente a tema chiaro

3. **Testare su mobile**:
   - Verificare che tutti i testi siano leggibili
   - Controllare che i colori siano coerenti
   - Assicurarsi che non ci siano elementi scuri

## Risoluzione Problemi Comuni

### Se il testo non è ancora leggibile:
1. Verificare che le CSS variables siano caricate correttamente
2. Controllare nel browser inspector che i colori siano applicati
3. Assicurarsi che non ci siano stili CSS che sovrascrivono le classi

### Se il tema scuro è ancora visibile:
1. Verificare di aver rimosso completamente `@theme inline`
2. Controllare che non ci siano media query per tema scuro
3. Assicurarsi che le CSS variables siano corrette

### Se i componenti non funzionano:
1. Verificare che `tailwind.config.js` sia configurato correttamente
2. Controllare che le dipendenze siano installate
3. Riavviare il server di sviluppo

## Risultato Finale Atteso

- **Header**: Nome "PayCrew" perfettamente leggibile con contrasto ottimale
- **Background**: Completamente bianco/tema chiaro in tutte le pagine
- **Testi**: Tutti leggibili con contrasto WCAG AA compliant
- **Componenti**: Standard shadcn/ui con design moderno e coerente
- **Sidebar**: Tema chiaro coerente con il resto dell'applicazione
- **Mobile**: Esperienza ottimizzata con testi leggibili su tutti i dispositivi

Questa implementazione risolverà definitivamente tutti i problemi di design e leggibilità segnalati.