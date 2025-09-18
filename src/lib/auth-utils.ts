import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Get the current authenticated user from the session
 * Throws an error if no user is authenticated
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  return session.user
}
