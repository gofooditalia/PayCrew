import { prisma, safePrismaQuery, testDatabaseConnection } from '@/lib/prisma'

export default async function TestPrismaPage() {
  const dbConnected = await testDatabaseConnection()
  
  let userCount = 0
  let errorMessage = null
  
  if (dbConnected) {
    try {
      userCount = await safePrismaQuery(
        () => prisma.users.count(),
        0
      ) || 0
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unknown error'
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Prisma Connection Test</h1>
        
        <div className="space-y-6">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Database Connection Status</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Status:</span>{' '}
                <span className={`px-2 py-1 rounded text-sm ${
                  dbConnected 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {dbConnected ? 'Connected' : 'Not Connected'}
                </span>
              </p>
            </div>
          </div>

          {dbConnected && (
            <div className="p-6 border rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Database Query Test</h2>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">User Count:</span> {userCount}
                </p>
                {errorMessage && (
                  <p>
                    <span className="font-medium text-red-600">Error:</span> {errorMessage}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">DATABASE_URL:</span>{' '}
                <span className="text-gray-600">
                  {process.env.DATABASE_URL ? 'Set' : 'Not set'}
                </span>
              </p>
              <p>
                <span className="font-medium">DIRECT_URL:</span>{' '}
                <span className="text-gray-600">
                  {process.env.DIRECT_URL ? 'Set' : 'Not set'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}