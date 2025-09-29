import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { NotificationsList } from '@/components/notifications-list'

export default function NotificationsPage() {
  return (
    <div className='container mx-auto py-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold'>Notifications</h1>
        <p className='text-muted-foreground'>
          View and manage all your notifications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<NotificationsSkeleton />}>
            <NotificationsList />
          </Suspense>
        </CardContent>
      </Card>
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
