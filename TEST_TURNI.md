# Test Plan - Sistema Turni

**Data Test**: 2025-11-03
**Sprint**: 3
**Feature**: Gestione Turni
**Server**: http://localhost:3000

---

## ✅ Prerequisiti

Prima di testare i turni, assicurati di avere:
- [ ] Almeno un'azienda creata
- [ ] Almeno 2-3 dipendenti attivi
- [ ] Almeno 1 sede aziendale configurata
- [ ] Utente autenticato con permessi adeguati

---

## 📋 Test Checklist

### 1. Navigazione e UI Base

**Obiettivo**: Verificare che la pagina turni sia accessibile e correttamente renderizzata

- [ ] **T1.1**: Cliccare su "Turni" nella sidebar
  - Verifica: La pagina si carica senza errori
  - Verifica: Il badge "Nuovo" è visibile sulla voce menu

- [ ] **T1.2**: Verificare layout pagina
  - Verifica: Titolo "Turni" visibile
  - Verifica: Sottotitolo "Gestisci i turni e la pianificazione del personale"
  - Verifica: Pulsante "Nuovo Turno" presente in alto a destra
  - Verifica: Pulsante "Pianificazione Multipla" presente

- [ ] **T1.3**: Verificare sezione filtri
  - Verifica: Pannello filtri visibile con sfondo muted
  - Verifica: 5 filtri presenti: Dipendente, Sede, Tipo Turno, Data Inizio, Data Fine
  - Verifica: Quick filters: "Questa settimana", "Prossima settimana", "Questo mese"
  - Verifica: Pulsante "Reset" presente

### 2. Creazione Turno Singolo

**Obiettivo**: Creare un nuovo turno e verificare validazioni

- [ ] **T2.1**: Aprire dialog creazione
  - Azione: Click su "Nuovo Turno"
  - Verifica: Dialog "Nuovo Turno" si apre
  - Verifica: Tutti i campi sono vuoti (eccetto data = oggi)

- [ ] **T2.2**: Testare validazioni form
  - Azione: Click "Crea Turno" senza compilare campi
  - Verifica: Messaggi di errore compaiono sui campi obbligatori

- [ ] **T2.3**: Creare turno valido (Mattina)
  - Azione: Compilare form con:
    - Dipendente: [Seleziona uno]
    - Data: Oggi
    - Tipo Turno: Mattina
    - Ora Inizio: 08:00
    - Ora Fine: 12:00
    - Sede: [Seleziona una]
  - Azione: Click "Crea Turno"
  - Verifica: Toast "Turno creato con successo"
  - Verifica: Dialog si chiude
  - Verifica: Turno appare nella lista
  - Verifica: Badge "Mattina" con colore ambra
  - Verifica: Calcolo ore: "4h"

- [ ] **T2.4**: Creare turno (Pranzo)
  - Azione: Ripetere con Tipo: Pranzo, Orario: 12:00-15:00
  - Verifica: Badge arancione per "Pranzo"

- [ ] **T2.5**: Creare turno (Sera)
  - Azione: Ripetere con Tipo: Sera, Orario: 18:00-22:00
  - Verifica: Badge blu per "Sera"

- [ ] **T2.6**: Creare turno (Notte)
  - Azione: Ripetere con Tipo: Notte, Orario: 22:00-06:00 (giorno dopo)
  - Verifica: Badge indaco per "Notte"
  - Verifica: Calcolo ore attraverso mezzanotte: "8h"

### 3. Controllo Sovrapposizioni

**Obiettivo**: Verificare che il sistema previene conflitti di orari

- [ ] **T3.1**: Tentare creazione turno sovrapposto
  - Azione: Creare turno per stesso dipendente, stessa data
  - Orario: 11:00-14:00 (sovrappone turno mattina)
  - Verifica: Errore "Sovrapposizione turni"
  - Verifica: Messaggio specifica orario turno esistente
  - Verifica: Turno NON viene creato

- [ ] **T3.2**: Turno adiacente (dovrebbe funzionare)
  - Azione: Creare turno 12:00-16:00 (dopo il mattina 08:00-12:00)
  - Verifica: Turno creato con successo (no sovrapposizione)

### 4. Modifica Turno

**Obiettivo**: Modificare un turno esistente

- [ ] **T4.1**: Aprire modifica turno
  - Azione: Click menu (⋮) su un turno → "Modifica"
  - Verifica: Dialog "Modifica Turno" si apre
  - Verifica: Campi pre-compilati con dati esistenti
  - Verifica: Dipendente NON modificabile (disabled)

