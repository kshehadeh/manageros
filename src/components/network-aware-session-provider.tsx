'use client'

import { SessionProvider } from 'next-auth/react'
import { useNetworkStatus } from '@/hooks/use-network-status'
import { useEffect, useState } from 'react'

interface NetworkAwareSessionProviderProps {
  children: React.ReactNode
  refetchInterval?: number
  refetchOnWindowFocus?: boolean
  refetchWhenOffline?: boolean
}

export default function NetworkAwareSessionProvider({
  children,
  refetchInterval = 0,
  refetchOnWindowFocus = true,
}: NetworkAwareSessionProviderProps) {
  const { isOnline } = useNetworkStatus()
  const [sessionRefetchInterval, setSessionRefetchInterval] =
    useState(refetchInterval)

  // Adjust session refetch behavior based on network status
  useEffect(() => {
    if (isOnline) {
      // Resume normal session refetching when online
      setSessionRefetchInterval(refetchInterval)
    } else {
      // Disable session refetching when offline to prevent errors
      setSessionRefetchInterval(0)
    }
  }, [isOnline, refetchInterval])

  return (
    <SessionProvider
      refetchInterval={sessionRefetchInterval}
      refetchOnWindowFocus={refetchOnWindowFocus && isOnline}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  )
}
