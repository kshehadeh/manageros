import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-utils'

interface RequireAuthServerProps {
  children: ReactNode
  requireOrganization?: boolean
  redirectTo?: string
}

/**
 * Server component wrapper that requires authentication
 * Use this inside Suspense boundaries to enable static rendering
 * Handles redirects for unauthenticated users or users without organizations
 */
export async function RequireAuthServer({
  children,
  requireOrganization = false,
  redirectTo,
}: RequireAuthServerProps) {
  const user = await getCurrentUser()

  if (requireOrganization && !user.managerOSOrganizationId) {
    redirect(redirectTo || '/organization/create')
  }

  return <>{children}</>
}
