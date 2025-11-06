# Feature: Integrazione Turni → Presenze

## 📋 Problema

**Situazione Attuale:**
- ❌ Doppia gestione: Turni e Presenze sono completamente separate
- ❌ Utente inserisce manualmente ogni presenza anche se il turno è già pianificato
- ❌ Duplicazione lavoro e rischio errori

**Esempio:**
1. Utente crea turno: "Mario - Lunedì 9:00-17:00"
2. Utente deve andare in Presenze e reinserire: "Mario - Lunedì 9:00-17:00"

## 🎯 Soluzione Proposta

### Flusso Utente

```
1️⃣ PIANIFICAZIONE TURNI
   ↓
   Utente crea turni settimanali/mensili
   Es: Mario - Lunedì 9:00-17:00, Martedì 14:00-22:00

2️⃣ GENERAZIONE AUTOMATICA PRESENZE
   ↓
   Sistema crea presenze "Da confermare" basate sui turni
   Sincronizzazione automatica quando si salva un turno

3️⃣ GESTIONE PRESENZE
   ↓
   Utente vede presenze pre-compilate e:
   ✅ Conferma se tutto ok
   ❌ Marca assente se non si è presentato
   ✏️  Modifica orari se diversi dal turno
   📝 Aggiunge note

4️⃣ ECCEZIONI
   ↓
   Possibilità di aggiungere presenze non pianificate
   (es: dipendente chiamato all'ultimo minuto)
```

## 🏗️ Architettura Tecnica

### 1. Modifica Schema Database

```prisma
model presenze {
  id               String     @id @default(uuid()) @db.Uuid
  data             DateTime   @db.Date
  entrata          DateTime?  @db.Timestamptz(6)
  uscita           DateTime?  @db.Timestamptz(6)
  oreLavorate      Decimal?   @db.Decimal(5, 2)
  oreStraordinario Decimal?   @db.Decimal(5, 2)
  nota             String?
  dipendenteId     String     @db.Uuid

  // ✨ NUOVI CAMPI
  turnoId          String?    @db.Uuid        // Relazione opzionale con turno
  stato            stato_presenza @default(DA_CONFERMARE)  // Stato presenza
  generataDaTurno  Boolean    @default(false) // Flag per distinguere origine

  createdAt        DateTime   @default(now()) @db.Timestamptz(6)
  updatedAt        DateTime   @updatedAt @db.Timestamptz(6)
  dipendenti       dipendenti @relation(fields: [dipendenteId], references: [id], onDelete: Cascade)
  turni            turni?     @relation(fields: [turnoId], references: [id], onDelete: SetNull)

  @@index([data])
  @@index([dipendenteId])
  @@index([turnoId])       // ✨ NUOVO
  @@index([stato])         // ✨ NUOVO
}

// ✨ NUOVO ENUM
enum stato_presenza {
  DA_CONFERMARE    // Generata automaticamente da turno
  CONFERMATA       // Utente ha confermato
  ASSENTE          // Dipendente assente
  MODIFICATA       // Orari modificati rispetto al turno
}
```

### 2. API Endpoint Nuovi

#### POST /api/presenze/from-turni
Genera presenze da turni in un range di date

**Request:**
```typescript
{
  dataInizio: "2025-11-01",
  dataFine: "2025-11-30",
  dipendenteId?: string,  // Opzionale: solo per un dipendente
  sedeId?: string,        // Opzionale: solo per una sede
  sovrascriviEsistenti: boolean  // Default false
}
```

**Response:**
```typescript
{
  generated: number,      // Presenze create
  skipped: number,        // Presenze saltate (già esistenti)
  errors: string[]        // Eventuali errori
}
```

**Logica:**
1. Trova tutti i turni nel range specificato
2. Per ogni turno, verifica se esiste già una presenza
3. Se non esiste, crea presenza con stato `DA_CONFERMARE`
4. Se `sovrascriviEsistenti=true`, aggiorna presenze esistenti

#### PUT /api/presenze/[id]/conferma
Conferma una presenza generata da turno

**Request:**
```typescript
{
  stato: "CONFERMATA" | "ASSENTE" | "MODIFICATA",
  entrata?: string,  // Se modificata
  uscita?: string,   // Se modificata
  nota?: string
}
```

#### POST /api/turni (MODIFICA)
Quando si crea/modifica un turno, opzionalmente genera la presenza

**Request:**
```typescript
{
  // ... campi turno esistenti
  generaPresenza?: boolean  // Default true
}
```

### 3. Componenti UI

#### Pagina Presenze - Miglioramenti

**Nuove Features:**
- 🔄 Pulsante "Genera da Turni" per range date
- 🏷️ Badge stato presenza (Da confermare, Confermata, etc)
- 🔗 Link al turno correlato (se esiste)
- ⚡ Azioni rapide: Conferma/Rifiuta in bulk

**Filtri aggiuntivi:**
- Stato presenza
- Solo presenze da turni
- Solo presenze manuali

#### Dialog Genera Presenze

```typescript
<GeneraPresenzeDialog>
  - Range date (data inizio/fine)
  - Filtri opzionali (dipendente, sede)
  - Checkbox "Sovrascrivi esistenti"
  - Preview: quante presenze verranno create
  - Conferma generazione
</GeneraPresenzeDialog>
```

#### Lista Presenze - Vista Migliorata

```typescript
<PresenzaCard>
  {presenza.generataDaTurno && (
    <Badge variant="secondary">Da Turno</Badge>
  )}

  <StatoBadge stato={presenza.stato} />

  {presenza.stato === 'DA_CONFERMARE' && (
    <QuickActions>
      <Button onClick={conferma}>Conferma</Button>
      <Button onClick={marcaAssente}>Assente</Button>
    </QuickActions>
  )}
</PresenzaCard>
```

