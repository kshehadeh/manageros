'use client'

import { useState, useEffect, useCallback } from 'react'

interface NetworkStatus {
  isOnline: boolean
  isReconnecting: boolean
  lastOnlineTime: Date | null
  connectionType: string | null
}

interface UseNetworkStatusOptions {
  onOnline?: () => void
  onOffline?: () => void
  onReconnect?: () => void
}

export function useNetworkStatus({
  onOnline,
  onOffline,
  onReconnect,
}: UseNetworkStatusOptions = {}) {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isReconnecting: false,
    lastOnlineTime:
      typeof navigator !== 'undefined' && navigator.onLine ? new Date() : null,
    connectionType: null,
  })

  const handleOnline = useCallback(() => {
    const wasOffline = !networkStatus.isOnline
    const now = new Date()

    setNetworkStatus(prev => ({
      ...prev,
      isOnline: true,
      isReconnecting: false,
      lastOnlineTime: now,
    }))

    if (wasOffline) {
      onReconnect?.()
    }
    onOnline?.()
  }, [networkStatus.isOnline, onOnline, onReconnect])

  const handleOffline = useCallback(() => {
    setNetworkStatus(prev => ({
      ...prev,
      isOnline: false,
      isReconnecting: false,
    }))
    onOffline?.()
  }, [onOffline])

  const startReconnecting = useCallback(() => {
    setNetworkStatus(prev => ({
      ...prev,
      isReconnecting: true,
    }))
  }, [])

  const stopReconnecting = useCallback(() => {
    setNetworkStatus(prev => ({
      ...prev,
      isReconnecting: false,
    }))
  }, [])

  // Detect connection type if available
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (
        navigator as Navigator & {
          connection?: {
            effectiveType?: string
            type?: string
            addEventListener: (_type: string, _listener: () => void) => void
            removeEventListener: (_type: string, _listener: () => void) => void
          }
        }
      ).connection
      if (connection) {
        setNetworkStatus(prev => ({
          ...prev,
          connectionType:
            connection.effectiveType || connection.type || 'unknown',
        }))

        const handleConnectionChange = () => {
          setNetworkStatus(prev => ({
            ...prev,
            connectionType:
              connection.effectiveType || connection.type || 'unknown',
          }))
        }

        connection.addEventListener('change', handleConnectionChange)
        return () =>
          connection.removeEventListener('change', handleConnectionChange)
      }
    }
  }, [])

  // Listen for online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  return {
    ...networkStatus,
    startReconnecting,
    stopReconnecting,
  }
}
