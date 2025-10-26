'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Briefcase } from 'lucide-react'
import { useJobRoles } from '@/hooks/use-job-roles'
import { useJobRolesTableSettings } from '@/hooks/use-job-roles-table-settings'
import { deleteJobRole } from '@/lib/actions/job-roles'
import type { DataTableConfig } from '@/components/common/generic-data-table'

interface JobRoleItem {
  id: string
  title: string
  description: string | null
  level: { id: string; name: string }
  domain: { id: string; name: string }
  people: Array<{ id: string; name: string }>
}

type JobRolesFilters = {
  search?: string
  levelId?: string
  domainId?: string
}

export const jobRolesDataTableConfig: DataTableConfig<
  JobRoleItem,
  JobRolesFilters
> = {
  // Entity identification
  entityType: 'jobRole',
  entityName: 'Job Role',
  entityNamePlural: 'JobRoles',

  // Get ID from entity
  getId: (entity: JobRoleItem) => entity.id,

  // Data fetching
  useDataHook: useJobRoles,

  // Settings management
  useSettingsHook: useJobRolesTableSettings,

  onEdit: (router, params) => {
    router.push(`/job-roles/${params.entityId}/edit`)
  },

  onViewDetails: (router, params) => {
    router.push(`/job-roles/${params.entityId}`)
  },

  onRowClick: (router, jobRoleId) => {
    router.push(`/job-roles/${jobRoleId}`)
  },

  // Column definitions
  createColumns: ({ onButtonClick, grouping, visibleColumns }) => {
    const isGroupedByLevel = grouping && grouping.includes('level')
    const isGroupedByDomain = grouping && grouping.includes('domain')

    return [
      {
        accessorKey: 'title',
        header: 'Title',
        size: 250,
        minSize: 200,
        maxSize: 400,
        cell: ({ row }) => {
          const jobRole = row.original
          return (
            <div className='flex flex-col gap-1'>
              <Link
                href={`/job-roles/${jobRole.id}`}
                className='font-medium text-primary hover:text-primary/90 transition-colors'
                onClick={e => e.stopPropagation()}
              >
                {jobRole.title}
              </Link>
              <span className='text-xs text-muted-foreground'>
                {jobRole.people.length} person
                {jobRole.people.length !== 1 ? 's' : ''} assigned
              </span>
            </div>
          )
        },
        meta: {
          hidden: visibleColumns?.includes('title') === false,
        },
      },
      {
        id: 'level',
        header: 'Level',
        accessorFn: row => row.level.name,
        cell: ({ row }) => {
          const jobRole = row.original
          return (
            <span className='text-muted-foreground'>{jobRole.level.name}</span>
          )
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
        meta: {
          hidden:
            visibleColumns?.includes('level') === false ||
            Boolean(isGroupedByLevel),
        },
      },
      {
        id: 'domain',
        header: () => (
          <div className='flex items-center gap-2'>
            <Briefcase className='h-4 w-4' />
            Domain
          </div>
        ),
        accessorFn: row => row.domain.name,
        cell: ({ row }) => {
          const jobRole = row.original
          return (
            <span className='text-muted-foreground'>{jobRole.domain.name}</span>
          )
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
        meta: {
          hidden:
            visibleColumns?.includes('domain') === false ||
            Boolean(isGroupedByDomain),
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const jobRole = row.original
          return (
            <div className='flex items-center justify-end'>
              <Button
                variant='ghost'
                size='sm'
                onClick={e => {
                  e.stopPropagation()
                  onButtonClick(e, jobRole.id)
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
  deleteAction: async (id: string) => {
    await deleteJobRole(id)
  },

  // UI configuration
  searchPlaceholder: 'Search job roles...',
  emptyMessage: 'No job roles found',
  loadingMessage: 'Loading job roles...',

  // Grouping and sorting options
  groupingOptions: [
    { value: 'none', label: 'No grouping' },
    { value: 'level', label: 'Group by level' },
    { value: 'domain', label: 'Group by domain' },
  ],

  sortOptions: [
    { value: 'title', label: 'Title' },
    { value: 'level', label: 'Level' },
    { value: 'domain', label: 'Domain' },
  ],
}