- [ ] **T4.2**: Modificare orari
  - Azione: Cambiare Ora Fine da 12:00 a 13:00
  - Azione: Click "Salva Modifiche"
  - Verifica: Toast "Turno aggiornato con successo"
  - Verifica: Ore calcolate aggiornate: "5h"
  - Verifica: Lista ricaricata con nuovi dati

- [ ] **T4.3**: Cambiare tipo turno
  - Azione: Modificare da "Mattina" a "Pranzo"
  - Verifica: Badge aggiornato con nuovo colore

### 5. Eliminazione Turno

**Obiettivo**: Eliminare turni con conferma

- [ ] **T5.1**: Aprire dialog eliminazione
  - Azione: Click menu (⋮) → "Elimina"
  - Verifica: Alert dialog "Sei sicuro?" appare
  - Verifica: Messaggio warning visibile

- [ ] **T5.2**: Annullare eliminazione
  - Azione: Click "Annulla"
  - Verifica: Dialog si chiude
  - Verifica: Turno ancora presente nella lista

- [ ] **T5.3**: Confermare eliminazione
  - Azione: Click menu → "Elimina" → "Elimina"
  - Verifica: Toast "Turno eliminato con successo"
  - Verifica: Turno rimosso dalla lista

### 6. Filtri

**Obiettivo**: Verificare tutti i filtri funzionino correttamente

- [ ] **T6.1**: Filtra per dipendente
  - Azione: Selezionare un dipendente dal dropdown "Dipendente"
  - Verifica: Lista mostra solo turni di quel dipendente
  - Verifica: Altri turni nascosti

- [ ] **T6.2**: Filtra per sede
  - Azione: Selezionare una sede dal dropdown "Sede"
  - Verifica: Lista mostra solo turni di quella sede

- [ ] **T6.3**: Filtra per tipo turno
  - Azione: Selezionare "Mattina" da "Tipo Turno"
  - Verifica: Lista mostra solo turni di tipo Mattina

- [ ] **T6.4**: Filtra per range date
  - Azione: Impostare Data Inizio = oggi, Data Fine = +7 giorni
  - Verifica: Lista mostra solo turni in quel range

- [ ] **T6.5**: Quick filter "Questa settimana"
  - Azione: Click "Questa settimana"
  - Verifica: Date aggiornate a Lunedì-Domenica settimana corrente
  - Verifica: Lista filtrata automaticamente

- [ ] **T6.6**: Quick filter "Prossima settimana"
  - Azione: Click "Prossima settimana"
  - Verifica: Date aggiornate a Lunedì-Domenica settimana prossima

- [ ] **T6.7**: Quick filter "Questo mese"
  - Azione: Click "Questo mese"
  - Verifica: Date aggiornate a 1° giorno - ultimo giorno del mese

- [ ] **T6.8**: Reset filtri
  - Azione: Applicare vari filtri, poi click "Reset"
  - Verifica: Tutti i filtri tornano a valori default
  - Verifica: Date = settimana corrente
  - Verifica: Lista ricaricata

### 7. Pianificazione Multipla

**Obiettivo**: Creare turni ricorrenti in batch

- [ ] **T7.1**: Aprire dialog pianificazione
  - Azione: Click "Pianificazione Multipla"
  - Verifica: Dialog si apre con titolo icona calendario
  - Verifica: Date precompilate con settimana corrente
  - Verifica: Giorni Lun-Ven già selezionati (default)

- [ ] **T7.2**: Configurare pianificazione settimanale
  - Azione: Compilare:
    - Dipendente: [Seleziona uno]
    - Data Inizio: Lunedì prossimo
    - Data Fine: Venerdì prossimo
    - Giorni: Lun, Mar, Mer, Gio, Ven (checked)
    - Tipo Turno: Mattina
    - Ora Inizio: 09:00
    - Ora Fine: 13:00
    - Sede: [Seleziona]
  - Azione: Click "Crea Turni"
  - Verifica: Toast mostra "5 turni creati con successo"
  - Verifica: Dialog si chiude
  - Verifica: Lista ricaricata con 5 nuovi turni

- [ ] **T7.3**: Verificare turni creati
  - Azione: Filtrare per dipendente e settimana prossima
  - Verifica: 5 turni presenti (Lun-Ven)
  - Verifica: Tutti hanno stesso orario (09:00-13:00)
  - Verifica: Tutti tipo "Mattina"
  - Verifica: Sabato e Domenica NON hanno turni

