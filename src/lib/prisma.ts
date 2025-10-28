import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Helper function to safely execute Prisma queries with error handling
export async function safePrismaQuery<T>(
  query: () => Promise<T>,
  fallback?: T
): Promise<T | null> {
  try {
    return await query()
  } catch (error) {
    console.error('Prisma query error:', error)
    return fallback ?? null
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