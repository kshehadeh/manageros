'use client'

import { useState } from 'react'
import { GenericDataTable } from '@/components/common/generic-data-table'
import { DeleteModal } from '@/components/common/delete-modal'
import { removeUserFromOrganization } from '@/lib/actions/organization'
import { organizationMembersDataTableConfig } from './data-table-config'
import { toast } from 'sonner'

interface OrganizationMembersDataTableProps {
  hideFilters?: boolean
  hideHeaders?: boolean
  settingsId?: string
  visibleColumns?: string[]
  immutableFilters?: Record<string, unknown>
  currentUserId?: string
}

export function OrganizationMembersDataTable({
  hideHeaders = true,
  currentUserId,
  ...props
}: OrganizationMembersDataTableProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)

  // Create a config with currentUserId and delete modal callback in columnProps
  const configWithProps = {
    ...organizationMembersDataTableConfig,
    columnProps: {
      ...organizationMembersDataTableConfig.columnProps,
      currentUserId,
      onDeleteClick: (memberId: string, memberName: string) => {
        setDeleteTarget({ id: memberId, name: memberName })
        setShowDeleteModal(true)
      },
    },
  }

  return (
    <>
      <GenericDataTable
        config={configWithProps}
        hideHeaders={hideHeaders}
        {...props}
      />
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteTarget(null)
        }}
        onConfirm={async () => {
          if (!deleteTarget) return

          try {
            await removeUserFromOrganization(deleteTarget.id)
            toast.success('User removed from organization')
            setShowDeleteModal(false)
            setDeleteTarget(null)
            // Trigger a refetch by dispatching a custom event
            window.dispatchEvent(new Event('organization-member:deleted'))
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : 'Failed to remove user'
            )
            throw error // Re-throw so DeleteModal can handle it
          }
        }}
        title='Remove User from Organization'
        description={`Are you sure you want to remove ${deleteTarget?.name} from your organization? This action will unlink them from any associated person record and they will lose access to the organization. This action cannot be undone.`}
        entityName='user'
      />
    </>
  )
}
