/**
 * Script di test automatico per il flusso turni → presenze
 *
 * Test eseguiti:
 * 1. Creazione singolo turno → Verifica auto-generazione presenza
 * 2. Creazione turni multipli → Verifica batch auto-generazione
 * 3. Conferma presenza → Verifica cambio stato
 * 4. Modifica presenza → Verifica cambio stato a MODIFICATA
 * 5. Marca assente → Verifica cambio stato a ASSENTE
 */

// Usa il client Prisma configurato dall'app
const { prisma } = require('../src/lib/prisma.ts')

// Colori per output console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function success(message) {
  log(`✓ ${message}`, 'green')
}

function error(message) {
  log(`✗ ${message}`, 'red')
}

function info(message) {
  log(`ℹ ${message}`, 'cyan')
}

function section(message) {
  log(`\n${'='.repeat(60)}`, 'blue')
  log(message, 'blue')
  log('='.repeat(60), 'blue')
}

// Cleanup function
async function cleanup(dipendenteId) {
  if (!dipendenteId) {
    info('Nessun dipendente specificato per cleanup')
    return
  }

  info('Pulizia dati di test...')

  try {
    // Elimina presenze di test create oggi
    const oggi = new Date()
    oggi.setHours(0, 0, 0, 0)

    const deletedPresenze = await prisma.presenze.deleteMany({
      where: {
        dipendenteId: dipendenteId,
        data: {
          gte: oggi
        }
      }
    })

    // Elimina turni di test creati oggi
    const deletedTurni = await prisma.turni.deleteMany({
      where: {
        dipendenteId: dipendenteId,
        data: {
          gte: oggi
        }
      }
    })

    info(`Pulizia completata: ${deletedPresenze.count} presenze, ${deletedTurni.count} turni eliminati`)
  } catch (err) {
    info('Errore durante cleanup: ' + err.message)
  }
}

