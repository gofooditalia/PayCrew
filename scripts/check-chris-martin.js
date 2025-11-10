const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  // Trova Chris Martin
  const dipendente = await prisma.dipendenti.findFirst({
    where: {
      nome: { contains: 'Chris', mode: 'insensitive' },
      cognome: { contains: 'Martin', mode: 'insensitive' }
    },
    select: {
      id: true,
      nome: true,
      cognome: true,
      oreSettimanali: true,
      retribuzione: true
    }
  });

  if (!dipendente) {
    console.log('Dipendente non trovato');
    await prisma.$disconnect();
    return;
  }

  console.log('📋 DIPENDENTE:', dipendente.nome, dipendente.cognome);
  console.log('⏰ Ore settimanali contratto:', dipendente.oreSettimanali);
  console.log('⏰ Ore giornaliere:', (dipendente.oreSettimanali / 5).toFixed(2), 'h');
  console.log('💰 Retribuzione mensile:', Number(dipendente.retribuzione).toFixed(2), '€');
  console.log('');

  // Trova presenze novembre 2025
  const presenze = await prisma.presenze.findMany({
    where: {
      dipendenteId: dipendente.id,
      data: {
        gte: new Date('2025-11-01'),
        lte: new Date('2025-11-30')
      }
    },
    orderBy: { data: 'desc' }
  });

  console.log('✅ PRESENZE NOVEMBRE 2025:');
  let totaleOre = 0;
  let totaleStraordinari = 0;

  for (const presenza of presenze) {
    const ore = presenza.oreLavorate ? Number(presenza.oreLavorate) : 0;
    const straord = presenza.oreStraordinario ? Number(presenza.oreStraordinario) : 0;

    totaleOre += ore;
    totaleStraordinari += straord;

    console.log(`  - ${presenza.data.toISOString().split('T')[0]} [${presenza.stato}]`);
    console.log(`    Ore: ${ore.toFixed(2)}h | Straord: ${straord.toFixed(2)}h`);
  }

  console.log('');
  console.log('📊 TOTALI:');
  console.log('  Ore Lavorate:', totaleOre.toFixed(2), 'h');
  console.log('  Straordinari:', totaleStraordinari.toFixed(2), 'h');
  console.log('');

  // Trova cedolino novembre 2025
  const cedolino = await prisma.buste_paga.findFirst({
    where: {
      dipendenteId: dipendente.id,
      mese: 11,
      anno: 2025
    }
  });

  if (cedolino) {
    console.log('💼 CEDOLINO NOVEMBRE 2025:');
    console.log('  Ore Lavorate:', Number(cedolino.oreLavorate).toFixed(2), 'h');
    console.log('  Ore Straordinario:', Number(cedolino.oreStraordinario).toFixed(2), 'h');
    console.log('  Straordinari €:', Number(cedolino.straordinari).toFixed(2), '€');
  } else {
    console.log('⚠️  Nessun cedolino trovato per novembre 2025');
  }

  await prisma.$disconnect();
}

check().catch(console.error);
