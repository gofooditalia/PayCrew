# Piano di Integrazione shadcn/ui Completo

## 🎯 Obiettivo
Risolvere le incoerenze grafiche nell'applicazione PayCrew standardizzando tutti i componenti UI secondo gli standard shadcn/ui.

## 📊 Analisi Problemi Identificati

### 1. Colori Hardcoded vs Variabili shadcn/ui
**Problema critico**: Molti componenti usano colori Tailwind diretti invece delle variabili CSS

**Esempi trovati**:
- `text-gray-700` → dovrebbe essere `text-foreground`
- `border-gray-300` → dovrebbe essere `border-input`  
- `bg-gray-50` → dovrebbe essere `bg-background`
- `text-indigo-600` → dovrebbe essere `text-primary`
- `focus:ring-indigo-500` → dovrebbe essere `focus:ring-primary`

### 2. Componenti shadcn/ui Mancanti
Componenti fondamentali non implementati:
- ❌ Input (base per tutti i form)
- ❌ Select (per dropdown)
- ❌ Textarea (per testi lunghi)
- ❌ Label (per etichette form)
- ❌ Checkbox (per opzioni booleane)

### 3. Incoerenza nei Form
Ogni form implementa stili diversi:
- Stati focus non standardizzati
- Colori errore inconsistenti
- Spacing e layout non uniformi

## 🛠️ Piano di Implementazione

### Fase 1: Creazione Componenti Base
1. **Input Component** (`src/components/ui/input.tsx`)
   - Supporta tutti i tipi (text, email, tel, number, date)
   - Varianti: default, error, disabled
   - Stati: focus, hover, disabled

2. **Select Component** (`src/components/ui/select.tsx`)
   - Dropdown standardizzato
   - Supporto per placeholder e disabled
   - Stile coerente con Input

3. **Textarea Component** (`src/components/ui/textarea.tsx`)
   - Per testi multi-linea
   - Auto-resize opzionale
   - Stati coerenti

4. **Label Component** (`src/components/ui/label.tsx`)
   - Etichette accessibili
   - Associazione con input
   - Stili standardizzati

### Fase 2: Migrazione Form Esistenti
1. **Dipendente Form** - Priorità alta
   - Sostituire tutti gli input hardcoded
   - Applicare variabili shadcn/ui
   - Standardizzare stati errore/successo

2. **Azienda Form** 
   - Migrazione completa degli stili
   - Applicare nuovi componenti

3. **Auth Forms** (Login/Register)
   - Aggiornare per coerenza visiva

### Fase 3: Sistemazione Design Tokens
1. **CSS Variables Complete**
   - Verificare tutte le variabili definite
   - Aggiungere eventuali token mancanti
   - Documentare palette completa

2. **Utility Classes**
   - Classi per stati comuni (error, success, warning)
   - Utility per spacing coerente
   - Classi responsive standard

### Fase 4: Test e Validazione
1. **Test Visivo**
   - Verificare coerenza in tutte le pagine
   - Testare stati hover/focus/disabled
   - Validare accessibilità

2. **Test Cross-browser**
   - Chrome, Firefox, Safari
   - Mobile e desktop
   - Diverse risoluzioni

## 📁 File da Modificare

### Componenti da Creare
- `src/components/ui/input.tsx`
- `src/components/ui/select.tsx` 
- `src/components/ui/textarea.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/checkbox.tsx`

### Componenti da Migrare
- `src/components/dipendenti/dipendente-form.tsx` 🚨
- `src/app/(no-company)/azienda/crea/page.tsx`
- `src/app/(dashboard)/azienda/modifica/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`

### File di Configurazione
- `src/app/globals.css` - Aggiungere utility mancanti
- `tailwind.config.js` - Verificare completezza

## 🎨 Design System Reference

### Colori Corretti
```css
/* Invece di */
text-gray-700 → text-foreground
border-gray-300 → border-input
bg-gray-50 → bg-background
text-indigo-600 → text-primary
focus:ring-indigo-500 → focus:ring-primary

/* Stati */
bg-red-50 → bg-destructive/10
border-red-200 → border-destructive/20
text-red-600 → text-destructive
```

### Spacing Standard
```css
/* Form */
space-y-6 → gap-6 (per grid)
space-y-4 → gap-4 (per card content)

/* Input */
px-3 py-2 → px-3 py-2 (mantenere)
border-gray-300 → border-input
focus:ring-indigo-500 → focus:ring-2 focus:ring-primary
```

## ✅ Success Criteria

1. **Nessun colore hardcoded** in tutti i componenti UI
2. **Componenti form standardizzati** e riutilizzabili
3. **Coerenza visiva** in tutta l'applicazione
4. **Accessibilità WCAG AA** per tutti gli stati
5. **Performance mantenuta** o migliorata

## 🚀 Next Steps

1. Implementare componenti base mancanti
2. Migrare form dipendenti come esempio
3. Applicare migrazione agli altri form
4. Testare e validare il risultato
5. Documentare linee guida per sviluppo futuro

---

*Questo piano garantirà una coerenza visiva completa e un'esperienza utente professionale in tutta l'applicazione PayCrew.*