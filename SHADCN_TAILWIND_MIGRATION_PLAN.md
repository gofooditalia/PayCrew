# Piano di Migrazione a shadcn/ui e Tailwind CSS v4

## Problemi Identificati

1. **Configurazione Tailwind CSS v4 non compatibile**: Uso di `@theme inline` invece di tailwind.config.js
2. **Tema scuro ancora attivo**: Sfondo grigio scuro prominente in dashboard e dipendenti
3. **Testo illeggibile**: Nome "PayCrew" e altri testi non leggibili nell'header
4. **Componenti shadcn/ui non standard**: Implementazione non conforme alle best practice
5. **Mancanza di configurazione tailwind.config.js**: File essenziale per shadcn/ui

## Piano di Migrazione

### Fase 1: Configurazione Tailwind CSS

1. **Creare tailwind.config.js** conforme a shadcn/ui
2. **Ristrutturare globals.css** per usare CSS variables standard
3. **Installare dipendenze mancanti** per shadcn/ui completo

### Fase 2: Implementazione Tema Chiaro

1. **Definire palette colori moderna** per tema chiaro
2. **Rimuovere riferimenti al tema scuro**
3. **Implementare CSS variables standard** per shadcn/ui

### Fase 3: Correzione Componenti

1. **Aggiornare header** per testo leggibile
2. **Correggere sidebar** per tema chiaro coerente
3. **Standardizzare tutti i componenti UI** secondo shadcn/ui

### Fase 4: Validazione e Test

1. **Testare leggibilità su tutti i dispositivi**
2. **Verificare coerenza visiva**
3. **Validare accessibilità WCAG AA**

## Dettagli Tecnici

### Configurazione Tailwind CSS v4

```javascript
// tailwind.config.js
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

### CSS Variables per Tema Chiaro

```css
/* globals.css */
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
```

### Componenti shadcn/ui Standard

Esempi di componenti corretti:

#### Button Component
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

### Correzione Header per Leggibilità

```tsx
// header.tsx corretto
export default function Header({ user, companyName }: HeaderProps) {
  // ... resto del codice
  
  return (
    <header className="bg-background border-b shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Company Name con contrasto corretto */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-foreground" title={companyName || 'PayCrew'}>
              {companyName || 'PayCrew'}
            </h1>
          </div>
          {/* ... resto del componente */}
        </div>
      </div>
    </header>
  )
}
```

## Dipendenze da Installare

```bash
npm install -D tailwindcss-animate
npm install class-variance-authority clsx tailwind-merge lucide-react
```

## Passi di Implementazione

1. **Backup dei file attuali**
2. **Creazione tailwind.config.js**
3. **Riscrittura globals.css**
4. **Aggiornamento componenti UI**
5. **Test e validazione**

## Risultato Atteso

- Tema chiaro coerente in tutta l'applicazione
- Testo perfettamente leggibile in tutti i contesti
- Componenti shadcn/ui standard e riutilizzabili
- Accessibilità WCAG AA compliant
- Design moderno e professionale

## Note Importanti

- Rimuovere completamente l'approccio `@theme inline`
- Usare solo CSS variables standard shadcn/ui
- Disabilitare completamente il tema scuro
- Testare su tutti i dispositivi e browser
- Validare contrasti colori per accessibilità