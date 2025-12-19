'use client'

import React from 'react'
import { User, Calendar, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useOrganizationMembersTableSettings } from '@/hooks/use-organization-members-table-settings'
import type { DataTableConfig } from '@/components/common/generic-data-table'
import { MemberActionsMenu } from './member-actions-menu'

interface OrganizationMember {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date
  person?: {
    id: string
    name: string
    role: string | null
    status: string
    team?: {
      id: string
      name: string
    } | null
  } | null
}

type OrganizationMembersFilters = {
  search?: string
  role?: string
}

interface OrganizationMembersDataTableConfigOptions {
  currentUserId: string
  currentUserRole: 'ADMIN' | 'OWNER' | 'USER'
  onRemoveClick?: (
    memberId: string,
    memberName: string,
    memberEmail: string,
    refetch: () => void
  ) => void
}

export function organizationMembersDataTableConfig({
  currentUserId,
  currentUserRole,
  onRemoveClick,
}: OrganizationMembersDataTableConfigOptions): DataTableConfig<
  OrganizationMember,
  OrganizationMembersFilters
> {
  return {
    // Entity identification
    entityType: 'organizationMember',
    entityName: 'Member',
    entityNamePlural: 'Members',

    // Data fetching
    useDataHook: useOrganizationMembers,

    // Settings management
    useSettingsHook: useOrganizationMembersTableSettings,

    // Get ID function
    getId: (member: OrganizationMember) => member.id,

    // Disable row click navigation (organization members don't have detail pages)
    onRowClick: (_router, _id, _extra) => {
      // Do nothing - prevent navigation to non-existent page
    },

    // Column definitions
    createColumns: ({
      onButtonClick,
      visibleColumns,
      grouping,
      applyOptimisticUpdate: _applyOptimisticUpdate,
      removeOptimisticUpdate: _removeOptimisticUpdate,
      currentUserId: _currentUserId,
      onDeleteClick: _onDeleteClick,
    }) => {
      const isGroupedByRole = grouping && grouping.includes('role')
      const getRoleLabel = (role: string) => {
        if (role === 'OWNER') return 'Owner'
        if (role === 'ADMIN') return 'Admin'
        if (role === 'USER') return 'User'
        return role
      }

      return [
        {
          accessorKey: 'name',
          header: 'Name',
          size: 300,
          minSize: 200,
          maxSize: 500,
          cell: ({ row }) => {
            const member = row.original
            const displayName = member.name?.trim() || '<Name not set>'
            return (
              <div className='flex flex-col gap-1'>
                <div
                  className={`font-medium ${!member.name?.trim() ? 'text-muted-foreground italic' : ''}`}
                >
                  {displayName}
                </div>
                <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                  <div className='flex items-center gap-1 text-xs'>
                    <Calendar className='h-3 w-3' />
                    <span>
                      {new Date(member.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )
          },
          meta: {
            hidden: visibleColumns?.includes('name') === false,
          },
        },
        {
          accessorKey: 'email',
          header: 'Email',
          size: 250,
          minSize: 200,
          maxSize: 400,
          cell: ({ row }) => {
            const member = row.original
            return <span className='text-muted-foreground'>{member.email}</span>
          },
          meta: {
            hidden: visibleColumns?.includes('email') === false,
          },
        },
        {
          id: 'person',
          header: 'Linked Person',
          accessorFn: row => row.person?.name || '—',
          size: 200,
          minSize: 150,
          maxSize: 300,
          cell: ({ row }) => {
            const member = row.original
            if (!member.person) {
              return <span className='text-muted-foreground'>—</span>
            }
            return (
              <div className='flex items-center gap-2 text-muted-foreground'>
                <User className='h-4 w-4' />
                <span>{member.person.name}</span>
              </div>
            )
          },
          meta: {
            hidden: visibleColumns?.includes('person') === false,
          },
        },
        {
          id: 'hasPerson',
          header: 'Linked Status',
          accessorFn: row => (row.person ? 'linked' : 'not-linked'),
          size: 150,
          minSize: 100,
          maxSize: 200,
          cell: ({ row }) => {
            const member = row.original
            return member.person ? (
              <span className='text-muted-foreground'>Linked</span>
            ) : (
              <span className='text-muted-foreground'>Not Linked</span>
            )
          },
          enableGrouping: true,
          meta: {
            hidden: true, // Hidden from UI but still functional for grouping
          },
        },
        {
          accessorKey: 'role',
          header: 'Role',
          size: 120,
          minSize: 100,
          maxSize: 150,
          cell: ({ row }) => {
            const member = row.original
            return (
              <span className='text-muted-foreground'>
                {getRoleLabel(member.role)}
              </span>
            )
          },
          meta: {
            hidden:
              visibleColumns?.includes('role') === false ||
              Boolean(isGroupedByRole),
          },
        },
        {
          id: 'actions',
          header: '',
          cell: ({ row }) => {
            const member = row.original
            // Only show actions button if current user is admin/owner and not themselves
            const canManage =
              (currentUserRole === 'ADMIN' || currentUserRole === 'OWNER') &&
              member.id !== currentUserId

            if (!canManage) {
              return null
            }

            return (
              <div className='flex items-center justify-end'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={e => {
                    e.stopPropagation()
                    onButtonClick(e, member.id)
                  }}
                >
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </div>
            )
          },
          size: 50,
          minSize: 50,
          maxSize: 50,
          enableSorting: false,
          enableHiding: false,
          meta: {
            hidden: false,
          },
        },
      ]
    },

    // Context menu items
    contextMenuItems: ({ entity, close, refetch }) => {
      const member = entity as OrganizationMember
      return (
        <MemberActionsMenu
          member={member}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          close={close}
          refetch={refetch}
          onRemoveClick={
            onRemoveClick
              ? (memberId, memberName, memberEmail) =>
                  onRemoveClick(memberId, memberName, memberEmail, refetch)
              : undefined
          }
        />
      )
    },

    // UI configuration
    searchPlaceholder: 'Search members...',
    emptyMessage: 'No members found in your organization',
    loadingMessage: 'Loading members...',

    // Grouping and sorting options
    groupingOptions: [
      { value: 'none', label: 'No grouping' },
      { value: 'role', label: 'Group by Role' },
      { value: 'hasPerson', label: 'Group by Linked Status' },
    ],
    sortOptions: [
      { value: 'name', label: 'Name' },
      { value: 'email', label: 'Email' },
      { value: 'createdAt', label: 'Created Date' },
    ],

    // Filter configuration
    hasActiveFiltersFn: filters => {
      return Boolean(filters.search || (filters.role && filters.role !== 'all'))
    },
    clearFiltersFn: () => ({
      search: '',
      role: '',
    }),
    formatFiltersSummary: filters => {
      const parts: string[] = []
      if (filters.search) {
        parts.push(`search: "${filters.search}"`)
      }
      if (filters.role && filters.role !== 'all') {
        parts.push(`role: ${filters.role}`)
      }
      return parts.join(', ')
    },

    // Group label formatting
    getGroupLabel: (groupValue: string, groupingColumn: string) => {
      if (groupingColumn === 'hasPerson') {
        return groupValue === 'linked' ? 'Linked' : 'Not Linked'
      }
      if (groupingColumn === 'role') {
        if (groupValue === 'OWNER') return 'Owner'
        if (groupValue === 'ADMIN') return 'Admin'
        if (groupValue === 'USER') return 'User'
      }
      return groupValue || 'Unassigned'
    },
  }
}
