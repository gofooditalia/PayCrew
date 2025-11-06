const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testPrismaFunctionality() {
  console.log('🧪 Test Funzionalità Prisma con Supabase\n');
  console.log('=' .repeat(70));

  const results = {
    connection: false,
    read: false,
    write: false,
    update: false,
    delete: false,
    relations: false,
    transactions: false,
  };

  try {
    // Test 1: Connection
    console.log('\n1️⃣  Test Connessione Database...');
    await prisma.$connect();
    console.log('   ✅ Connessione stabilita');
    results.connection = true;

    // Test 2: Read operations
    console.log('\n2️⃣  Test Operazioni di Lettura (READ)...');
    const dipendentiCount = await prisma.dipendenti.count();
    const dipendenti = await prisma.dipendenti.findMany({
      take: 3,
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
      }
    });
    console.log(`   ✅ Trovati ${dipendentiCount} dipendenti`);
    console.log(`   ✅ Recuperati primi 3 record:`, dipendenti.length > 0 ? 'OK' : 'NESSUN DATO');
    results.read = true;

    // Test 3: Write operations (create test record)
    console.log('\n3️⃣  Test Operazioni di Scrittura (CREATE)...');
    const testAzienda = await prisma.aziende.findFirst();
    if (testAzienda) {
      const testDipendente = await prisma.dipendenti.create({
        data: {
          nome: 'Test',
          cognome: 'Prisma',
          codiceFiscale: `TEST${Date.now()}`,
          dataNascita: new Date('1990-01-01'),
          dataAssunzione: new Date(),
          tipoContratto: 'TEMPO_DETERMINATO',
          ccnl: 'TURISMO',
          livello: '3',
          retribuzione: 1500.00,
          aziendaId: testAzienda.id,
          attivo: true,
        }
      });
      console.log(`   ✅ Dipendente test creato con ID: ${testDipendente.id}`);
      results.write = true;

      // Test 4: Update operations
      console.log('\n4️⃣  Test Operazioni di Aggiornamento (UPDATE)...');
      const updated = await prisma.dipendenti.update({
        where: { id: testDipendente.id },
        data: { telefono: '1234567890' }
      });
      console.log(`   ✅ Dipendente aggiornato: telefono = ${updated.telefono}`);
      results.update = true;

      // Test 5: Relations
      console.log('\n5️⃣  Test Relazioni tra Tabelle...');
      const dipendenteConAzienda = await prisma.dipendenti.findUnique({
        where: { id: testDipendente.id },
        include: {
          aziende: true,
          presenze: true,
        }
      });
      console.log(`   ✅ Relazione con azienda: ${dipendenteConAzienda.aziende.nome}`);
      console.log(`   ✅ Presenze collegate: ${dipendenteConAzienda.presenze.length}`);
      results.relations = true;

      // Test 6: Transactions
      console.log('\n6️⃣  Test Transazioni...');
      await prisma.$transaction(async (tx) => {
        const count = await tx.dipendenti.count({ where: { attivo: true } });
        await tx.dipendenti.update({
          where: { id: testDipendente.id },
          data: { email: 'test@prisma.test' }
        });
        console.log(`   ✅ Transazione eseguita: ${count} dipendenti attivi`);
      });
      results.transactions = true;

      // Test 7: Delete operations
      console.log('\n7️⃣  Test Operazioni di Eliminazione (DELETE)...');
      await prisma.dipendenti.delete({
        where: { id: testDipendente.id }
      });
      console.log(`   ✅ Dipendente test eliminato`);
      results.delete = true;
    } else {
      console.log('   ⚠️  Nessuna azienda trovata, skip test di scrittura');
    }

    // Test 8: Raw queries
    console.log('\n8️⃣  Test Query Raw SQL...');
    const rawResult = await prisma.$queryRaw`
      SELECT COUNT(*) as total FROM dipendenti WHERE attivo = true
    `;
    console.log(`   ✅ Query raw eseguita: ${rawResult[0].total} dipendenti attivi`);

    // Test 9: Performance test
    console.log('\n9️⃣  Test Performance...');
    const start = Date.now();
    await Promise.all([
      prisma.dipendenti.count(),
      prisma.presenze.count(),
      prisma.turni.count(),
      prisma.buste_paga.count(),
    ]);
    const duration = Date.now() - start;
    console.log(`   ✅ 4 query parallele eseguite in ${duration}ms`);

    // Final Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 RIEPILOGO TEST PRISMA');
    console.log('='.repeat(70));

    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;

    console.log(`\n✅ Test superati: ${passedTests}/${totalTests}\n`);

    Object.entries(results).forEach(([test, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${test.toUpperCase().padEnd(15)} - ${passed ? 'PASSED' : 'FAILED'}`);
    });

    if (passedTests === totalTests) {
      console.log('\n🎉 PRISMA È COMPLETAMENTE FUNZIONANTE!\n');
      console.log('=' .repeat(70));
      return true;
    } else {
      console.log('\n⚠️  ALCUNI TEST SONO FALLITI\n');
      console.log('=' .repeat(70));
      return false;
    }

  } catch (error) {
    console.error('\n❌ ERRORE DURANTE I TEST:');
    console.error(error);
    console.log('\n' + '='.repeat(70));
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaFunctionality().then(success => {
  process.exit(success ? 0 : 1);
});
