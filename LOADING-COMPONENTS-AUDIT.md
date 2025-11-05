# Audit Loading Components - PayCrew

**Data**: 2025-11-05
**Scopo**: Identificare e unificare i componenti di loading per consistenza UX

## 📊 Stato Attuale

### Pattern Identificati

#### 1. **Spinner Centrato con Testo** (Più Comune)
**Usato in**:
- `app/(dashboard)/dipendenti/[id]/page.tsx:87-96`
- `app/(dashboard)/dipendenti/[id]/modifica/page.tsx:194-203`
- `app/(dashboard)/azienda/modifica/page.tsx:121-130`
- `app/(dashboard)/loading.tsx:1-17`

**Codice**:
```tsx
<div className="flex items-center justify-center min-h-screen">
  <div className="text-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
    <p className="mt-4 text-gray-600">Caricamento dati...</p>
  </div>
</div>
```

**Varianti**:
- `border-indigo-600` (dipendenti)
- `border-primary` (loading.tsx)

#### 2. **Skeleton Loading** (Nuovo, Miglior Pratica)
**Usato in**:
- `components/attivita/attivita-recenti.tsx:116-144`
- `components/presenze/presenze-list.tsx:44-99`

**Codice**:
```tsx
<Skeleton className="h-5 w-32" />
```

#### 3. **Inline Loader in Componenti Lista**
**Usato in**:
- Pulsanti con `isLoading` (varie pagine)
- Stati di submit form

#### 4. **Next.js Loading UI**
**File**: `app/(dashboard)/loading.tsx`
- Loader globale per transizioni di route
- Usato automaticamente da Next.js durante navigazione

---

## 🔴 Problemi Identificati

### Inconsistenze

1. **Colori Diversi**:
   - `border-indigo-600` vs `border-primary`
   - Alcuni usano classi hardcoded invece di theme variables

2. **Messaggi Non Uniformi**:
   - "Caricamento dati dipendente..."
   - "Caricamento Dashboard..."
   - "Caricamento dati..."
   - Alcuni in italiano, nessuna localizzazione

3. **Struttura HTML Duplicata**:
   - Stesso codice ripetuto in 4+ file
   - Difficile manutenzione
   - Nessun componente riutilizzabile

4. **Misto Spinner + Skeleton**:
   - Alcune pagine usano spinner
   - Altre usano skeleton
   - Nessuna linea guida chiara

5. **Sizing Inconsistente**:
   - `h-12 w-12` (più comune)
   - Nessuna standardizzazione

---

## 📋 Pagine Analizzate

| Pagina | Loading State | Tipo | Note |
|--------|---------------|------|------|
| `/dashboard` | SSR + AttivitaRecenti skeleton | Skeleton | ✅ Ottimo |
| `/dipendenti` | SSR (server component) | N/A | ✅ No loading needed |
| `/dipendenti/[id]` | Spinner centrato | Spinner | ⚠️ Inconsistente |
| `/dipendenti/[id]/modifica` | Spinner centrato | Spinner | ⚠️ Inconsistente |
| `/dipendenti/nuovo` | Form loading inline | Inline | ✅ OK |
| `/presenze` | Skeleton table | Skeleton | ✅ Ottimo |
| `/turni` | Custom state | Inline | ⚠️ Verificare |
| `/cedolini` | Custom state | Inline | ⚠️ Verificare |
| `/buste-paga` | N/A | N/A | ⚠️ Verificare |
| `/azienda` | SSR | N/A | ✅ OK |
| `/azienda/modifica` | Spinner centrato | Spinner | ⚠️ Inconsistente |
| `/report` | N/A | N/A | ⚠️ Verificare |

**Legenda**:
- ✅ = Implementazione corretta
- ⚠️ = Necessita standardizzazione
- ❌ = Problematico

---

## 🎯 Raccomandazioni

### Strategia di Unificazione

#### 1. **Per Pagine Complete** (Full-Page Loader)
**Usare**: Componente unificato `PageLoader`

**Casi d'uso**:
- Caricamento iniziale dati
- Fetch di dettagli dipendente
- Stati di navigazione

**Design**: Spinner centrato con messaggio optional

#### 2. **Per Liste e Tabelle** (Content Loader)
**Usare**: Skeleton components

**Casi d'uso**:
- Liste presenze
- Tabelle dipendenti
- Dashboard cards
- Attività recenti

**Design**: Skeleton che replica layout esatto

#### 3. **Per Form e Azioni** (Inline Loader)
**Usare**: Button loading state

**Casi d'uso**:
- Submit form
- Eliminazioni
- Azioni CRUD

**Design**: Spinner + disabled state nel button

