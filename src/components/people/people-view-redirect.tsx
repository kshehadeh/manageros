'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUserSettings } from '@/lib/hooks/use-user-settings'

export function PeopleViewRedirect() {
  const pathname = usePathname()
  const router = useRouter()
  const { settings, isLoaded } = useUserSettings()

  useEffect(() => {
    // Only redirect if we're on the exact base route and settings are loaded
    if (!isLoaded || pathname !== '/people') {
      return
    }

    const defaultView = settings.peopleDefaultView || 'dashboard'

    // Map view preference to route
    const viewRoutes: Record<string, string> = {
      dashboard: '/people/dashboard',
      list: '/people/list',
      'direct-reports': '/people/direct-reports',
      chart: '/people/chart',
    }

    const targetRoute = viewRoutes[defaultView] || '/people/dashboard'

    // Only redirect if the target route is different from current pathname
    if (targetRoute !== pathname) {
      router.replace(targetRoute)
    }
  }, [pathname, router, settings.peopleDefaultView, isLoaded])

  return null
}
