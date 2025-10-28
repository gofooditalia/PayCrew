import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create a Prisma client with connection pooling for serverless environments
function createPrismaClientWithConnectionPool(): PrismaClient {
  // Add connection pooling to DATABASE_URL for serverless environments
  const databaseUrl = process.env.DATABASE_URL
  
  // Configure connection pooling for serverless
  const pooledUrl = databaseUrl && process.env.NODE_ENV === 'production' 
    ? databaseUrl.includes('?') 
      ? `${databaseUrl}&connection_limit=10&pool_timeout=10000`
      : `${databaseUrl}?connection_limit=10&pool_timeout=10000`
    : databaseUrl

  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn', 'query'] : ['error'],
    datasources: {
      db: {
        url: pooledUrl
      }
    }
  })

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClientWithConnectionPool()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Log successful initialization
console.log('[PRISMA_DEBUG] Prisma client with connection pooling initialized successfully')

// Helper function to safely execute Prisma queries with error handling
export async function safePrismaQuery<T>(
  query: () => Promise<T>,
  fallback?: T
): Promise<T | null> {
  try {
    return await query()
  } catch (error) {
    console.error('Prisma query error:', error)
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