#### 4. **Per Navigazione** (Route Transition)
**Usare**: Next.js `loading.tsx`

**Casi d'uso**:
- Transizioni tra route
- Cambio pagina

**Design**: Minimale, veloce

---

## 💡 Proposta: Componenti Unificati

### 1. `<PageLoader>`
```tsx
<PageLoader message="Caricamento..." />
```
- Spinner centrato full-screen
- Messaggio personalizzabile
- Colori da theme
- Size consistente

### 2. Skeleton Components (già esistenti)
```tsx
<DashboardStatsSkeleton />
<PresenzeListSkeleton />
<TableSkeleton />
```
- Già implementati
- Da preferire per liste/tabelle

### 3. `<InlineLoader>`
```tsx
<Button disabled={loading}>
  {loading && <InlineLoader />}
  Salva
</Button>
```
- Per button e inline actions
- Piccolo spinner

### 4. Loading UI Global
```tsx
// app/(dashboard)/loading.tsx
export default function Loading() {
  return <PageLoader message="Caricamento..." />
}
```

---

## 🛠️ Piano di Implementazione

### Fase 1: Creare Componenti Unificati ✅
- [x] `PageLoader` component
- [x] `InlineLoader` component
- [x] Esportare da `@/components/loading`

### Fase 2: Refactoring Pagine 🔄
- [ ] Sostituire spinner in `/dipendenti/[id]`
- [ ] Sostituire spinner in `/dipendenti/[id]/modifica`
- [ ] Sostituire spinner in `/azienda/modifica`
- [ ] Aggiornare `loading.tsx` globale

### Fase 3: Documentazione 📚
- [ ] Aggiungere esempi a README skeleton
- [ ] Guidelines per quando usare cosa
- [ ] Storybook (opzionale)

### Fase 4: Testing ✅
- [ ] Visual testing con network throttling
- [ ] Verificare consistenza su tutte le pagine
- [ ] Build verification

---

## 📐 Design System

### Colori
- **Spinner**: `border-primary` (usa theme)
- **Background**: `bg-background`
- **Testo**: `text-muted-foreground`

### Sizing
- **Spinner Full Page**: `h-12 w-12`
- **Spinner Inline**: `h-4 w-4`
- **Border**: `border-b-2`

### Animazioni
- **Spinner**: `animate-spin`
- **Skeleton**: `animate-pulse` (da shadcn)

### Spacing
- **Gap spinner-text**: `mb-4` o `mt-4`
- **Padding container**: `p-6` o `py-12`

---

## 🎨 Esempi Finali

### ✅ CORRETTO - Pagina Dettaglio
```tsx
'use client'

import { PageLoader } from '@/components/loading'

export default function DetailPage() {
  const [loading, setLoading] = useState(true)

  if (loading) {
    return <PageLoader message="Caricamento dettagli..." />
  }

  return <DetailContent />
}
```

### ✅ CORRETTO - Lista con Skeleton
```tsx
'use client'

import { DipendentiListSkeleton } from '@/components/skeletons'

export default function ListPage() {
  const [loading, setLoading] = useState(true)

  if (loading) {
    return <DipendentiListSkeleton rows={10} />
  }

  return <DipendentiList />
}
```

### ✅ CORRETTO - Button con Loading
```tsx
<Button disabled={isSubmitting}>
  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Salva
</Button>
```

### ❌ EVITARE - Codice Duplicato
```tsx
// NON FARE QUESTO
<div className="flex items-center justify-center min-h-screen">
  <div className="text-center">
    <div className="animate-spin..."></div>
    <p>Loading...</p>
  </div>
</div>
```

---

## 📊 Metriche di Successo

**Pre-unificazione**:
- ❌ 4 implementazioni diverse di spinner
- ❌ 3 varianti di colori
- ❌ Codice duplicato in 4+ file
- ❌ Nessuna guida chiara

**Post-unificazione** (Target):
- ✅ 1 componente `PageLoader` riutilizzabile
- ✅ Skeleton per liste/tabelle
- ✅ Colori consistenti da theme
- ✅ Zero duplicazione codice
- ✅ Documentazione chiara

---

## 🚀 Next Steps

1. ✅ Creare `PageLoader` component
2. ✅ Creare `InlineLoader` component
3. 🔄 Refactoring pagine (3 file)
4. 📚 Aggiornare documentazione
5. ✅ Testing e build verification

---

**Conclusione**: Attualmente abbiamo inconsistenze multiple. La soluzione è creare componenti unificati `PageLoader` e standardizzare l'uso di skeleton per liste/tabelle, mantenendo la coerenza visiva e riducendo la duplicazione del codice.