- [ ] **T7.4**: Pianificazione con giorni personalizzati
  - Azione: Aprire pianificazione multipla
  - Azione: Deselezionare tutti, selezionare solo Sabato e Domenica
  - Azione: Configurare turno "Sera" 18:00-22:00
  - Verifica: "2 turni creati con successo"
  - Verifica: Solo weekend ha turni sera

- [ ] **T7.5**: Verifica controllo sovrapposizioni in batch
  - Azione: Tentare di ricreare stessi turni Lun-Ven
  - Verifica: Errore sovrapposizione
  - Verifica: NESSUN turno viene creato (transazione atomica)

### 8. Activity Log

**Obiettivo**: Verificare logging operazioni

- [ ] **T8.1**: Verificare log creazione
  - Azione: Creare un nuovo turno
  - Azione: Navigare a Dashboard o sezione Attività
  - Verifica: Log "Turno [TIPO] creato per: [Nome Dipendente]"
  - Verifica: Include dettagli: data, orario, tipo turno

- [ ] **T8.2**: Verificare log modifica
  - Azione: Modificare un turno
  - Verifica: Log "Turno [TIPO] modificato per: [Nome]"

- [ ] **T8.3**: Verificare log eliminazione
  - Azione: Eliminare un turno
  - Verifica: Log "Turno eliminato per: [Nome]"

- [ ] **T8.4**: Verificare log pianificazione multipla
  - Azione: Creare turni multipli (es. 5 turni)
  - Verifica: Log "Creati 5 turni per: [Nome] (pianificazione multipla)"

### 9. Edge Cases & Performance

**Obiettivo**: Testare scenari limite

- [ ] **T9.1**: Turno notturno attraverso mezzanotte
  - Azione: Creare turno 23:00-07:00
  - Verifica: Calcolo ore corretto: "8h"
  - Verifica: Nessun errore validazione

- [ ] **T9.2**: Turno molto lungo
  - Azione: Creare turno 06:00-23:00
  - Verifica: Calcolo: "17h"
  - Verifica: Turno salvato correttamente

- [ ] **T9.3**: Turno con minuti
  - Azione: Creare turno 08:15-12:45
  - Verifica: Calcolo: "4h 30m"

- [ ] **T9.4**: Pianificazione multipla lunga (30 giorni)
  - Azione: Configurare range 30 giorni, tutti i giorni
  - Verifica: "30 turni creati con successo"
  - Verifica: Prestazioni accettabili (<3 secondi)

- [ ] **T9.5**: Lista con molti turni
  - Verifica: Scroll fluido con 50+ turni
  - Verifica: Paginazione (se implementata)

### 10. Responsive & UX

**Obiettivo**: Verificare esperienza utente

- [ ] **T10.1**: Mobile (width < 768px)
  - Verifica: Filtri si adattano (colonna singola)
  - Verifica: Tabella scrollabile orizzontalmente
  - Verifica: Dialog form leggibile
  - Verifica: Pulsanti accessibili

- [ ] **T10.2**: Stati di caricamento
  - Verifica: Spinner durante fetch turni
  - Verifica: Disabilita pulsanti durante submit
  - Verifica: "Eliminazione..." durante delete

- [ ] **T10.3**: Messaggi utente chiari
  - Verifica: Toast posizionati correttamente
  - Verifica: Messaggi errore comprensibili
  - Verifica: Feedback su ogni azione

- [ ] **T10.4**: Empty states
  - Azione: Filtrare con criteri che non trovano turni
  - Verifica: Messaggio "Nessun turno trovato"
  - Verifica: Icona e suggerimento presenti

---

## 🐛 Bug Tracking

**Trovato un bug?** Annotalo qui:

### Bug #1
- **Descrizione**:
- **Steps to reproduce**:
- **Expected**:
- **Actual**:
- **Priority**: Alta/Media/Bassa

---

## ✅ Test Summary

**Tester**: _______________
**Data**: _______________
**Build Version**: _______________

**Totale Test**: 70
**Passati**: ___
**Falliti**: ___
**Bloccati**: ___

**Note Finali**:
_____________________________________________________________________
_____________________________________________________________________

---

## 🚀 Deployment Checklist

Prima del deploy in produzione:

- [ ] Tutti i test passati
- [ ] Performance accettabili con dataset reale
- [ ] Activity logging funzionante
- [ ] RLS policies verificate
- [ ] Backup database effettuato
- [ ] Documentazione aggiornata
