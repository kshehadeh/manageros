'use client'

import { useEffect, useState } from 'react'

interface MeetingStatusBadgeProps {
  scheduledAt: Date
  isRecurring: boolean
}

export function MeetingStatusBadge({
  scheduledAt,
  isRecurring,
}: MeetingStatusBadgeProps) {
  const [isPast, setIsPast] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const scheduledDate = new Date(scheduledAt)
    setIsPast(scheduledDate < new Date())
  }, [scheduledAt])

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return null
  }

  if (isPast && !isRecurring) {
    return <span className='text-muted-foreground'>Past Meeting</span>
  }

  return null
}
