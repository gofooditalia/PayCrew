# Changelog

Tutte le modifiche importanti a questo progetto saranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e questo progetto aderisce al [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
