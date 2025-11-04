'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

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
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (
      status === 'authenticated' &&
      requireOrganization &&
      !session?.user?.organizationId
    ) {
      router.push(redirectTo || '/organization/create')
      return
    }
  }, [status, session, requireOrganization, redirectTo, router])

  if (status === 'loading') {
    return fallback ?? null
  }

  if (status === 'unauthenticated') {
    return fallback ?? null
  }

  if (requireOrganization && !session?.user?.organizationId) {
    return fallback ?? null
  }

  return <>{children}</>
}
