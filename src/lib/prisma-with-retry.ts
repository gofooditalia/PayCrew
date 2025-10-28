import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create a Prisma client with retry logic
function createPrismaClientWithRetry(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn', 'query'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

  // Add retry wrapper for critical operations
  const originalExecute = client.$executeRaw.bind(client)
  
  client.$executeRaw = async (query: TemplateStringsArray<any>, ...values: any[]) => {
    const maxRetries = 3
    let attempt = 0
    
    while (attempt < maxRetries) {
      try {
        return await originalExecute(query, ...values)
      } catch (error) {
        attempt++
        
        // Log retry attempt
        console.warn(`[PRISMA_RETRY] Attempt ${attempt}/${maxRetries} failed:`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          code: error instanceof Error && 'code' in error ? (error as any).code : 'UNKNOWN'
        })
        
        // If it's a connection error, wait before retrying
        if (error instanceof Error && 
            (error.message.includes('connection') || 
             error.message.includes('timeout') || 
             error.message.includes('ECONNREFUSED'))) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
          console.log(`[PRISMA_RETRY] Waiting ${delay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        
        // If it's a prepared statement error, don't retry
        if (error instanceof Error && error.message.includes('prepared statement')) {
          throw error
        }
        
        // If we've exhausted retries, throw the last error
        if (attempt === maxRetries) {
          throw error
        }
      }
    }
  }

  // Add connection test method
  client.testConnection = async (): Promise<boolean> => {
    try {
      await client.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      console.error('[PRISMA_CONNECTION] Connection test failed:', error)
      return false
    }
  }

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClientWithRetry()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}