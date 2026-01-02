'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUserSettings } from '@/lib/hooks/use-user-settings'

export function TeamsViewRedirect() {
  const pathname = usePathname()
  const router = useRouter()
  const { settings, isLoaded } = useUserSettings()

  useEffect(() => {
    // Only redirect if we're on the exact base route and settings are loaded
    if (!isLoaded || pathname !== '/teams') {
      return
    }

    const defaultView = settings.teamsDefaultView || 'list'

    // Map view preference to route
    const viewRoutes: Record<string, string> = {
      list: '/teams/list',
      chart: '/teams/chart',
    }

    const targetRoute = viewRoutes[defaultView] || '/teams/list'

    // Only redirect if the target route is different from current pathname
    if (targetRoute !== pathname) {
      router.replace(targetRoute)
    }
  }, [pathname, router, settings.teamsDefaultView, isLoaded])

  return null
}
