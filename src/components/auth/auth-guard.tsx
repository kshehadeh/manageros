'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { UserBrief } from '../../lib/auth-types'

interface AuthGuardProps {
  children: ReactNode
  requireOrganization?: boolean
  redirectTo?: string
  fallback?: ReactNode
}

/**
 * Client component wrapper that requires authentication
 * Use this for client-side auth checks and redirects
 * Shows fallback while checking session
 */
export function AuthGuard({
  children,
  requireOrganization = false,
  redirectTo,
  fallback,
}: AuthGuardProps) {
  const { isLoaded, userId } = useAuth()
  const { user } = useUser()
  const router = useRouter()

  // Get organization info from Clerk user metadata (no API call needed)
  const managerOSOrganizationId = (user?.publicMetadata as UserBrief)
    ?.managerOSOrganizationId

  useEffect(() => {
    if (!isLoaded) {
      return
    }

    if (!userId) {
      router.push('/auth/signin')
      return
    }

    if (userId && requireOrganization && !managerOSOrganizationId) {
      router.push(redirectTo || '/organization/create')
      return
    }
  }, [
    isLoaded,
    userId,
    managerOSOrganizationId,
    requireOrganization,
    redirectTo,
    router,
  ])

  if (!isLoaded) {
    return fallback ?? null
  }

  if (!userId) {
    return fallback ?? null
  }

  if (requireOrganization && !managerOSOrganizationId) {
    return fallback ?? null
  }

  return <>{children}</>
}
