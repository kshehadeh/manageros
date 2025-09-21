'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useSession } from 'next-auth/react'
import { loadUserSettings } from '@/lib/user-settings'

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const { data: session, status } = useSession()

  // Get the user's theme preference from localStorage
  const getUserTheme = React.useCallback(() => {
    if (session?.user?.id) {
      const userSettings = loadUserSettings(session.user.id)
      return userSettings.theme
    }
    return 'dark' // Default theme
  }, [session?.user?.id])

  // Use the user's theme if available, otherwise use the default
  const defaultTheme = React.useMemo(() => {
    if (status === 'loading') {
      return 'dark' // Default while loading
    }
    return getUserTheme()
  }, [status, getUserTheme])

  return (
    <NextThemesProvider {...props} defaultTheme={defaultTheme}>
      {children}
    </NextThemesProvider>
  )
}
