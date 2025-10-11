import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
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
