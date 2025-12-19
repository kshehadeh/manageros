'use client'

import { useState } from 'react'
import { GenericDataTable } from '@/components/common/generic-data-table'
import { organizationMembersDataTableConfig } from './data-table-config'
import { MemberRemoveModal } from './member-remove-modal'

interface OrganizationMembersDataTableProps {
  hideFilters?: boolean
  hideHeaders?: boolean
  settingsId?: string
  visibleColumns?: string[]
  immutableFilters?: Record<string, unknown>
  currentUserId?: string
  currentUserRole?: 'ADMIN' | 'OWNER' | 'USER'
}

export function OrganizationMembersDataTable({
  hideHeaders = true,
  currentUserId,
  currentUserRole,
  ...props
}: OrganizationMembersDataTableProps) {
  const [removeModalState, setRemoveModalState] = useState<{
    isOpen: boolean
    memberId: string | null
    memberName: string | null
    memberEmail: string | null
    refetch: (() => void) | null
  }>({
    isOpen: false,
    memberId: null,
    memberName: null,
    memberEmail: null,
    refetch: null,
  })

  return (
    <>
      <GenericDataTable
        config={organizationMembersDataTableConfig({
          currentUserId: currentUserId || '',
          currentUserRole: currentUserRole || 'USER',
          onRemoveClick: (
            memberId: string,
            memberName: string,
            memberEmail: string,
            refetch: () => void
          ) => {
            setRemoveModalState({
              isOpen: true,
              memberId,
              memberName,
              memberEmail,
              refetch,
            })
          },
        })}
        hideHeaders={hideHeaders}
        {...props}
      />
      <MemberRemoveModal
        isOpen={removeModalState.isOpen}
        memberId={removeModalState.memberId}
        memberName={removeModalState.memberName}
        memberEmail={removeModalState.memberEmail}
        onClose={() => {
          setRemoveModalState({
            isOpen: false,
            memberId: null,
            memberName: null,
            memberEmail: null,
            refetch: null,
          })
        }}
        onSuccess={() => {
          removeModalState.refetch?.()
        }}
      />
    </>
  )
}
