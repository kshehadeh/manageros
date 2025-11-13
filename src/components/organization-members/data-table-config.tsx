'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Shield, User, Trash2, Calendar } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateUserRole } from '@/lib/actions/organization'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useOrganizationMembersTableSettings } from '@/hooks/use-organization-members-table-settings'
import type { DataTableConfig } from '@/components/common/generic-data-table'
import { toast } from 'sonner'

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
    refetch,
    applyOptimisticUpdate,
    removeOptimisticUpdate,
    currentUserId,
    onDeleteClick,
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
      {
        id: 'actions',
        header: '',
        size: 50,
        minSize: 50,
        maxSize: 50,
        cell: ({ row }) => {
          const member = row.original
          // Get currentUserId from columnProps (passed via createColumns params)
          // If it's the current user, they can't change their own role or remove themselves
          const hasActions = currentUserId ? member.id !== currentUserId : true

          if (!hasActions) {
            return <div className='w-[50px]'></div>
          }

          const handleRoleChange = async (
            userId: string,
            newRole: 'ADMIN' | 'OWNER' | 'USER'
          ) => {
            try {
              applyOptimisticUpdate(userId, { role: newRole })
              await updateUserRole(userId, newRole)
              toast.success(`User role updated to ${newRole}`)
              refetch?.()
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : 'Failed to update role'
              )
              removeOptimisticUpdate(userId)
            }
          }

          const handleRemoveUserClick = () => {
            if (onDeleteClick && typeof onDeleteClick === 'function') {
              onDeleteClick(member.id, member.name)
            }
          }

          return (
            <div onClick={e => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={e => e.stopPropagation()}
                  >
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='end'
                  onClick={e => e.stopPropagation()}
                >
                  {member.role === 'USER' ? (
                    <>
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation()
                          handleRoleChange(member.id, 'ADMIN')
                        }}
                      >
                        <Shield className='h-4 w-4 mr-2' />
                        Make Admin
                      </DropdownMenuItem>
                      {/* Note: OWNER role assignment requires paid subscription and ownership transfer is not yet implemented */}
                    </>
                  ) : member.role === 'OWNER' ? (
                    <DropdownMenuItem disabled>
                      <Shield className='h-4 w-4 mr-2' />
                      Owner (Cannot change - billable user)
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation()
                        handleRoleChange(member.id, 'USER')
                      }}
                    >
                      <User className='h-4 w-4 mr-2' />
                      Make User
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation()
                      handleRemoveUserClick()
                    }}
                    className='text-red-600 focus:text-red-600'
                  >
                    <Trash2 className='h-4 w-4 mr-2' />
                    Remove from Organization
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
        enableSorting: false,
        enableGrouping: false,
        meta: {
          hidden: visibleColumns?.includes('actions') === false,
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
