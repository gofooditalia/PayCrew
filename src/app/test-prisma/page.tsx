import { prisma } from '@/lib/prisma'

export default async function TestPrisma() {
  try {
    // Test di connessione a Prisma
    await prisma.$connect()
    
    // Controlla se la connessione al database funziona
    const result = await prisma.$queryRaw`SELECT 1 as test`
    
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test Connessione Prisma + Supabase</h1>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p className="font-bold">Successo!</p>
          <p>Connessione a Prisma con Supabase stabilita correttamente.</p>
          <p className="mt-2">Risultato test database: {JSON.stringify(result)}</p>
        </div>
        <div className="mt-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <p className="font-bold">Prossimi passi:</p>
          <ul className="list-disc list-inside mt-2">
            <li>Esegui <code className="bg-gray-200 px-1 rounded">npx prisma generate</code> per generare il client</li>
            <li>Definisci i tuoi modelli in <code className="bg-gray-200 px-1 rounded">prisma/schema.prisma</code></li>
            <li>Esegui <code className="bg-gray-200 px-1 rounded">npx prisma db push</code> per sincronizzare il database</li>
            <li>Usa <code className="bg-gray-200 px-1 rounded">npx prisma studio</code> per visualizzare il database</li>
          </ul>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test Connessione Prisma + Supabase</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Errore di connessione:</p>
          <p>{error instanceof Error ? error.message : 'Errore sconosciuto'}</p>
        </div>
        <div className="mt-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p className="font-bold">Possibili soluzioni:</p>
          <ul className="list-disc list-inside mt-2">
            <li>Verifica che le variabili DATABASE_URL e DIRECT_URL siano corrette</li>
            <li>Assicurati che il database Supabase sia attivo</li>
            <li>Esegui <code className="bg-gray-200 px-1 rounded">npx prisma generate</code> per generare il client</li>
          </ul>
        </div>
      </div>
    )
  } finally {
    await prisma.$disconnect()
  }
}