'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { MoreHorizontal, Users, Building, Briefcase } from 'lucide-react'
import type { PersonListItem } from '@/types/api'
import { PersonAvatar } from '@/components/people/person-avatar'
import { usePeople } from '@/hooks/use-people'
import { usePeopleTableSettings } from '@/hooks/use-people-table-settings'
import { deletePerson } from '@/lib/actions/person'
import type { DataTableConfig } from '@/components/common/generic-data-table'

type PeopleFilters = {
  search?: string
  teamId?: string
  managerId?: string
  jobRoleId?: string
  status?: string
}

export const peopleDataTableConfig: DataTableConfig<
  PersonListItem,
  PeopleFilters
> = {
  // Entity identification
  entityType: 'person',
  entityName: 'Person',
  entityNamePlural: 'People',

  // Data fetching
  useDataHook: usePeople,

  // Settings management
  useSettingsHook: usePeopleTableSettings,

  onEdit: (router, { entityId }) => {
    router.push(`/people/${entityId}/edit`)
  },

  onViewDetails: (router, { entityId }) => {
    router.push(`/people/${entityId}`)
  },

  // Column definitions
  createColumns: ({ onButtonClick, grouping, visibleColumns }) => {
    const isGroupedByTeam = grouping && grouping.includes('team')
    const getStatusBadgeVariant = (status: string): BadgeVariant => {
      switch (status) {
        case 'active':
          return 'default'
        case 'inactive':
          return 'secondary'
        case 'on_leave':
          return 'outline'
        case 'terminated':
          return 'destructive'
        default:
          return 'secondary'
      }
    }

    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'active':
          return 'Active'
        case 'inactive':
          return 'Inactive'
        case 'on_leave':
          return 'On Leave'
        case 'terminated':
          return 'Terminated'
        default:
          return status
      }
    }

    return [
      {
        accessorKey: 'name',
        header: 'Name',
        size: 250,
        minSize: 200,
        maxSize: 400,
        cell: ({ row }) => {
          const person = row.original
          return (
            <div className='flex items-center gap-3'>
              <PersonAvatar
                name={person.name}
                avatar={person.avatarUrl}
                size='sm'
                className='flex-shrink-0'
              />
              <div className='flex flex-col'>
                <Link
                  href={`/people/${person.id}`}
                  className='font-medium text-primary hover:text-primary/90 transition-colors'
                  onClick={e => e.stopPropagation()}
                >
                  {person.name}
                </Link>
                <span className='text-xs text-muted-foreground'>
                  {person.email}
                </span>
              </div>
            </div>
          )
        },
        meta: {
          hidden: visibleColumns?.includes('name') === false,
        },
      },
      {
        id: 'team',
        header: () => (
          <div className='flex items-center gap-2'>
            <Users className='h-4 w-4' />
            Team
          </div>
        ),
        accessorFn: row => row.teamName || '—',
        cell: ({ row }) => {
          const person = row.original
          if (!person.teamName) {
            return <span className='text-muted-foreground'>—</span>
          }
          return (
            <span className='text-muted-foreground'>{person.teamName}</span>
          )
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
        meta: {
          hidden:
            visibleColumns?.includes('team') === false ||
            Boolean(isGroupedByTeam),
        },
      },
      {
        id: 'manager',
        header: () => (
          <div className='flex items-center gap-2'>
            <Building className='h-4 w-4' />
            Manager
          </div>
        ),
        accessorFn: row => row.managerName || '—',
        cell: ({ row }) => {
          const person = row.original
          if (!person.managerName) {
            return <span className='text-muted-foreground'>—</span>
          }
          return (
            <span className='text-muted-foreground'>{person.managerName}</span>
          )
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
        meta: {
          hidden: visibleColumns?.includes('manager') === false,
        },
      },
      {
        id: 'jobRole',
        header: () => (
          <div className='flex items-center gap-2'>
            <Briefcase className='h-4 w-4' />
            Role
          </div>
        ),
        accessorFn: row => row.jobRoleTitle || '—',
        cell: ({ row }) => {
          const person = row.original
          if (!person.jobRoleTitle) {
            return <span className='text-muted-foreground'>—</span>
          }
          return (
            <span className='text-muted-foreground'>{person.jobRoleTitle}</span>
          )
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
        meta: {
          hidden: visibleColumns?.includes('jobRole') === false,
        },
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => {
          const person = row.original
          return (
            <Badge variant={getStatusBadgeVariant(person.status)}>
              {getStatusLabel(person.status)}
            </Badge>
          )
        },
        size: 120,
        minSize: 100,
        maxSize: 150,
        meta: {
          hidden: visibleColumns?.includes('status') === false,
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const person = row.original
          return (
            <div className='flex items-center justify-end'>
              <Button
                variant='ghost'
                size='sm'
                onClick={e => {
                  e.stopPropagation()
                  onButtonClick(e, person.id)
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

  // Actions
  deleteAction: deletePerson,

  // UI configuration
  searchPlaceholder: 'Search people...',
  emptyMessage: 'No people found',
  loadingMessage: 'Loading people...',

  // Grouping and sorting options
  groupingOptions: [
    { value: 'none', label: 'No grouping' },
    { value: 'team', label: 'Group by team' },
    { value: 'manager', label: 'Group by manager' },
    { value: 'jobRole', label: 'Group by job role' },
    { value: 'status', label: 'Group by status' },
  ],
  sortOptions: [
    { value: 'name', label: 'Name' },
    { value: 'status', label: 'Status' },
    { value: 'teamName', label: 'Team' },
  ],
}
