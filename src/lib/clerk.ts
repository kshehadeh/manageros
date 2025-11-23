import { ClerkClient, createClerkClient } from '@clerk/backend'

let globalClerkClient: ClerkClient | null = null

export function getClerkClient(): ClerkClient {
  if (!globalClerkClient) {
    globalClerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY || '',
    })
  }
  return globalClerkClient
}
