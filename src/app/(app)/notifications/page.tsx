'use client'

import { useState } from 'react'
import { NotificationsDataTable } from '@/components/notifications/data-table'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { NotificationsHeader } from '@/components/notifications/notifications-header'
import { useUser } from '@clerk/nextjs'
import { UserBrief } from '../../../lib/auth-types'

export default function NotificationsPage() {
  const [showAllNotifications, setShowAllNotifications] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const { user } = useUser()

  // Get role from Clerk user metadata (no API call needed)
  const userRole = (user?.publicMetadata as UserBrief)?.role
  const isAdmin = userRole === 'ADMIN' || userRole === 'OWNER'

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleToggleView = (showAll: boolean) => {
    setShowAllNotifications(showAll)
  }

  const handleBulkActionComplete = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <PageContainer>
      <PageHeader
        title='Notifications'
        subtitle='View and manage all your notifications'
        actions={
          <NotificationsHeader
            onRefresh={handleRefresh}
            isAdmin={isAdmin}
            showAllNotifications={showAllNotifications}
            onToggleView={handleToggleView}
            onBulkActionComplete={handleBulkActionComplete}
          />
        }
      />

      <PageContent>
        <PageSection>
          <NotificationsDataTable
            key={refreshKey}
            settingsId='notifications'
            enablePagination={true}
            showAllOrganizationNotifications={showAllNotifications}
          />
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
