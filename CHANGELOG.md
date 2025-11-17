# Changelog

Tutte le modifiche importanti a questo progetto saranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e questo progetto aderisce al [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 📅 [0.8.0] - 2025-11-17 - Vista Calendario Turni

#### 🎯 Highlights
Implementazione completa della **Vista Calendario Turni** ispirata a Factorial, con griglia settimanale dipendente × giorno per gestione visuale e intuitiva dei turni.

#### Added
- **Vista Calendario Turni**: Nuova interfaccia `/turni/calendario`
  - Griglia dipendente × giorno con layout ispirato a Factorial
  - Navigazione settimanale/mensile con frecce prev/next
  - Bottone "Oggi" per tornare rapidamente alla settimana corrente
  - Switching tra vista settimana e vista mese (tabs)
- **Celle Turno Colorate**: Sistema di color-coding per tipo turno
  - Mattina: giallo (yellow-100/300)
  - Pranzo: arancione (orange-100/300)
  - Sera: blu (blue-100/300)
  - Full Time: viola (purple-100/300)
  - Spezzato: rosa (pink-100/300)
  - Notte: indigo (indigo-100/300)
- **Interattività Celle**:
  - Click su cella vuota: apre dialog creazione turno con dipendente e data pre-compilati
  - Click su turno esistente: apre dialog modifica con tutti i dati
  - Hover su turno: tooltip con dettagli (orari, pausa pranzo, ore totali calcolate)
- **Componenti Calendario**:
  - `CalendarioHeader`: navigazione mese, bottone oggi, tabs vista, link lista
  - `CalendarioGrid`: griglia principale con header giorni della settimana
  - `DipendenteRow`: riga dipendente con avatar iniziali e celle turni
  - `TurnoCell`: cella turno con colori, orari, tooltip dettagli
  - `CellaVuota`: cella cliccabile con simbolo "+" per nuovo turno
- **UX Enhancements**:
  - Avatar con iniziali dipendente per identificazione rapida
  - Evidenziazione giorno corrente (sfondo blu)
  - Evidenziazione weekend (sfondo grigio)
  - Legenda colori sempre visibile sopra griglia
  - Supporto turni multipli per stesso giorno/dipendente
  - Tooltip con calcolo ore totali automatico
- **Integrazione Form Turni**:
  - `TurnoFormDialog`: supporto pre-fill dipendente e data
  - Props `preFillDipendenteId` e `preFillData` per auto-compilazione
  - Auto-selezione sede dipendente quando pre-compilato
- **Link Bidirezionali**:
  - `/turni`: bottone "Vista Calendario" (CalendarDays icon)
  - `/turni/calendario`: bottone "Vista Lista" (List icon)

#### Changed
- **Calendario Page**:
  - Utilizzo `useMemo` per `giorni` per evitare re-render infiniti
  - Calcolo date inizio/fine interno a `caricaTurni` per stabilità dependencies
  - useEffect ottimizzato con dependencies corrette
- **Data Management**:
  - Calcolo range date basato su `currentDate` e `vistaAttiva`
  - Conversione date API in oggetti Date per consistenza
  - Mapping turni per data con chiave ISO string per performance
- **TurnoFormDialog**:
  - Reset form con valori pre-fill quando disponibili
  - Fallback a data corrente se nessun pre-fill
  - Gestione stato pre-fill separata da stato modifica

#### Technical Details
- **Performance**: Memoizzazione giorni con `useMemo` per evitare loop
- **Date Management**: Utilizzo date-fns per calcoli settimana/mese
- **Locale**: Formato italiano (it) per nomi giorni e mesi
- **Responsive**: Grid layout con colonna fissa dipendente (200px) + 7 colonne giorni
- **Tooltip**: shadcn/ui Tooltip component per dettagli turno
- **Avatar**: shadcn/ui Avatar component con fallback iniziali
- **Accessibility**: Click handlers su celle, hover states, cursor pointer

#### Files Changed
- NEW: `src/app/(dashboard)/turni/calendario/page.tsx` (354 righe)
- NEW: `src/app/(dashboard)/turni/calendario/_components/CalendarioHeader.tsx` (93 righe)
- NEW: `src/app/(dashboard)/turni/calendario/_components/CalendarioGrid.tsx` (116 righe)
- NEW: `src/app/(dashboard)/turni/calendario/_components/DipendenteRow.tsx` (96 righe)
- NEW: `src/app/(dashboard)/turni/calendario/_components/TurnoCell.tsx` (139 righe)
- MODIFIED: `src/app/(dashboard)/turni/page.tsx` (link vista calendario)
- MODIFIED: `src/components/turni/turno-form-dialog.tsx` (supporto pre-fill)

### 💰 [0.7.0] - 2025-11-13 - Gestione Pagamenti Mensili e UX Dipendenti

#### 🎯 Highlights
Implementazione completa del sistema di gestione pagamenti mensili organizzati per sede con focus su tracking bonus e bonifici, plus redesign sostanziale dell'UX gestione dipendenti.

#### Added
- **Sistema Pagamenti Mensili**: Nuova gestione pagamenti organizzata per mese/anno
  - Campo `mese` (Int) e `anno` (Int) in `pagamenti_dipendenti` table
  - Registrazione automatica al mese corrente
  - Filtri mese/anno con default al periodo corrente
  - Index database per ottimizzare query su mese/anno
- **Raggruppamento per Sede**: Vista dashboard aggregata per sede
  - Totali Bonus: Totale, Pagato, Residuo per sede
  - Totali Bonifici: Totale, Pagato, Residuo per sede
  - Card espandibili per visualizzare dettaglio dipendenti
  - Icona edificio per ogni sede
- **Storico Pagamenti**: Nuova pagina `/pagamenti/storico`
  - Comparazione mensile con statistiche aggregate
  - Progress bar per percentuale completamento
  - Link diretti al dettaglio mese specifico
  - Navigazione semplificata tra dashboard e storico
- **Dialog Pagamenti Separati**: Form specifici per tipo pagamento
  - `PagamentoBonusDialog`: focus su limite bonus e disponibile
    - Box verde con metriche bonus
    - Validazione contro limite bonus
    - Icona dollaro, pulsante verde "Registra Bonus"
  - `PagamentoBonificoDialog`: focus su limite bonifico + maggiorazione
    - Box blu con limite base, maggiorazione%, totale
    - Validazione contro limite bonifico totale
    - Icona banca, pulsante blu "Registra Bonifico"
  - Entrambi: auto-calcolo disponibile, validazioni dedicate
- **Campi Dipendenti Opzionali**: Maggiore flessibilità anagrafica
  - `codiceFiscale`, `dataNascita`, `tipoContratto`, `ccnl` → nullable
  - `retribuzione` (lorda) → nullable (campo di riferimento opzionale)
  - Validazione API aggiornata: solo nome, cognome, dataAssunzione obbligatori
  - Form aggiornati senza asterischi e attributi required
- **Accordion Component**: Nuovo componente UI da shadcn
  - File: `src/components/ui/accordion.tsx`
  - Utilizzo: scheda dettaglio dipendente con sezioni comprimibili
  - Animazioni smooth con Tailwind
- **Scheda Dipendente Redesign**: Layout compatto con accordion
  - Card riepilogo sempre visibile: Retribuzione Netta, Bonifico, Cash
  - 3 sezioni accordion: Informazioni Personali, Contatti, Contratto
  - Colori distintivi per sezioni (primary, blu, verde)
  - Campo retribuzione lorda spostato come dato secondario

#### Changed
- **Database Schema**:
  - `pagamenti_dipendenti`: aggiunti `mese Int @default(11)` e `anno Int @default(2025)`
  - `dipendenti`: reso nullable `codiceFiscale`, `dataNascita`, `tipoContratto`, `ccnl`, `retribuzione`
  - Aggiunto index: `@@index([mese, anno])` su pagamenti
- **API Pagamenti**:
  - `GET /api/pagamenti`: filtro su `mese` e `anno` invece di date range
  - `POST /api/pagamenti`: auto-set mese/anno dal timestamp corrente
  - Calcolo limiti separato per bonus e bonifici
- **API Dipendenti**:
  - `POST /api/dipendenti`: validazione ridotta, handle null per campi opzionali
  - `PUT /api/dipendenti/[id]`: handle null per campi opzionali
  - `GET /api/dipendenti`: conversione `retribuzione` nullable
  - Response mapping aggiornato per gestire null values
- **Form Dipendenti**:
  - `dipendente-form.tsx`: rimossi required attributes da campi opzionali
  - `[id]/modifica/page.tsx`: allineato a nuova struttura form
  - Calcolo automatico cash: formula corretta (retribuzioneBase + bonus - bonificoTotale)
  - Riepilogo calcolo riordinato: Netta Totale → Bonifico → Maggiorazione → Cash
- **Lista Dipendenti**:
  - Colonna "Retribuzione" → "Retribuzione Netta"
  - Visualizzazione: Netta, Bonifico, Cash invece di Retribuzione Lorda
  - Messaggio "Non configurato" per dipendenti senza retribuzione netta
- **UI Pagamenti**:
  - Due pulsanti separati "Registra Bonus" (verde) e "Registra Bonifico" (blu)
  - Pulsanti compatti: h-6, px-2, text-[10px], posizionati sotto importi
  - Icone SVG inline: dollaro cerchiato (bonus), edificio banca (bonifico)
  - Colori distintivi: green-600/700 (bonus), blue-600/700 (bonifici)

#### Fixed
- **Calcolo Bonus Dipendenti**: Formula corretta per considerare bonus nella retribuzione totale
  - Prima: `bonus = retribuzioneBase - bonificoTotale` (errato)
  - Ora: `bonus = (retribuzioneBase + bonus) - (bonifico + bonus)` (corretto)
  - Esempio: Base 1250 + Bonus 30 = 1280, poi 1280 - 780 = 500 (non 470)
- **Conversion Null Values**: Gestione corretta di `retribuzione` nullable in lista dipendenti
  - Check esistenza prima di `toString()` per evitare errori
  - Fallback a null invece di 0 per campi non compilati
- **Form Validation**: Allineamento tra schema Prisma, validazione API e attributi HTML
  - Rimossi required da campi resi opzionali nel database
  - Asterischi label rimossi per coerenza UI

#### Technical Details
- **Migration Database**: `npm run db:push` con default values per nuovi campi
- **Backward Compatibility**: Default mese=11, anno=2025 per record esistenti
- **Component Architecture**: Due dialog specializzati invece di uno generico
- **State Management**: Stati separati `dialogContantiOpen` e `dialogBonificoOpen`
- **Validation Strategy**: Validazione specifica per tipo pagamento nel dialog dedicato
- **UI Patterns**: Accordion con `type="multiple"` per aprire sezioni multiple
- **Responsive Design**: Grid adaptive, pulsanti compatti, layout mobile-friendly

#### Use Cases Supportati
- ✅ Ristoranti: tracking bonus giornaliero per sede, bonifici mensili
- ✅ Aziende multi-sede: vista aggregata pagamenti per location
- ✅ Gestione flessibile: dipendenti senza codice fiscale (assunzioni in progress)
- ✅ Storico trasparente: comparazione mensile con statistiche

---

### ⏰ [0.6.0] - 2025-11-10 - Gestione Fasce Orarie e Pause Pranzo

#### 🎯 Highlights
Implementazione completa del sistema di gestione fasce orarie con pause pranzo configurabili per turni spezzati (ristoranti, officine, ecc.)

#### Added
- **Fasce Orarie Configurabili**: Nuova sezione in Impostazioni per definire fasce orarie standard
  - Configurazione per tipo turno (MATTINA, POMERIGGIO, SERA, NOTTE, SPEZZATO)
  - Orari di inizio e fine personalizzabili
  - Maggiorazione percentuale opzionale
- **Pause Pranzo**: Gestione pause pranzo per turni SPEZZATO
  - Campo `pausaPranzoInizio` e `pausaPranzoFine` in `fasce_orarie` table
  - Campo `pausaPranzoInizio` e `pausaPranzoFine` in `turni` table
  - Validazione condizionale: pausa pranzo richiesta solo per turni SPEZZATO
- **Auto-compilazione Turni**: Gli orari e pause pranzo si compilano automaticamente
  - Selezione tipo turno → auto-compilazione da fascia oraria corrispondente
  - Funziona sia per turno singolo che pianificazione multipla
  - Modifica manuale sempre possibile (override)
- **Calcolo Ore Avanzato**: Sottrazione automatica pause pranzo dal calcolo ore lavorate
  - Usa pausa pranzo del turno associato (se presente)
  - Fallback a 30 minuti per turni > 6 ore senza pausa configurata
  - Integrato in tutte le API presenze e servizio auto-generazione
- **UX Onboarding**: Sistema di notifica nuova funzionalità
  - Banner informativo dismissibile nella pagina Turni
  - Badge "Nuovo" sulla voce Impostazioni in sidebar
  - Link diretto alle Impostazioni dal banner
  - Persistenza dismissione via localStorage

#### Changed
- **Database Schema**:
  - Aggiunto `pausaPranzoInizio String?` e `pausaPranzoFine String?` a `fasce_orarie`
  - Aggiunto `pausaPranzoInizio String?` e `pausaPranzoFine String?` a `turni`
- **Validation**:
  - `fasciaOrariaSchema`: validazione condizionale pause pranzo per SPEZZATO
  - `turnoCreateSchema` e `turniMultipliCreateSchema`: aggiunti campi pausa pranzo
- **UI Components**:
  - `turno-form-dialog.tsx`: dialog scrollabile con footer sticky (max-h-90vh)
  - `fascia-oraria-form-dialog.tsx`: campi pausa pranzo condizionali
  - `pianificazione-multipla-dialog.tsx`: auto-compilazione come turno singolo
- **API Routes**:
  - `POST /api/turni`: include pause pranzo nella creazione
  - `POST /api/turni/multipli`: include pause pranzo nel batch
  - `POST /api/presenze`: usa pause pranzo da turno associato
  - `PUT /api/presenze/[id]`: usa pause pranzo da turno associato
- **Services**:
  - `PresenzeFromTurniService.calcolaOreDaTurno()`: accetta parametri pausa pranzo
  - Auto-generazione presenze considera pause pranzo configurate

#### Fixed
- **Modal Overflow**: Dialog "Nuovo Turno" troppo alto, pulsanti fuori vista
  - Implementato layout flex con area scrollabile e footer sticky
  - Altezza massima 90vh per garantire visibilità pulsanti
- **Typo Filter**: Filtro `f.attiva` corretto in `f.attivo` in pianificazione multipla

#### Technical Details
- **Pattern Auto-compilazione**: `useEffect` watch su `tipoTurno` + `form.setValue()`
- **Conditional Rendering**: `hasPausaPranzo = watch('pausaPranzoInizio') || watch('pausaPranzoFine')`
- **Prisma Client Regeneration**: `npm run db:generate` dopo schema changes
- **Backward Compatibility**: Fallback pausa pranzo garantisce compatibilità con turni esistenti
- **UI Consistency**: Stessa UX tra turno singolo e pianificazione multipla

#### Use Cases Supportati
- ✅ Ristoranti: turni spezzati 11:00-15:00, 18:00-22:00 con pausa 15:00-18:00
- ✅ Officine meccaniche: 8:00-13:00, 15:00-18:00 con pausa pranzo 13:00-15:00
- ✅ Qualsiasi settore con pause pranzo variabili per turno

---

### 🎨 [0.5.2] - 2025-11-07 - UI Improvements Filtri Turni

#### Changed
- **Componente Filtri Turni**: Migrato da Accordion a Collapsible per migliore UX
- **Stato iniziale filtri**: Filtri chiusi di default per interfaccia più pulita
- **Animazione chevron**: Rotazione smooth dell'icona chevron all'apertura/chiusura
- **Pulizia componenti**: Rimosso componente accordion.tsx non utilizzato

#### Technical Details
- Sostituito `@radix-ui/react-accordion` con `@radix-ui/react-collapsible`
- Aggiunto state management con `useState(false)` per controllo apertura
- Migliorata semantica: Collapsible più appropriato per sezione singola vs Accordion per sezioni multiple
- File modificato: `src/components/turni/turni-filters.tsx`

---

### 🎯 [0.5.1] - 2025-11-06 - UX Improvements Presenze

#### Added
- **Reset/Undo Presenze**: Possibilità di annullare conferme o assenze e ripristinare stato DA_CONFERMARE
- **API PUT /api/presenze/[id]/reset**: Nuovo endpoint per reset presenze confermate/assenti
- **Pulsanti Annulla**: "Annulla Conferma" e "Annulla Assenza" nelle liste presenze
- **UX Guidata**: Messaggio informativo con pulsante diretto "Vai a Gestione Turni" quando pagina presenze è vuota
- **Link diretto**: Icona calendario + link a /turni per guidare l'utente nel workflow

#### Changed
- **Sidebar UI**: Rimossi badge "Nuovo" da tutte le voci menu (Turni, Presenze, Cedolini, Report)
- **Stato vuoto presenze**: Da messaggio generico a guida contestuale con CTA

#### UX Improvements
- Workflow più chiaro: gli utenti capiscono immediatamente che devono prima creare turni
- Possibilità di correggere errori umani senza modificare il database manualmente
- Interfaccia più pulita senza badge obsoleti

---

### 🎉 [0.5.0] - 2025-11-06 - Integrazione Turni-Presenze

#### Added
- **Auto-generazione presenze da turni**: Le presenze vengono create automaticamente quando si pianificano i turni
- **Enum stati presenza**: DA_CONFERMARE, CONFERMATA, MODIFICATA, ASSENTE
- **Service PresenzeFromTurniService**: Logica business centralizzata per generazione presenze
- **API POST /api/presenze/from-turni**: Endpoint per generazione batch presenze da turni esistenti
- **API PUT /api/presenze/[id]/conferma**: Endpoint per conferma/modifica/assenza presenze
- **Badge colorati stati**: Visualizzazione visuale dello stato delle presenze nella lista
- **Bottone "Conferma" rapido**: Azione rapida per confermare presenze con stato DA_CONFERMARE
- **Colonna Stato**: Nuova colonna nella tabella presenze per visualizzare lo stato
- **Test automatizzati**: Script completo con 11/12 test passati (91.7% successo)
- **Comando npm**: `npm run test:turni-presenze` per eseguire i test di integrazione
- **Relazione database**: Campo `turnoId` in tabella presenze per tracciare l'origine

#### Changed
- **Ordine menu sidebar**: Turni ora appare prima di Presenze (ordine logico del workflow)
- **Workflow presenze**: Da manuale a semi-automatico con conferma admin

#### Fixed
- **Next.js 16 async params**: Corretti params dinamici nelle route API per compatibilità
- **TypeScript ZodError**: Usato `error.issues` invece di `error.errors` per validazione

#### Technical Details
- Migration SQL per aggiunta enum `stato_presenza` e campo `turnoId`
- Auto-generazione presenze integrata in POST /api/turni e POST /api/turni/multipli
- Calcolo automatico ore lavorate e straordinari basato su orari turno
- Gestione errori non-bloccante: turni creati anche se generazione presenza fallisce

---

## [0.4.0] - 2025-11-05 - Sistema Buste Paga e Turni

### Added
- **Gestione Turni completa**: CRUD turni con filtri per dipendente, sede, tipo, date
- **Pianificazione multipla**: Creazione batch turni per pianificazione settimanale/mensile
- **Sistema Buste Paga**: Generazione cedolini con calcolo automatico
- **PDF Cedolini**: Generazione PDF con dettaglio completo retribuzione
- **Report Presenze**: Export e visualizzazione report presenze
- **Report Cedolini**: Storico cedolini mensili per dipendente

### Changed
- **Unificazione routing**: `/buste-paga` ora redirige a `/cedolini` per consistenza
- **Backend naming**: API mantiene `/api/buste-paga`, frontend usa `/cedolini`

---

## [0.3.0] - 2025-11-04 - UX e Performance

### Added
- **Skeleton Loading**: Componenti loading professionali su tutte le pagine dinamiche
- **PageLoader unificato**: Loading state consistente con titolo + sottotitolo
- **Gestione Sedi**: CRUD completo per sedi aziendali
- **Assegnazione Sede**: Collegamento dipendenti a sedi specifiche

### Changed
- **Colonne Dipendenti**: Riorganizzate per maggiore leggibilità
- **Redirect automatico**: Dopo save/update dipendente torna alla lista
- **Colonna Contratto**: Consolidati tipo contratto, data assunzione, ore settimanali

### Performance
- Coverage 100% skeleton loading su pagine dinamiche
- Tempi di caricamento percepiti ridotti significativamente

---

## [0.2.0] - 2025-11-03 - Gestione Presenze

### Added
- **Registro Presenze**: Lista presenze con filtri e ricerca avanzata
- **Calcolo ore automatico**: Ore lavorate e straordinari calcolati automaticamente
- **Note con popover**: Visualizzazione note presenze con popover interattivo
- **Filtri avanzati**: Per dipendente, sede, range date
- **Validazione orari**: Controllo coerenza entrata/uscita

---

## [0.1.0] - 2025-11-01 - Foundation e Dipendenti

### Added
- **Setup iniziale**: Next.js 16 + Supabase + Prisma
- **Autenticazione**: Sistema completo con ruoli (SUPER_ADMIN, ADMIN, MANAGER, USER)
- **Gestione Aziende**: CRUD completo aziende clienti
- **Gestione Dipendenti**: Anagrafica completa con documenti e contratti
- **Upload Documenti**: Gestione documenti dipendenti con Supabase Storage
- **Dashboard**: Analytics e statistiche in tempo reale
- **RLS Policies**: Isolamento dati multi-tenant
- **Activity Logger**: Sistema centralizzato logging attività

### Infrastructure
- **Database Schema**: 11 modelli principali con relazioni
- **API Routes**: Endpoints RESTful per tutte le risorse
- **Validation**: Zod schemas per validazione client e server
- **TypeScript**: Type safety completo su tutto il progetto

---

## Note di Versioning

- **Major (X.0.0)**: Cambiamenti breaking API o database
- **Minor (0.X.0)**: Nuove funzionalità backward-compatible
- **Patch (0.0.X)**: Bug fixes e piccoli miglioramenti

---

## Link Utili

- [Documentazione Completa](./README.md)
- [Piano Implementazione](./paycrew-implementation-plan.md)
- [Architettura Database](./paycrew-architecture-diagram.md)
