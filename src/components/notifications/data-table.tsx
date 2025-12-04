'use client'

import { useState, useCallback } from 'react'
import { GenericDataTable } from '@/components/common/generic-data-table'
import { notificationsDataTableConfig } from './data-table-config'
import { NotificationDetailModal } from './notification-detail-modal'
import { NotificationWithResponse } from '@/lib/actions/notification'

interface NotificationsDataTableProps {
  hideFilters?: boolean
  hideHeaders?: boolean
  settingsId?: string
  page?: number
  limit?: number
  enablePagination?: boolean
  visibleColumns?: string[]
  immutableFilters?: Record<string, unknown>
  showAllOrganizationNotifications?: boolean
}

export function NotificationsDataTable({
  hideHeaders = false,
  showAllOrganizationNotifications = false,
  ...props
}: NotificationsDataTableProps) {
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationWithResponse | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedNotification(null)
  }, [])

  const handleActionComplete = useCallback(() => {
    // Refetch will be triggered by the table's internal mechanism
    // when the modal closes after an action
  }, [])

  // Override the config's onRowClick to capture the entity
  const configWithRowClick = {
    ...notificationsDataTableConfig,
    onRowClick: (
      _router: unknown,
      _id: string,
      entity?: NotificationWithResponse
    ) => {
      if (entity) {
        setSelectedNotification(entity)
        setIsModalOpen(true)
      }
    },
  }

  return (
    <>
      <GenericDataTable
        config={configWithRowClick}
        hideHeaders={hideHeaders}
        immutableFilters={{
          ...props.immutableFilters,
          showAllOrganizationNotifications,
        }}
        {...props}
      />
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onActionComplete={handleActionComplete}
      />
    </>
  )
}
