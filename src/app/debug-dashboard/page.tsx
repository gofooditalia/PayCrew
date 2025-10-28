import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function DebugDashboardPage() {
  const results = {
    supabaseConnection: 'Not tested',
    prismaConnection: 'Not tested',
    userAuth: 'Not tested',
    userData: 'Not tested',
    dashboardQueries: 'Not tested',
    dashboardData: null as any,
    errors: [] as string[]
  }

  try {
    // Test Supabase connection
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      results.supabaseConnection = 'Error: ' + authError.message
      results.errors.push('Supabase auth error: ' + authError.message)
    } else {
      results.supabaseConnection = 'Success'
      results.userAuth = user ? 'User authenticated: ' + user.email : 'No user'
    }

    if (!user) {
      results.errors.push('No authenticated user found')
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Debug Dashboard</h1>
          <div className="bg-red-100 p-4 rounded">
            <p>No authenticated user found. Please login first.</p>
          </div>
          <pre className="bg-gray-100 p-4 rounded mt-4 overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )
    }

    // Test Prisma connection
    try {
      await prisma.$queryRaw`SELECT 1`
      results.prismaConnection = 'Success'
    } catch (prismaError) {
      results.prismaConnection = 'Error: ' + (prismaError as Error).message
      results.errors.push('Prisma connection error: ' + (prismaError as Error).message)
    }

    // Test user data query
    try {
      const userData = await prisma.users.findUnique({
        where: { id: user.id },
        select: { aziendaId: true }
      })
      results.userData = userData ? 'Success: aziendaId=' + userData.aziendaId : 'No user data found'
    } catch (userError) {
      results.userData = 'Error: ' + (userError as Error).message
      results.errors.push('User data query error: ' + (userError as Error).message)
    }

    // Test dashboard queries
    try {
      const userData = await prisma.users.findUnique({
        where: { id: user.id },
        select: { aziendaId: true }
      })

      if (userData?.aziendaId) {
        const dipendentiIds = await prisma.dipendenti.findMany({
          where: {
            aziendaId: userData.aziendaId,
            attivo: true
          },
          select: { id: true }
        })

        const dipendenteIds = dipendentiIds.map(d => d.id)

        const [
          totalDipendenti,
          presenzeOggi,
          bustePagaMese,
          totaleSalari
        ] = await Promise.all([
          prisma.dipendenti.count({
            where: {
              aziendaId: userData.aziendaId,
              attivo: true
            }
          }),
          prisma.presenze.count({
            where: {
              dipendenteId: {
                in: dipendenteIds
              },
              data: new Date()
            }
          }),
          prisma.buste_paga.count({
            where: {
              dipendenteId: {
                in: dipendenteIds
              },
              mese: new Date().getMonth() + 1,
              anno: new Date().getFullYear()
            }
          }),
          prisma.dipendenti.aggregate({
            where: {
              aziendaId: userData.aziendaId,
              attivo: true
            },
            _sum: { retribuzione: true }
          })
        ])
        
        results.dashboardQueries = 'Success'
        results.dashboardData = {
          totalDipendenti,
          presenzeOggi,
          bustePagaMese,
          totaleSalari: totaleSalari._sum.retribuzione
        }
      } else {
        results.dashboardQueries = 'Skipped: No aziendaId'
      }
    } catch (queryError) {
      results.dashboardQueries = 'Error: ' + (queryError as Error).message
      results.errors.push('Dashboard queries error: ' + (queryError as Error).message)
    }

  } catch (error) {
    results.errors.push('General error: ' + (error as Error).message)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Dashboard</h1>
      
      {results.errors.length > 0 && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <h2 className="font-bold">Errors Found:</h2>
          <ul className="list-disc list-inside">
            {results.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold">Supabase Connection</h3>
          <p className={results.supabaseConnection.includes('Success') ? 'text-green-600' : 'text-red-600'}>
            {results.supabaseConnection}
          </p>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold">Prisma Connection</h3>
          <p className={results.prismaConnection.includes('Success') ? 'text-green-600' : 'text-red-600'}>
            {results.prismaConnection}
          </p>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold">User Authentication</h3>
          <p>{results.userAuth}</p>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold">User Data</h3>
          <p className={results.userData.includes('Success') ? 'text-green-600' : 'text-red-600'}>
            {results.userData}
          </p>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold">Dashboard Queries</h3>
          <p className={results.dashboardQueries.includes('Success') ? 'text-green-600' : 'text-red-600'}>
            {results.dashboardQueries}
          </p>
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-bold mb-2">Full Results:</h3>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>

      <div className="mt-4">
        <a href="/dashboard" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Back to Dashboard
        </a>
      </div>
    </div>
  )
}