// Test runner
async function runTests() {
  let testsPassed = 0
  let testsFailed = 0

  let dipendente = null

  try {
    section('TEST AUTOMATICO FLUSSO TURNI → PRESENZE')

    // Setup: Recupera un'azienda esistente
    info('Setup: Recupero azienda di test...')
    const azienda = await prisma.aziende.findFirst()

    if (!azienda) {
      error('Nessuna azienda trovata nel database. Impossibile eseguire i test.')
      return
    }

    success(`Azienda trovata: ${azienda.nome} (${azienda.id})`)

    // Setup: Usa dipendente esistente
    section('SETUP: Recupero dipendente di test')
    dipendente = await prisma.dipendenti.findFirst({
      where: {
        aziendaId: azienda.id,
        attivo: true
      }
    })

    if (!dipendente) {
      error('Nessun dipendente trovato. Impossibile eseguire i test.')
      error('Suggerimento: Crea almeno un dipendente attivo prima di eseguire i test.')
      return
    }

    success(`Dipendente trovato: ${dipendente.nome} ${dipendente.cognome} (${dipendente.id})`)

    // Cleanup iniziale per questo dipendente
    await cleanup(dipendente.id)

    // TEST 1: Creazione singolo turno → Auto-generazione presenza
    section('TEST 1: Creazione singolo turno → Auto-generazione presenza')

    const oggi = new Date()
    oggi.setHours(0, 0, 0, 0)

    const turno1 = await prisma.turni.create({
      data: {
        data: oggi,
        oraInizio: '09:00',
        oraFine: '18:00',
        tipoTurno: 'MATTINA',
        dipendenteId: dipendente.id
      }
    })

    success(`Turno creato: ${turno1.data.toLocaleDateString()} ${turno1.oraInizio}-${turno1.oraFine}`)

    // Simula la logica di auto-generazione (come farebbe l'API)
    const { PresenzeFromTurniService } = require('../src/lib/services/presenze-from-turni.service.ts')

    const result1 = await PresenzeFromTurniService.generaPresenzaDaTurno(
      {
        ...turno1,
        dipendenti: {
          id: dipendente.id,
          nome: dipendente.nome,
          cognome: dipendente.cognome,
          oreSettimanali: dipendente.oreSettimanali
        }
      },
      false
    )

    if (result1 === 'generated') {
      success('✓ Presenza auto-generata dal turno')
      testsPassed++
    } else {
      error(`✗ Presenza non generata. Risultato: ${result1}`)
      testsFailed++
    }

    // Verifica presenza creata
    const presenza1 = await prisma.presenze.findFirst({
      where: {
        dipendenteId: dipendente.id,
        data: oggi
      }
    })

    if (presenza1) {
      success(`Presenza trovata: ID ${presenza1.id}`)

      if (presenza1.stato === 'DA_CONFERMARE') {
        success('✓ Stato iniziale corretto: DA_CONFERMARE')
        testsPassed++
      } else {
        error(`✗ Stato errato: ${presenza1.stato} (atteso: DA_CONFERMARE)`)
        testsFailed++
      }

      if (presenza1.generataDaTurno === true) {
        success('✓ Flag generataDaTurno = true')
        testsPassed++
      } else {
        error('✗ Flag generataDaTurno non impostato')
        testsFailed++
      }

      if (presenza1.turnoId === turno1.id) {
        success('✓ Relazione turno-presenza corretta')
        testsPassed++
      } else {
        error('✗ Relazione turno-presenza mancante')
        testsFailed++
      }
    } else {
      error('✗ Presenza non trovata nel database')
      testsFailed++
    }

    // TEST 2: Creazione turni multipli → Batch auto-generazione
    section('TEST 2: Creazione turni multipli → Batch auto-generazione')

    const domani = new Date(oggi)
    domani.setDate(domani.getDate() + 1)

    const dopodomani = new Date(oggi)
    dopodomani.setDate(dopodomani.getDate() + 2)

    const turni = await prisma.turni.createMany({
      data: [
        {
          data: domani,
          oraInizio: '09:00',
          oraFine: '18:00',
          tipoTurno: 'MATTINA',
          dipendenteId: dipendente.id
        },
        {
          data: dopodomani,
          oraInizio: '14:00',
          oraFine: '22:00',
          tipoTurno: 'SERA',
          dipendenteId: dipendente.id
        }
      ]
    })

    success(`${turni.count} turni creati in batch`)

    // Recupera i turni appena creati
    const turniCreati = await prisma.turni.findMany({
      where: {
        dipendenteId: dipendente.id,
        data: {
          in: [domani, dopodomani]
        }
      },
      include: {
        dipendenti: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            oreSettimanali: true
          }
        }
      }
    })

    // Genera presenze per ogni turno
    let presenzeGenerate = 0
    for (const turno of turniCreati) {
      const result = await PresenzeFromTurniService.generaPresenzaDaTurno(turno, false)
      if (result === 'generated') {
        presenzeGenerate++
      }
    }

    if (presenzeGenerate === turni.count) {
      success(`✓ ${presenzeGenerate}/${turni.count} presenze auto-generate da batch turni`)
      testsPassed++
    } else {
      error(`✗ Solo ${presenzeGenerate}/${turni.count} presenze generate`)
      testsFailed++
    }

    // TEST 3: Conferma presenza → Cambio stato
    section('TEST 3: Conferma presenza → Cambio stato')

    const presenzaDaConfermare = await prisma.presenze.findFirst({
      where: {
        dipendenteId: dipendente.id,
        stato: 'DA_CONFERMARE'
      },
      include: {
        dipendenti: true
      }
    })

    if (presenzaDaConfermare) {
      const presenzaConfermata = await PresenzeFromTurniService.confermaPresenza(
        presenzaDaConfermare.id
      )

      if (presenzaConfermata.stato === 'CONFERMATA') {
        success('✓ Presenza confermata con successo (stato: CONFERMATA)')
        testsPassed++
      } else {
        error(`✗ Stato errato dopo conferma: ${presenzaConfermata.stato}`)
        testsFailed++
      }
    } else {
      error('✗ Nessuna presenza da confermare trovata')
      testsFailed++
    }

    // TEST 4: Modifica presenza → Cambio stato a MODIFICATA
    section('TEST 4: Modifica presenza con cambio orari → Stato MODIFICATA')

    const presenzaDaModificare = await prisma.presenze.findFirst({
      where: {
        dipendenteId: dipendente.id,
        stato: 'DA_CONFERMARE'
      },
      include: {
        dipendenti: true
      }
    })

    if (presenzaDaModificare) {
      const presenzaModificata = await PresenzeFromTurniService.confermaPresenza(
        presenzaDaModificare.id,
        {
          entrata: '10:00',
          uscita: '19:00',
          nota: 'Orari modificati manualmente'
        }
      )

      if (presenzaModificata.stato === 'MODIFICATA') {
        success('✓ Presenza modificata con successo (stato: MODIFICATA)')
        testsPassed++
      } else {
        error(`✗ Stato errato dopo modifica: ${presenzaModificata.stato}`)
        testsFailed++
      }

      if (presenzaModificata.nota === 'Orari modificati manualmente') {
        success('✓ Nota salvata correttamente')
        testsPassed++
      } else {
        error('✗ Nota non salvata')
        testsFailed++
      }
    } else {
      error('✗ Nessuna presenza da modificare trovata')
      testsFailed += 2
    }

    // TEST 5: Marca assente → Cambio stato a ASSENTE
    section('TEST 5: Marca assente → Stato ASSENTE')

    const presenzaDaMarcareAssente = await prisma.presenze.findFirst({
      where: {
        dipendenteId: dipendente.id,
        stato: 'DA_CONFERMARE'
      }
    })

    if (presenzaDaMarcareAssente) {
      const presenzaAssente = await PresenzeFromTurniService.marcaAssente(
        presenzaDaMarcareAssente.id,
        'Dipendente assente ingiustificato'
      )

      if (presenzaAssente.stato === 'ASSENTE') {
        success('✓ Presenza marcata come assente (stato: ASSENTE)')
        testsPassed++
      } else {
        error(`✗ Stato errato dopo marca assente: ${presenzaAssente.stato}`)
        testsFailed++
      }

      if (presenzaAssente.oreLavorate === 0 && presenzaAssente.oreStraordinario === 0) {
        success('✓ Ore azzerate correttamente per assenza')
        testsPassed++
      } else {
        error('✗ Ore non azzerate per assenza')
        testsFailed++
      }
    } else {
      error('✗ Nessuna presenza da marcare assente trovata')
      testsFailed += 2
    }

    // TEST 6: Generazione batch con range date
    section('TEST 6: Generazione batch presenze da turni esistenti')

    const dataInizio = new Date(oggi)
    const dataFine = new Date(dopodomani)

    // Prima eliminiamo le presenze esistenti per testare la rigenerazione
    await prisma.presenze.deleteMany({
      where: {
        dipendenteId: dipendente.id
      }
    })

    info('Presenze eliminate, testing generazione batch...')

    const batchResult = await PresenzeFromTurniService.generaPresenzeRange({
      dataInizio,
      dataFine,
      dipendenteId: dipendente.id,
      sovrascriviEsistenti: false,
      userId: 'test-user-id',
      aziendaId: azienda.id
    })

    const turniTotali = await prisma.turni.count({
      where: {
        dipendenteId: dipendente.id,
        data: {
          gte: dataInizio,
          lte: dataFine
        }
      }
    })

    if (batchResult.generated === turniTotali) {
      success(`✓ Batch generation: ${batchResult.generated}/${turniTotali} presenze generate`)
      testsPassed++
    } else {
      error(`✗ Batch generation parziale: ${batchResult.generated}/${turniTotali}`)
      testsFailed++
    }

    if (batchResult.errors.length === 0) {
      success('✓ Nessun errore durante batch generation')
      testsPassed++
    } else {
      error(`✗ Errori durante batch generation: ${batchResult.errors.length}`)
      batchResult.errors.forEach(err => error(`  - ${err}`))
      testsFailed++
    }

  } catch (err) {
    error(`Errore durante l'esecuzione dei test: ${err.message}`)
    console.error(err)
    testsFailed++
  } finally {
    // Cleanup finale
    section('CLEANUP FINALE')
    await cleanup(dipendente?.id)

    // Risultati
    section('RISULTATI TEST')
    log(`\nTest eseguiti: ${testsPassed + testsFailed}`, 'blue')
    success(`Test passati: ${testsPassed}`)
    if (testsFailed > 0) {
      error(`Test falliti: ${testsFailed}`)
    }

    const percentuale = ((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)
    log(`\nSuccesso: ${percentuale}%`, percentuale === '100.0' ? 'green' : 'yellow')

    if (percentuale === '100.0') {
      log('\n🎉 TUTTI I TEST SONO PASSATI! 🎉', 'green')
    } else {
      log('\n⚠️  Alcuni test sono falliti. Verifica i dettagli sopra.', 'yellow')
    }

    await prisma.$disconnect()
    process.exit(testsFailed > 0 ? 1 : 0)
  }
}

// Esegui i test
runTests().catch(console.error)
