'use client'

import { Suspense, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { NotificationsList } from '@/components/notifications-list'
import { NotificationsHeader } from '@/components/notifications-header'
import { useSession } from 'next-auth/react'

export default function NotificationsPage() {
  const [showAllNotifications, setShowAllNotifications] = useState(false)
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleToggleView = (showAll: boolean) => {
    setShowAllNotifications(showAll)
  }

  return (
    <div className='page-container'>
      <div className='page-header flex justify-between items-start'>
        <div>
          <h1 className='page-title'>Notifications</h1>
          <p className='page-subtitle'>
            View and manage all your notifications
          </p>
        </div>
        <NotificationsHeader
          onRefresh={handleRefresh}
          isAdmin={isAdmin}
          showAllNotifications={showAllNotifications}
          onToggleView={handleToggleView}
        />
      </div>

      <div className='page-section'>
        <Suspense fallback={<NotificationsSkeleton />}>
          <NotificationsList
            showAllOrganizationNotifications={showAllNotifications}
          />
        </Suspense>
      </div>
    </div>
  )
}

function NotificationsSkeleton() {
  return (
    <div className='space-y-4'>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className='flex items-start gap-3 p-4 border rounded-lg'>
          <Skeleton className='h-6 w-6 rounded-full' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-3 w-full' />
            <Skeleton className='h-3 w-1/2' />
          </div>
          <div className='flex gap-2'>
            <Skeleton className='h-8 w-20' />
            <Skeleton className='h-8 w-20' />
          </div>
        </div>
      ))}
    </div>
  )
}
