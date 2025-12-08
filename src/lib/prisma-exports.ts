/**
 * Prisma exports wrapper
 *
 * This file re-exports everything from the generated Prisma client
 * to maintain compatibility with @/generated/prisma imports.
 *
 * With Prisma 7's prisma-client provider, the main export is in client.ts,
 * so this wrapper allows us to keep using @/generated/prisma imports
 * without modifying generated files.
 */

export * from '@/generated/prisma/client'
