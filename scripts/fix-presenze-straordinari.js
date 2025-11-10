/**
 * Script per ricalcolare ore lavorate e straordinari per tutte le presenze esistenti
 *
 * PROBLEMA: Le presenze create con la vecchia logica hanno oreLavorate limitato
 * al massimo giornaliero (es. 8h) invece di contenere tutte le ore (es. 9h).
 *
 * SOLUZIONE: Ricalcola oreLavorate e oreStraordinario per tutte le presenze
 * che hanno entrata e uscita definiti.
 *
 * USO: node scripts/fix-presenze-straordinari.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function calcolaOreTraOrari(oraInizio, oraFine) {
  const [inizioOre, inizioMinuti] = oraInizio.split(':').map(Number)
  const [fineOre, fineMinuti] = oraFine.split(':').map(Number)

  const inizioMinutiTotali = inizioOre * 60 + inizioMinuti
  let fineMinutiTotali = fineOre * 60 + fineMinuti

  // Gestione turni notturni
  if (fineMinutiTotali < inizioMinutiTotali) {
    fineMinutiTotali += 24 * 60
  }

  const diffMinuti = fineMinutiTotali - inizioMinutiTotali
  return Math.round((diffMinuti / 60) * 100) / 100
}

async function main() {
  console.log('🔧 Inizio ricalcolo presenze...\n')

  // Recupera tutte le presenze con entrata e uscita
  const presenze = await prisma.presenze.findMany({
    where: {
      entrata: { not: null },
      uscita: { not: null }
    },
    include: {
      dipendenti: {
        select: {
          id: true,
          nome: true,
          cognome: true,
          oreSettimanali: true
        }
      },
      turni: {
        select: {
          pausaPranzoInizio: true,
          pausaPranzoFine: true
        }
      }
    }
  })

  console.log(`📊 Trovate ${presenze.length} presenze da ricalcolare\n`)

  let aggiornate = 0
  let saltate = 0
  let errori = 0

  for (const presenza of presenze) {
    try {
      // Estrai orari in formato HH:mm
      const entrata = presenza.entrata.toISOString().split('T')[1].substring(0, 5)
      const uscita = presenza.uscita.toISOString().split('T')[1].substring(0, 5)

      // Calcola ore totali
      const oreTotali = calcolaOreTraOrari(entrata, uscita)

      // Calcola ore giornaliere dal contratto (5 giorni lavorativi)
      const oreGiornaliere = Math.round((presenza.dipendenti.oreSettimanali / 5) * 100) / 100

      // Calcola pausa pranzo
      let pausaPranzoOre = 0
      if (presenza.turni?.pausaPranzoInizio && presenza.turni?.pausaPranzoFine) {
        pausaPranzoOre = calcolaOreTraOrari(
          presenza.turni.pausaPranzoInizio,
          presenza.turni.pausaPranzoFine
        )
      } else if (oreTotali >= 6) {
        pausaPranzoOre = 0.5 // 30 minuti
      }

      const oreLavorateNette = Math.max(0, oreTotali - pausaPranzoOre)
      const oreGiornaliereStandard = oreGiornaliere || 8

      // Calcola con la NUOVA logica corretta
      const nuoveOreLavorate = oreLavorateNette // Tutte le ore lavorate
      const nuoveOreStraordinario = Math.max(0, oreLavorateNette - oreGiornaliereStandard)

      // Controlla se ci sono cambiamenti
      const oreLavorateAttuali = presenza.oreLavorate ? Number(presenza.oreLavorate) : 0
      const oreStraordinarioAttuali = presenza.oreStraordinario ? Number(presenza.oreStraordinario) : 0

      const cambioOreLavorate = Math.abs(nuoveOreLavorate - oreLavorateAttuali) > 0.01
      const cambioStraordinari = Math.abs(nuoveOreStraordinario - oreStraordinarioAttuali) > 0.01

      if (cambioOreLavorate || cambioStraordinari) {
        // Aggiorna presenza
        await prisma.presenze.update({
          where: { id: presenza.id },
          data: {
            oreLavorate: nuoveOreLavorate,
            oreStraordinario: nuoveOreStraordinario
          }
        })

        console.log(`✅ ${presenza.dipendenti.nome} ${presenza.dipendenti.cognome} - ${presenza.data.toISOString().split('T')[0]}`)
        console.log(`   Ore: ${oreLavorateAttuali.toFixed(2)}h → ${nuoveOreLavorate.toFixed(2)}h`)
        console.log(`   Straord: ${oreStraordinarioAttuali.toFixed(2)}h → ${nuoveOreStraordinario.toFixed(2)}h\n`)

        aggiornate++
      } else {
        saltate++
      }
    } catch (error) {
      console.error(`❌ Errore presenza ${presenza.id}:`, error.message)
      errori++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📈 RIEPILOGO')
  console.log('='.repeat(60))
  console.log(`✅ Presenze aggiornate: ${aggiornate}`)
  console.log(`⏭️  Presenze saltate (già corrette): ${saltate}`)
  console.log(`❌ Errori: ${errori}`)
  console.log(`📊 Totale elaborate: ${presenze.length}`)
  console.log('='.repeat(60) + '\n')

  if (aggiornate > 0) {
    console.log('✨ Ricalcolo completato con successo!')
  } else {
    console.log('ℹ️  Tutte le presenze erano già corrette.')
  }
}

main()
  .catch((error) => {
    console.error('💥 Errore fatale:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
