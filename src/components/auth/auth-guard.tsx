'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

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
  const router = useRouter()
  const [userData, setUserData] = useState<{
    organizationId: string | null
  } | null>(null)

  // Fetch user data from API to get organization info
  useEffect(() => {
    if (isLoaded && userId) {
      fetch('/api/user/current')
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUserData(data.user)
          }
        })
        .catch(() => {
          // If API fails, user might not be in database yet
          setUserData({ organizationId: null })
        })
    }
  }, [isLoaded, userId])

  useEffect(() => {
    if (!isLoaded) {
      return
    }

    if (!userId) {
      router.push('/auth/signin')
      return
    }

    if (userId && requireOrganization && userData && !userData.organizationId) {
      router.push(redirectTo || '/organization/create')
      return
    }
  }, [isLoaded, userId, userData, requireOrganization, redirectTo, router])

  if (!isLoaded) {
    return fallback ?? null
  }

  if (!userId) {
    return fallback ?? null
  }

  if (requireOrganization && userData && !userData.organizationId) {
    return fallback ?? null
  }

  return <>{children}</>
}
