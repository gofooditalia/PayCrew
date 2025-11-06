const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '&pgbouncer=true&statement_cache_size=0'
    }
  }
});

async function checkSchemaSync() {
  console.log('🔍 Verifica sincronizzazione schema Prisma con Supabase\n');
  console.log('=' .repeat(60));

  try {
    // Check database connection
    console.log('\n✅ Connessione al database...');
    await prisma.$connect();
    console.log('✅ Connessione stabilita con successo!\n');

    // Check buste_paga table structure
    console.log('📊 Verifica struttura tabella buste_paga...\n');

    const columnCheck = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'buste_paga'
      ORDER BY ordinal_position;
    `;

    console.log('Colonne trovate nella tabella buste_paga:');
    console.log('-'.repeat(60));
    columnCheck.forEach(col => {
      console.log(`  ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | nullable: ${col.is_nullable}`);
    });

    // Check for payment fields (acconti, bonus, etc.)
    const paymentFields = ['acconto1', 'acconto2', 'acconto3', 'acconto4', 'totaleAcconti', 'bonus', 'importoBonifico', 'differenza', 'note'];
    console.log('\n📝 Verifica campi di pagamento aggiunti:');
    console.log('-'.repeat(60));

    paymentFields.forEach(field => {
      const found = columnCheck.find(col => col.column_name === field);
      if (found) {
        console.log(`  ✅ ${field.padEnd(20)} - PRESENTE`);
      } else {
        console.log(`  ❌ ${field.padEnd(20)} - MANCANTE`);
      }
    });

    // Check enum values for tipo_attivita
    console.log('\n🔢 Verifica enum tipo_attivita...\n');
    const enumValues = await prisma.$queryRaw`
      SELECT e.enumlabel
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'tipo_attivita'
      ORDER BY e.enumsortorder;
    `;

    console.log('Valori enum tipo_attivita:');
    console.log('-'.repeat(60));
    enumValues.forEach(val => {
      console.log(`  - ${val.enumlabel}`);
    });

    // Check for required enum values
    const requiredEnums = [
      'CREAZIONE_DIPENDENTE',
      'MODIFICA_DIPENDENTE',
      'ELIMINAZIONE_DIPENDENTE',
      'REGISTRAZIONE_PRESENZA',
      'MODIFICA_PRESENZA',
      'ELIMINAZIONE_PRESENZA',
      'CREAZIONE_TURNO',
      'MODIFICA_TURNO',
      'ELIMINAZIONE_TURNO',
      'GENERAZIONE_BUSTA_PAGA',
      'MODIFICA_BUSTA_PAGA',
      'ELIMINAZIONE_BUSTA_PAGA'
    ];

    console.log('\n📝 Verifica valori enum richiesti:');
    console.log('-'.repeat(60));
    requiredEnums.forEach(reqEnum => {
      const found = enumValues.find(val => val.enumlabel === reqEnum);
      if (found) {
        console.log(`  ✅ ${reqEnum.padEnd(30)} - PRESENTE`);
      } else {
        console.log(`  ❌ ${reqEnum.padEnd(30)} - MANCANTE`);
      }
    });

    // Count records to verify data integrity
    console.log('\n📈 Statistiche database:');
    console.log('-'.repeat(60));

    const counts = await Promise.all([
      prisma.buste_paga.count(),
      prisma.dipendenti.count(),
      prisma.presenze.count(),
      prisma.turni.count(),
      prisma.attivita.count()
    ]);

    console.log(`  Buste paga:    ${counts[0]}`);
    console.log(`  Dipendenti:    ${counts[1]}`);
    console.log(`  Presenze:      ${counts[2]}`);
    console.log(`  Turni:         ${counts[3]}`);
    console.log(`  Attività:      ${counts[4]}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Verifica completata con successo!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Errore durante la verifica:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchemaSync();
