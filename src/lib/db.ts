import { PrismaClient } from '@prisma/client'

/**
 * Database Connection Pool Configuration
 *
 * If you're experiencing "Unable to check out process from the pool due to timeout" errors,
 * you may need to configure connection pool parameters in your DATABASE_URL.
 *
 * Add these query parameters to your DATABASE_URL:
 * - connection_limit: Maximum number of connections in the pool (default: varies by provider)
 * - pool_timeout: Timeout for getting a connection from the pool in seconds (default: 10)
 * - connect_timeout: Timeout for establishing a connection in seconds (default: 5)
 *
 * Example:
 * DATABASE_URL="postgresql://user:password@host:5432/db?connection_limit=20&pool_timeout=20&connect_timeout=10"
 *
 * For Supabase, use the pooler connection string which handles connection pooling:
 * DATABASE_URL="postgresql://postgres:[password]@[host].pooler.supabase.com:6543/postgres?pgbouncer=true"
 *
 * Note: The retry logic in this file will automatically retry operations on connection pool timeouts,
 * but proper pool configuration is still recommended for optimal performance.
 */

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Check if an error is a connection pool timeout error
 */
function isConnectionPoolTimeoutError(error: unknown): boolean {
  if (!error) return false

  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : String(error)

  // Check for Prisma error code P1001 (connection error)
  const isPrismaConnectionError =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P1001'

  return (
    errorMessage.includes('Unable to check out process from the pool') ||
    errorMessage.includes('connection pool') ||
    errorMessage.includes('timeout') ||
    isPrismaConnectionError
  )
}

/**
 * Retry a database operation with exponential backoff on connection pool timeouts
 * @param operation - The database operation to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param initialDelay - Initial delay in milliseconds (default: 100)
 * @returns The result of the operation
 */
export async function withConnectionPoolRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 100
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Only retry on connection pool timeout errors
      if (!isConnectionPoolTimeoutError(error)) {
        throw error
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break
      }

      // Calculate exponential backoff delay
      const delay = initialDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // If we get here, all retries failed
  throw lastError
}

const createPrismaClient = () => {
  const logQueries = process.env.PRISMA_LOG === 'true'

  const client = new PrismaClient({
    log: logQueries
      ? [
          {
            emit: 'event',
            level: 'query',
          },
          {
            emit: 'stdout',
            level: 'error',
          },
          {
            emit: 'stdout',
            level: 'warn',
          },
        ]
      : ['error', 'warn'],
  })

  // Log queries when PRISMA_LOG is enabled
  if (logQueries) {
    client.$on(
      'query',
      (e: { query: string; params: string; duration: number }) => {
        console.log('Query: ' + e.query)
        console.log('Params: ' + e.params)
        console.log('Duration: ' + e.duration + 'ms')
        console.log('---')
      }
    )
  }

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
