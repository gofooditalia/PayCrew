/**
 * Script per eliminare le presenze di Marco Tardelli per dicembre 2025
 * Questo permette di rigenerarle correttamente con il fix per i turni multipli
 */

import { PrismaClient } from '@prisma/client'

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
        cognome: true
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

    // Conta le presenze da eliminare
    const count = await prisma.presenze.count({
      where: {
        dipendenteId: marco.id,
        data: {
          gte: dataInizio,
          lte: dataFine
        }
      }
    })

    console.log(`📊 Presenze trovate per dicembre 2025: ${count}`)

    if (count === 0) {
      console.log('✅ Nessuna presenza da eliminare')
      return
    }

    // Elimina le presenze
    const result = await prisma.presenze.deleteMany({
      where: {
        dipendenteId: marco.id,
        data: {
          gte: dataInizio,
          lte: dataFine
        }
      }
    })

    console.log(`✅ Eliminate ${result.count} presenze di Marco Tardelli per dicembre 2025`)

  } catch (error) {
    console.error('❌ Errore durante l\'eliminazione:', error)
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
