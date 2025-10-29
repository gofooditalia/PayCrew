import { PrismaClient } from '@prisma/client'

// Debug logging for Prisma engine detection
console.log('[PRISMA_DEBUG] Node.js platform:', process.platform)
console.log('[PRISMA_DEBUG] Node.js arch:', process.arch)
console.log('[PRISMA_DEBUG] Node.js version:', process.version)
console.log('[PRISMA_DEBUG] Environment:', process.env.NODE_ENV)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create a single-use Prisma client for serverless environments
function createSingleUsePrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn', 'query'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

  return client
}

export const prisma = globalForPrisma.prisma ?? createSingleUsePrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Log successful initialization
console.log('[PRISMA_DEBUG] Prisma client with single-use pattern initialized successfully')

// Helper function to safely execute Prisma queries with error handling
export async function safePrismaQuery<T>(
  query: () => Promise<T>,
  fallback?: T
): Promise<T | null> {
  try {
    return await query()
  } catch (error) {
    console.error('Prisma query error:', error)
    
    // Handle prepared statement conflicts specifically
    if (error instanceof Error && error.message.includes('prepared statement')) {
      console.warn('[PRISMA_PREPARED_STATEMENT] Detected prepared statement conflict:', {
        message: error.message,
        suggestion: 'This may be a connection pooling issue in serverless environment'
      })
      // Try to reconnect by creating a new client instance
      try {
        // In development, this will help clear prepared statement cache
        if (process.env.NODE_ENV === 'development') {
          console.log('[PRISMA_DEBUG] Attempting to reconnect to clear prepared statement cache...')
          await prisma.$disconnect()
          // Small delay to ensure connection is fully closed
          await new Promise(resolve => setTimeout(resolve, 100))
          // The next query will automatically reconnect
        }
      } catch (reconnectError) {
        console.error('Failed to reconnect:', reconnectError)
      }
    }
    
    // Check if it's a connection error
    if (error instanceof Error &&
        (error.message.includes('Can\'t reach database server') ||
         error.message.includes('Network is unreachable') ||
         error.message.includes('ECONNREFUSED') ||
         error.message.includes('ENOTFOUND'))) {
      console.warn('Database connection failed - application running in offline mode')
    }
    
    // Return fallback when database is not reachable
    return fallback ?? null
  }
}

// Helper function to check if database is reachable
export async function isDatabaseReachable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database not reachable:', error)
    // Check if it's a network/connection error
    if (error instanceof Error &&
        (error.message.includes('Can\'t reach database server') ||
         error.message.includes('Network is unreachable') ||
         error.message.includes('ECONNREFUSED') ||
         error.message.includes('ENOTFOUND'))) {
      console.warn('Network connectivity issue detected - database unreachable')
    }
    return false
  }
}

// Helper function to test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}