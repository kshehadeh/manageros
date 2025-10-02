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
            isAdmin={isAdmin}
          />
        </Suspense>
      </div>
    </div>
  )
}

function NotificationsSkeleton() {
  return (
    <div className='rounded-md border'>
      <div className='border-b p-4'>
        <div className='grid grid-cols-7 gap-4'>
          <Skeleton className='h-4 w-12' />
          <Skeleton className='h-4 w-16' />
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-4 w-16' />
          <Skeleton className='h-4 w-12' />
          <Skeleton className='h-4 w-16' />
          <Skeleton className='h-4 w-20' />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className='border-b p-4 last:border-b-0'>
          <div className='grid grid-cols-7 gap-4 items-center'>
            <Skeleton className='h-5 w-5 rounded-full' />
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-3 w-full' />
            <Skeleton className='h-6 w-16' />
            <Skeleton className='h-3 w-20' />
            <Skeleton className='h-3 w-24' />
            <Skeleton className='h-8 w-20' />
          </div>
        </div>
      ))}
    </div>
  )
}
