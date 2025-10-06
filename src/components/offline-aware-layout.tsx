'use client'

import { useState, useEffect, useRef } from 'react'
import { useNetworkStatus } from '@/hooks/use-network-status'
import { OfflineIndicator } from '@/components/offline-indicator'

interface OfflineAwareLayoutProps {
  children: React.ReactNode
}

export function OfflineAwareLayout({ children }: OfflineAwareLayoutProps) {
  const { isOnline } = useNetworkStatus()
  const [showIndicator, setShowIndicator] = useState(false)
  const [indicatorHeight, setIndicatorHeight] = useState(0)
  const indicatorRef = useRef<HTMLDivElement>(null)

  // Show indicator when going offline, hide after a delay when coming back online
  useEffect(() => {
    if (!isOnline) {
      setShowIndicator(true)
    } else if (isOnline && showIndicator) {
      // Hide indicator after 3 seconds when back online
      const timer = setTimeout(() => {
        setShowIndicator(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, showIndicator])

  // Measure indicator height when it becomes visible
  useEffect(() => {
    if (showIndicator && indicatorRef.current) {
      const height = indicatorRef.current.offsetHeight
      setIndicatorHeight(height)
    }
  }, [showIndicator])

  return (
    <div className='relative'>
      <div ref={indicatorRef}>
        <OfflineIndicator />
      </div>
      {/* Add top padding when offline indicator is visible */}
      <div
        style={{
          paddingTop: showIndicator ? `${indicatorHeight}px` : '0px',
          transition: 'padding-top 0.3s ease-in-out',
        }}
      >
        {children}
      </div>
    </div>
  )
}
