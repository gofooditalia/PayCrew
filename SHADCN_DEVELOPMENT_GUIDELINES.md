# Linee Guida Sviluppo shadcn/ui - PayCrew

## 🎯 Introduzione
Questo documento definisce le linee guida per lo sviluppo futuro dei componenti UI nell'applicazione PayCrew, garantendo coerenza e manutenibilità dopo l'integrazione completa di shadcn/ui.

## ✅ Principi Fondamentali

### 1. Usa Sempre Componenti shadcn/ui
**Obbligatorio**: Tutti i nuovi form devono utilizzare i componenti standardizzati:
- `Input` per campi testo, email, numero, data
- `Select` per dropdown e select
- `Textarea` per testi multi-linea
- `Label` per etichette form
- `Checkbox` per opzioni booleane
- `Button` per azioni principali
- `Card` per contenitori

### 2. Niente Colori Hardcoded
**Vietato**: Non utilizzare mai colori Tailwind diretti nei componenti UI.

**Correzioni obbligatorie**:
```css
/* Invece di questi */
text-gray-700 → text-foreground
border-gray-300 → border-input
bg-gray-50 → bg-background
text-indigo-600 → text-primary
focus:ring-indigo-500 → focus:ring-primary
bg-red-50 → bg-destructive/10
border-red-200 → border-destructive/20
text-red-600 → text-destructive
```

### 3. Variabili CSS Solo
Usa esclusivamente le variabili CSS definite in `globals.css`:
- `text-foreground`, `text-muted-foreground`
- `bg-background`, `bg-card`
- `border-input`, `border-border`
- `text-primary`, `text-primary-foreground`
- `focus:ring-primary`, `focus:ring-ring`

## 🏗️ Struttura Componenti

### Input Component
```tsx
// ✅ Corretto
<Input
  type="text"
  placeholder="Inserisci testo..."
  className="w-full"
/>

// ❌ Errato
<input
  className="w-full px-3 py-2 border-gray-300" // No!
/>
```

### Select Component
```tsx
// ✅ Corretto
<Select value={value} onChange={handleChange}>
  <option value="option1">Opzione 1</option>
  <option value="option2">Opzione 2</option>
</Select>

// ❌ Errato
<select className="border-gray-300"> // No!
```

### Form Structure
```tsx
// ✅ Corretto
<Card>
  <CardHeader>
    <CardTitle>Titolo Form</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div>
      <Label htmlFor="campo">Etichetta</Label>
      <Input id="campo" name="campo" />
    </div>
  </CardContent>
</Card>

// ❌ Errato
<div className="bg-gray-50"> // No!
```

## 🎨 Stati e Varianti

### Stati Input
```tsx
// Default
<Input />

// Con errore
<Input className="border-destructive focus:ring-destructive" />

// Disabilitato
<Input disabled />
```

### Varianti Button
```tsx
// Primario
<Button variant="default">Salva</Button>

// Secondario
<Button variant="outline">Annulla</Button>

// Distruttivo
<Button variant="destructive">Elimina</Button>

// Successo
<Button variant="success">Conferma</Button>
```

### Varianti Badge
```tsx
// Stati dipendente
<Badge variant="attivo">Attivo</Badge>
<Badge variant="ferie">In Ferie</Badge>
<Badge variant="part-time">Part-time</Badge>
<Badge variant="scaduto">Scaduto</Badge>
```

## 📱 Responsive Design

### Breakpoint Standard
```css
/* Mobile */
@media (max-width: 768px) { }

/* Tablet */
@media (min-width: 768px) and (max-width: 1024px) { }

/* Desktop */
@media (min-width: 1024px) { }
```

### Layout Form
```tsx
// Mobile - stack verticale
<div className="space-y-4">
  <Input />
  <Input />
</div>

// Desktop - griglia
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <Input />
  <Input />
</div>
```

## 🔧 Utilità e Helper

### Spacing Standard
```css
/* Form */
gap-4 /* spazio tra elementi form */
gap-6 /* spazio tra sezioni form */

/* Card */
space-y-4 /* spazio verticale in card */
space-y-6 /* spazio tra sezioni card */
```

### Classi Utility
```tsx
// Container
<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">

// Grid responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Flex layout
<div className="flex justify-between items-center">
```

## 🚀 Best Practices

### 1. Accessibilità
- Sempre usare `Label` con `htmlFor` associato all'input
- Stati focus visibili con `focus:ring-2`
- Contrasti WCAG AA compliant
- Navigazione da tastiera funzionante

### 2. Performance
- Componenti `forwardRef` per ottimizzazione
- Evitare re-render non necessari
- Usare `useMemo` per calcoli complessi

### 3. Manutenibilità
- Componenti piccoli e riutilizzabili
- Props tipizzate con TypeScript
- Documentazione con JSDoc

### 4. Coerenza
- Stili consistenti in tutta l'app
- Design tokens centralizzati
- Niente stili inline o hardcoded

## 📋 Checklist Sviluppo

Prima di committare un nuovo form o componente, verificare:

- [ ] Tutti gli input usano componente `Input`
- [ ] Tutte le select usano componente `Select`
- [ ] Tutte le label usano componente `Label`
- [ ] Nessun colore hardcoded presente
- [ ] Stati errore/successo usano variabili CSS
- [ ] Layout responsive implementato
- [ ] Accessibilità verificata

## 🔄 Processo di Review

### 1. Code Review
Ogni pull request che modifica componenti UI deve includere:
- Verifica coerenza stili
- Controllo colori hardcoded
- Test accessibilità
- Validazione responsive

### 2. Testing
- Test visivo su Chrome, Firefox, Safari
- Test funzionale su mobile e desktop
- Verifica performance con Lighthouse

## 📚 Riferimenti

### Documentazione
- Componenti shadcn/ui: `src/components/ui/`
- Variabili CSS: `src/app/globals.css`
- Esempi implementati: `src/components/dipendenti/dipendente-form.tsx`

### Tools
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com/docs
- WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref/

---

**Versione**: 1.0  
**Data**: 27/10/2025  
**Autore**: Team PayCrew  

*Queste linee guida garantiscono coerenza e qualità nel tempo per tutti i futuri sviluppi dei componenti UI in PayCrew.*