### 4. Logica Business

#### Service: PresenzeFromTurniService

```typescript
class PresenzeFromTurniService {

  /**
   * Genera presenze da turni
   */
  async generaPresenzeRange(options: {
    dataInizio: Date
    dataFine: Date
    dipendenteId?: string
    sedeId?: string
    sovrascriviEsistenti: boolean
    userId: string
    aziendaId: string
  }): Promise<GenerazioneResult>

  /**
   * Genera presenza singola da turno
   */
  async generaPresenzaDaTurno(
    turno: Turno,
    sovrascriviEsistente: boolean
  ): Promise<Presenza | null>

  /**
   * Verifica se esiste già presenza per quel turno
   */
  async verificaPresenzaEsistente(
    dipendenteId: string,
    data: Date
  ): Promise<Presenza | null>

  /**
   * Conferma presenza
   */
  async confermaPresenza(
    presenzaId: string,
    modifiche?: ModifichePresenza
  ): Promise<Presenza>
}
```

#### Hook Automatico: onTurnoCreated

Quando si crea un turno, automaticamente genera la presenza corrispondente:

```typescript
// In POST /api/turni
const turno = await prisma.turni.create({...})

// Auto-genera presenza se richiesto
if (body.generaPresenza !== false) {
  await PresenzeFromTurniService.generaPresenzaDaTurno(turno, false)
}
```

## 📊 Stati e Transizioni

```
DA_CONFERMARE (default)
    ↓
    ├→ CONFERMATA (utente conferma senza modifiche)
    ├→ MODIFICATA (utente modifica orari)
    └→ ASSENTE (utente marca assente)

MODIFICATA → CONFERMATA (dopo ulteriore conferma)
```

## 🎨 UI/UX Mockup

### Pagina Presenze - Header

```
┌─────────────────────────────────────────────────────┐
│  Presenze                        [Nuova Presenza ▼] │
│                                   └─ Manuale         │
│  [🔄 Genera da Turni]              └─ Da Turno      │
│                                                       │
│  Filtri: [Dipendente ▼] [Sede ▼] [Stato ▼] [Date] │
│         [Solo da turni] [Solo manuali]              │
└─────────────────────────────────────────────────────┘
```

### Card Presenza

```
┌──────────────────────────────────────────────────┐
│ Mario Rossi             [Da Turno] [Da Confermare]│
│ Lunedì 6 Nov 2025                                 │
│ 09:00 - 17:00  •  8h lavorate                    │
│ Sede: Centro                                      │
│                                                    │
│ [✓ Conferma] [✎ Modifica] [✗ Assente]          │
└──────────────────────────────────────────────────┘
```

## 🚀 Piano Implementazione

### Fase 1: Database (Sprint 1)
- [ ] Aggiornare schema Prisma
- [ ] Creare migration
- [ ] Testare schema su dev

### Fase 2: Backend (Sprint 1-2)
- [ ] Creare PresenzeFromTurniService
- [ ] API POST /api/presenze/from-turni
- [ ] API PUT /api/presenze/[id]/conferma
- [ ] Modificare POST /api/turni per auto-generazione
- [ ] Test unitari e integrazione

### Fase 3: Frontend (Sprint 2)
- [ ] Componente GeneraPresenzeDialog
- [ ] Badge StatoPresenza
- [ ] QuickActions (Conferma/Assente)
- [ ] Filtro per stato
- [ ] Link turno correlato

### Fase 4: Testing & Refinement (Sprint 2-3)
- [ ] Test end-to-end
- [ ] UX refinement
- [ ] Performance optimization
- [ ] Documentazione utente

## ⚠️ Considerazioni

### Gestione Conflitti
**Scenario:** Utente ha già creato manualmente una presenza, poi genera da turni

**Soluzione:**
- Default: Skip presenze già esistenti
- Opzione: `sovrascriviEsistenti=true` per forzare update
- Warning UI prima di sovrascrivere

### Modifiche Turno Retroattive
**Scenario:** Utente modifica un turno passato che ha già una presenza confermata

**Soluzione:**
- Non aggiornare automaticamente presenze CONFERMATA
- Mostrare warning: "Presenza già confermata, vuoi aggiornarla?"
- Opzione manuale di sync

### Eliminazione Turno
**Scenario:** Utente elimina un turno con presenza collegata

**Soluzione:**
- `onDelete: SetNull` - Presenza rimane ma perde relazione
- Flag `generataDaTurno` rimane per storico
- Presenza può essere modificata normalmente

## 📈 Metriche Successo

- ⏱️ Riduzione tempo inserimento presenze: Target -70%
- ✅ Accuratezza dati: Target +30%
- 😊 User satisfaction: Target > 8/10
- 🐛 Bug reports: Target < 5 nel primo mese

## 🔄 Future Enhancements (Post-MVP)

1. **Sincronizzazione Bidirezionale**
   - Modifiche presenza aggiornano turno
   - Modalità "Sync always" per ambienti rigidi

2. **Template Turni**
   - Crea turni ricorrenti (es: ogni lunedì stesso orario)
   - Auto-genera presenze per settimane/mesi futuri

3. **Notifiche**
   - Alert se presenza da confermare da > 3 giorni
   - Reminder settimanale per confermare presenze

4. **AI Suggestions**
   - Suggerisci turni basati su storico
   - Ottimizza planning in base a presenze reali

5. **Mobile App**
   - Dipendenti confermano proprie presenze
   - Check-in/out con geolocalizzazione

---

**Creato:** 2025-11-06
**Versione:** 1.0
**Autore:** Claude Code
**Status:** 📝 Design Proposal
