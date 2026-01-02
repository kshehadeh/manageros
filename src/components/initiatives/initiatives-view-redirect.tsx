'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUserSettings } from '@/lib/hooks/use-user-settings'

export function InitiativesViewRedirect() {
  const pathname = usePathname()
  const router = useRouter()
  const { settings, isLoaded } = useUserSettings()

  useEffect(() => {
    // Only redirect if we're on the exact base route and settings are loaded
    if (!isLoaded || pathname !== '/initiatives') {
      return
    }

    const defaultView = settings.initiativesDefaultView

    // Map view preference to route
    const viewRoutes: Record<string, string> = {
      dashboard: '/initiatives',
      list: '/initiatives/list',
      slots: '/initiatives/slots',
    }

    const targetRoute = viewRoutes[defaultView]

    // Only redirect if the target route is different from current pathname
    if (targetRoute && targetRoute !== pathname) {
      router.replace(targetRoute)
    }
  }, [pathname, router, settings.initiativesDefaultView, isLoaded])

  return null
}
