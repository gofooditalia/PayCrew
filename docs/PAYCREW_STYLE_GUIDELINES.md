# PayCrew - Linee Guida di Stile

## 🎨 Palette di Colori Ufficiale

### Colori Primari
```css
--primary: 217 91% 60%;           /* #3B82F6 - Blu principale */
--primary-dark: 217 77% 47%;        /* #1E40AF - Blu scuro */
--primary-light: 217 91% 95%;        /* #EFF6FF - Blu chiaro */
```

### Colori di Stato
```css
--success: 160 84% 39%;            /* #10B981 - Verde successo */
--warning: 38 92% 50%;             /* #F59E0B - Giallo attenzione */
--error: 0 84% 60%;                /* #EF4444 - Rosso errore */
--info: 188 94% 47%;               /* #0EA5E9 - Azzurro info */
```

### Colori Neutri
```css
--background: 0 0% 100%;            /* #FFFFFF - Bianco */
--foreground: 222.2 84% 4.9%;      /* #1E293B - Grigio scuro */
--muted: 210 40% 96%;              /* #F8FAFC - Grigio chiaro */
--border: 214.3 31.8% 91.4%;       /* #E2E8F0 - Bordo */
```

## 🎯 Componenti UI Standard

### Cards
```tsx
<Card className="animate-fade-in">
  <CardHeader>
    <CardTitle className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
      Titolo Card
    </CardTitle>
  </CardHeader>
  <CardContent>
    Contenuto della card
  </CardContent>
</Card>
```

### Buttons
```tsx
// Primario
<Button className="button-scale shadow-lg hover:shadow-xl">
  Azione Principale
</Button>

// Secondario
<Button variant="secondary" className="button-scale">
  Azione Secondaria
</Button>

// Stati
<Button variant="success" className="button-scale">
  Successo
</Button>
```

### Badge per Stati
```tsx
<Badge variant="attivo">Attivo</Badge>
<Badge variant="ferie">In Ferie</Badge>
<Badge variant="part-time">Part-time</Badge>
<Badge variant="scaduto">Scaduto</Badge>
```

## 🚀 Animazioni Standard

### Classi di Animazione
```css
.animate-fade-in     /* Apparizione graduale */
.animate-slide-up     /* Slide dal basso */
.animate-scale-in     /* Ingresso con scala */
.animate-pulse-glow  /* Effetto pulsante */
.button-scale        /* Scale al hover */
.table-row-hover     /* Hover righe tabella */
```

### Durate Standard
- **Hover effects**: 200ms
- **Transizioni complesse**: 300ms
- **Animazioni ingresso**: 500ms

### Curve di Animazione
```css
transition-all duration-200 ease-in-out  /* Standard */
transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)  /* Naturale */
```

## 🎨 Gradienti Utilizzati

### Gradienti Principali
```css
background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);  /* Primary */
background: linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%);  /* Card */
```

### Gradienti di Stato
```css
background: linear-gradient(135deg, #10B981 0%, #059669 100%);  /* Success */
background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);  /* Warning */
background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);  /* Error */
```

## 📱 Responsive Design

### Breakpoint Standard
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Pattern Responsive
```tsx
// Layout responsive
<div className="flex flex-col sm:flex-row gap-4">
  {/* Contenuto */}
</div>

// Testo responsive
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Titolo
</h1>
```

## 🎯 Icone e Emoji

### Icone Heroicons
```tsx
import { 
  UserGroupIcon,    // 👥 Dipendenti
  HomeIcon,         // 🏠 Dashboard
  ClockIcon,        // ⏰ Presenze
  CalendarIcon,      // 📅 Turni
  DocumentTextIcon, // 📄 Documenti
  ChartBarIcon      // 📊 Report
} from '@heroicons/react/24/outline'
```

### Emoji per UI
- 👥 Dipendenti
- 🏢 Azienda/Sede
- 📧 Email
- 📞 Telefono
- 📋 Contratto
- 💰 Retribuzione
- 📅 Data
- ✅ Attivo
- 🏖️ Ferie
- ⚠️ Attenzione

## 🔧 Best Practices

### Accessibilità
- Usare contrasti minimi di 4.5:1
- Fornire testo alternativo per icone
- Navigazione keyboard-friendly
- Focus states visivi chiari

### Performance
- Limitare animazioni complesse
- Usare transform invece di position changes
- Ottimizzare per 60fps
- Prefers-reduced-motion support

### Consistenza
- Mantenere spaziature coerenti
- Usare la stessa palette di colori
- Applicare stili uniformi
- Seguire gerarchia visiva

## 📁 Struttura File

### Componenti UI
```
src/components/ui/
├── badge.tsx          # Badge per stati
├── button.tsx         # Buttons con varianti
├── card.tsx           # Cards moderne
└── [altri componenti]
```

### Stili Globali
```
src/app/globals.css      # Variabili CSS e utility
tailwind.config.js       # Configurazione Tailwind
```

## 🚀 Sviluppo Futuro

### Estensioni Componenti
1. **Stats Cards**: Card con statistiche animate
2. **Progress Bars**: Barre di progresso personalizzate
3. **Charts**: Grafici interattivi
4. **Modals**: Dialoghi moderni
5. **Forms**: Form con validazione visiva

### Temi
- **Dark Mode**: Supporto tema scuro
- **High Contrast**: Tema ad alto contrasto
- **Custom Themes**: Personalizzazione brand

### Animazioni Avanzate
- **Page Transitions**: Transizioni tra pagine
- **Loading States**: Stati di caricamento
- **Micro-interactions**: Feedback dettagliati
- **Gesture Support**: Supporto touch gestures

---

**Versione**: 1.0.0
**Ultimo Aggiornamento**: 24 Ottobre 2024
**Maintainer**: PayCrew Development Team