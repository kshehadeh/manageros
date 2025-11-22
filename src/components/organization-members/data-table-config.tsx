'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Shield, User, Calendar } from 'lucide-react'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useOrganizationMembersTableSettings } from '@/hooks/use-organization-members-table-settings'
import type { DataTableConfig } from '@/components/common/generic-data-table'

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

export const organizationMembersDataTableConfig: DataTableConfig<
  OrganizationMember,
  OrganizationMembersFilters
> = {
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
    onButtonClick: _onButtonClick,
    visibleColumns,
    grouping,
    refetch: _refetch,
    applyOptimisticUpdate: _applyOptimisticUpdate,
    removeOptimisticUpdate: _removeOptimisticUpdate,
    currentUserId: _currentUserId,
    onDeleteClick: _onDeleteClick,
  }) => {
    const isGroupedByRole = grouping && grouping.includes('role')
    const getRoleBadge = (role: string) => {
      if (role === 'OWNER') {
        return (
          <Badge
            variant='default'
            className='bg-purple-100 text-purple-800 border-purple-200'
          >
            <Shield className='h-3 w-3 mr-1' />
            Owner
          </Badge>
        )
      }
      if (role === 'ADMIN') {
        return (
          <Badge
            variant='default'
            className='bg-blue-100 text-blue-800 border-blue-200'
          >
            <Shield className='h-3 w-3 mr-1' />
            Admin
          </Badge>
        )
      }
      return (
        <Badge variant='secondary'>
          <User className='h-3 w-3 mr-1' />
          User
        </Badge>
      )
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
                  <span>{new Date(member.createdAt).toLocaleDateString()}</span>
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
          return getRoleBadge(member.role)
        },
        meta: {
          hidden:
            visibleColumns?.includes('role') === false ||
            Boolean(isGroupedByRole),
        },
      },
    ]
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
    return Boolean(filters.search)
  },
  clearFiltersFn: () => ({
    search: '',
  }),
  formatFiltersSummary: filters => {
    const parts: string[] = []
    if (filters.search) {
      parts.push(`search: "${filters.search}"`)
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
