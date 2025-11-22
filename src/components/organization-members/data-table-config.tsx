'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Shield, User, Calendar } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
    refetch: _refetch,
    applyOptimisticUpdate: _applyOptimisticUpdate,
    removeOptimisticUpdate: _removeOptimisticUpdate,
    currentUserId: _currentUserId,
    onDeleteClick: _onDeleteClick,
  }) => {
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

    const getPersonStatusBadge = (status: string) => {
      const statusColors = {
        active: 'bg-green-100 text-green-800 border-green-200',
        inactive: 'bg-gray-100 text-gray-800 border-gray-200',
        onLeave: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      }

      // Convert status to title case
      const formatStatus = (s: string) => {
        return s
          .replace(/_/g, ' ')
          .replace(/([A-Z])/g, ' $1')
          .trim()
          .split(' ')
          .map(
            word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join(' ')
      }

      return (
        <Badge
          variant='outline'
          className={`whitespace-nowrap ${
            statusColors[status as keyof typeof statusColors] ||
            statusColors.inactive
          }`}
        >
          {formatStatus(status)}
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
          return (
            <div className='flex flex-col gap-1'>
              <div className='font-medium'>{member.name}</div>
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                {member.person ? (
                  getPersonStatusBadge(member.person.status)
                ) : (
                  <Badge
                    variant='outline'
                    className='bg-gray-100 text-gray-600 border-gray-200 text-xs whitespace-nowrap'
                  >
                    Not Linked
                  </Badge>
                )}
                {member.person?.team?.name && (
                  <>
                    <span>•</span>
                    <span>{member.person.team.name}</span>
                  </>
                )}
                <span>•</span>
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
            <span className='text-muted-foreground'>{member.person.name}</span>
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
          hidden: visibleColumns?.includes('role') === false,
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
    { value: 'role', label: 'Role' },
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

  // Filter content - role filter dropdown
  filterContent: ({ settings, updateFilters }) => {
    return (
      <div className='space-y-md'>
        <div className='space-y-sm'>
          <label className='text-sm font-medium'>Role</label>
          <Select
            value={settings.filters.role || 'all'}
            onValueChange={value =>
              updateFilters({ role: value === 'all' ? '' : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder='All roles' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All roles</SelectItem>
              <SelectItem value='OWNER'>Owner</SelectItem>
              <SelectItem value='ADMIN'>Admin</SelectItem>
              <SelectItem value='USER'>User</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  },
}
