/**
 * Script per rigenerare le presenze di Marco Tardelli per dicembre 2025
 * Utilizza il servizio PresenzeFromTurniService con il fix per i turni multipli
 */

import { PrismaClient } from '@prisma/client'
import { PresenzeFromTurniService } from '../src/lib/services/presenze-from-turni.service'

const prisma = new PrismaClient()

async function main() {
  try {
    // Trova Marco Tardelli
    const marco = await prisma.dipendenti.findFirst({
      where: {
        nome: 'Marco',
        cognome: 'Tardelli'
      },
      select: {
        id: true,
        nome: true,
        cognome: true,
        aziendaId: true
      }
    })

    if (!marco) {
      console.log('❌ Marco Tardelli non trovato')
      return
    }

    console.log(`✅ Trovato: ${marco.nome} ${marco.cognome} (ID: ${marco.id})`)

    // Definisci il range di dicembre 2025
    const dataInizio = new Date('2025-12-01')
    const dataFine = new Date('2025-12-31')

    // Conta i turni di Marco per dicembre
    const turniCount = await prisma.turni.count({
      where: {
        dipendenteId: marco.id,
        data: {
          gte: dataInizio,
          lte: dataFine
        }
      }
    })

    console.log(`📅 Turni trovati per dicembre 2025: ${turniCount}`)

    if (turniCount === 0) {
      console.log('⚠️  Nessun turno trovato per Marco a dicembre')
      return
    }

    // Recupera i turni per vedere i dettagli
    const turni = await prisma.turni.findMany({
      where: {
        dipendenteId: marco.id,
        data: {
          gte: dataInizio,
          lte: dataFine
        }
      },
      orderBy: {
        data: 'asc'
      },
      select: {
        id: true,
        data: true,
        tipoTurno: true,
        oraInizio: true,
        oraFine: true
      }
    })

    console.log('\n📋 Turni di Marco per dicembre:')
    turni.forEach(t => {
      console.log(`  - ${t.data.toLocaleDateString('it-IT')}: ${t.tipoTurno} (${t.oraInizio}-${t.oraFine})`)
    })

    console.log('\n🔄 Inizio generazione presenze...')

    // Genera le presenze usando il servizio
    const result = await PresenzeFromTurniService.generaPresenzeRange({
      dataInizio,
      dataFine,
      dipendenteId: marco.id,
      sovrascriviEsistenti: false,
      userId: 'system', // ID sistema per lo script
      aziendaId: marco.aziendaId
    })

    console.log('\n✅ Generazione completata!')
    console.log(`  - Presenze generate: ${result.generated}`)
    console.log(`  - Presenze aggiornate: ${result.updated}`)
    console.log(`  - Presenze saltate: ${result.skipped}`)

    if (result.errors.length > 0) {
      console.log('\n⚠️  Errori durante la generazione:')
      result.errors.forEach(err => console.log(`  - ${err}`))
    }

    // Verifica finale: conta le presenze generate
    const presenzeCount = await prisma.presenze.count({
      where: {
        dipendenteId: marco.id,
        data: {
          gte: dataInizio,
          lte: dataFine
        }
      }
    })

    console.log(`\n📊 Presenze totali in database per dicembre: ${presenzeCount}`)

    // Mostra quante presenze per ogni giorno (per verificare i turni multipli)
    const presenzePerGiorno = await prisma.presenze.groupBy({
      by: ['data'],
      where: {
        dipendenteId: marco.id,
        data: {
          gte: dataInizio,
          lte: dataFine
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        data: 'asc'
      }
    })

    console.log('\n📅 Presenze per giorno:')
    presenzePerGiorno.forEach(p => {
      const count = p._count.id
      const icon = count > 1 ? '🔄' : '✅'
      console.log(`  ${icon} ${p.data.toLocaleDateString('it-IT')}: ${count} presenza/e`)
    })

  } catch (error) {
    console.error('❌ Errore durante la generazione:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
