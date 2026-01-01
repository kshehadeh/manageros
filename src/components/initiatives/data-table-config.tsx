'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { MoreHorizontal, CheckCircle2, XCircle } from 'lucide-react'
import { RagCircle } from '@/components/rag'
import type { InitiativeWithRelations } from '@/types/initiative'
import { calculateInitiativeCompletionPercentage } from '@/lib/completion-utils'
import {
  initiativeStatusUtils,
  INITIATIVE_STATUS,
  COMPLETED_STATUSES,
  ALL_INITIATIVE_STATUSES,
  type InitiativeStatus,
} from '@/lib/initiative-status'
import {
  MultiSelect,
  type MultiSelectOption,
} from '@/components/ui/multi-select'
import { usePeopleCache, useTeamsCache } from '@/hooks/use-organization-cache'
import { useInitiatives } from '@/hooks/use-initiatives'
import {
  useInitiativeTableSettings,
  initiativeTableUrlConfig,
} from '@/hooks/use-initiative-table-settings'
import { deleteInitiative } from '@/lib/actions/initiative'
import type { DataTableConfig } from '@/components/common/generic-data-table'
import { taskPriorityUtils, type TaskPriority } from '@/lib/task-priority'

type InitiativeFilters = {
  search?: string
  teamId?: string | string[]
  ownerId?: string | string[]
  rag?: string | string[]
  status?: string | string[]
  dateFrom?: string
  dateTo?: string
}

function InitiativeFilterContent({
  settings,
  updateFilters,
}: {
  settings: { filters: InitiativeFilters } & Record<string, unknown>
  updateFilters: (filters: Partial<InitiativeFilters>) => void
}) {
  const { people } = usePeopleCache()
  const { teams } = useTeamsCache()

  const statusOptions: MultiSelectOption[] = ALL_INITIATIVE_STATUSES.map(
    status => ({
      value: status,
      label: initiativeStatusUtils.getLabel(status),
    })
  )

  const ragOptions: MultiSelectOption[] = [
    { value: 'green', label: 'Green' },
    { value: 'amber', label: 'Amber' },
    { value: 'red', label: 'Red' },
  ]

  const teamOptions: MultiSelectOption[] = teams.map(team => ({
    value: team.id,
    label: team.name,
  }))

  const ownerOptions: MultiSelectOption[] = people.map(person => ({
    value: person.id,
    label: person.name,
  }))

  return (
    <div className='space-y-3'>
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Status</label>
        <MultiSelect
          options={statusOptions}
          selected={
            Array.isArray(settings.filters.status)
              ? settings.filters.status
              : settings.filters.status
                ? [settings.filters.status]
                : []
          }
          onChange={selected => updateFilters({ status: selected })}
          placeholder='All statuses'
        />
      </div>

      <div className='space-y-2'>
        <label className='text-sm font-medium'>RAG Status</label>
        <MultiSelect
          options={ragOptions}
          selected={
            Array.isArray(settings.filters.rag)
              ? settings.filters.rag
              : settings.filters.rag
                ? [settings.filters.rag]
                : []
          }
          onChange={selected => updateFilters({ rag: selected })}
          placeholder='All RAG statuses'
        />
      </div>

      <div className='space-y-2'>
        <label className='text-sm font-medium'>Team</label>
        <MultiSelect
          options={teamOptions}
          selected={
            Array.isArray(settings.filters.teamId)
              ? settings.filters.teamId
              : settings.filters.teamId
                ? [settings.filters.teamId]
                : []
          }
          onChange={selected => updateFilters({ teamId: selected })}
          placeholder='All teams'
        />
      </div>

      <div className='space-y-2'>
        <label className='text-sm font-medium'>Owner</label>
        <MultiSelect
          options={ownerOptions}
          selected={
            Array.isArray(settings.filters.ownerId)
              ? settings.filters.ownerId
              : settings.filters.ownerId
                ? [settings.filters.ownerId]
                : []
          }
          onChange={selected => updateFilters({ ownerId: selected })}
          placeholder='All owners'
        />
      </div>
    </div>
  )
}

export const initiativeDataTableConfig: DataTableConfig<
  InitiativeWithRelations,
  InitiativeFilters
> = {
  // Entity identification
  entityType: 'initiative',
  entityName: 'Initiative',
  entityNamePlural: 'Initiatives',

  // Data fetching
  useDataHook: useInitiatives,

  // Settings management
  useSettingsHook: useInitiativeTableSettings,

  // URL synchronization
  urlConfig: initiativeTableUrlConfig,

  onRowClick: (router, initiativeId) => {
    router.push(`/initiatives/${initiativeId}`)
  },

  onEdit: (router, { entityId }) => {
    router.push(`/initiatives/${entityId}/edit`)
  },

  onViewDetails: (router, { entityId }) => {
    router.push(`/initiatives/${entityId}`)
  },

  // Column definitions
  createColumns: ({ onButtonClick, visibleColumns }) => {
    return [
      {
        id: 'rag',
        header: 'RAG',
        accessorKey: 'rag',
        cell: ({ row }) => {
          const initiative = row.original
          const isDone = initiative.status === INITIATIVE_STATUS.DONE
          const isCancelled = initiative.status === INITIATIVE_STATUS.CANCELED

          if (isDone) {
            return (
              <div className='flex items-start justify-center pt-1'>
                <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-500' />
              </div>
            )
          }
          if (isCancelled) {
            return (
              <div className='flex items-start justify-center pt-1'>
                <XCircle className='h-4 w-4 text-red-600 dark:text-red-500' />
              </div>
            )
          }
          return (
            <div className='flex items-start justify-center pt-1'>
              <RagCircle rag={initiative.rag} />
            </div>
          )
        },
        enableGrouping: false,
        size: 60,
        minSize: 50,
        maxSize: 80,
        meta: {
          hidden: true, // Hidden from UI but still functional for grouping
        },
      },
      {
        accessorKey: 'title',
        header: 'Initiative',
        size: 500,
        minSize: 300,
        maxSize: 1000,
        cell: ({ row }) => {
          const initiative = row.original
          const teamName = initiative.team?.name || 'No team'
          const statusLabel = initiativeStatusUtils.getLabel(
            initiative.status as InitiativeStatus
          )
          const isDone = initiative.status === INITIATIVE_STATUS.DONE
          const isCancelled = initiative.status === INITIATIVE_STATUS.CANCELED
          const isCompleted = isDone || isCancelled

          // Render status icon or RAG circle
          const renderStatusIndicator = () => {
            if (isDone) {
              return (
                <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-500' />
              )
            }
            if (isCancelled) {
              return (
                <XCircle className='h-4 w-4 text-red-600 dark:text-red-500' />
              )
            }
            return <RagCircle rag={initiative.rag} />
          }

          return (
            <div className='flex items-start gap-2'>
              <div className='pt-1'>{renderStatusIndicator()}</div>
              <div className='space-y-0.5 flex-1'>
                <div
                  className={`font-medium ${isCompleted ? 'line-through' : ''}`}
                >
                  {initiative.title}
                </div>
                <div className='text-xs text-muted-foreground'>
                  {teamName} • {statusLabel}
                </div>
              </div>
            </div>
          )
        },
        meta: {
          hidden: visibleColumns?.includes('title') === false,
        },
      },
      {
        id: 'teamName',
        header: 'Team',
        accessorFn: row => row.team?.name || '—',
        cell: ({ row }) => {
          const initiative = row.original
          return (
            <span className='text-muted-foreground'>
              {initiative.team?.name || '—'}
            </span>
          )
        },
        size: 150,
        minSize: 100,
        maxSize: 200,
        meta: {
          hidden: true, // Hidden from UI but still functional for sorting/grouping
        },
      },
      {
        id: 'owners',
        header: 'Owner',
        accessorFn: row =>
          row.owners.length > 0 ? row.owners[0].person.name : '—',
        cell: ({ row }) => {
          const initiative = row.original
          if (initiative.owners.length === 0) {
            return <span className='text-muted-foreground'>—</span>
          }
          const firstName = initiative.owners[0].person.name
          const additionalCount = initiative.owners.length - 1
          return (
            <span className='text-muted-foreground'>
              {firstName}
              {additionalCount > 0 && (
                <span className='text-xs'>
                  {' '}
                  and {additionalCount} other{additionalCount > 1 ? 's' : ''}
                </span>
              )}
            </span>
          )
        },
        size: 150,
        minSize: 100,
        maxSize: 200,
        meta: {
          hidden: true, // Hidden from UI but still functional for sorting/grouping
        },
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => {
          const initiative = row.original
          const statusInfo = initiativeStatusUtils.getVariant(
            initiative.status as InitiativeStatus
          )
          return (
            <Badge variant={statusInfo}>
              {initiativeStatusUtils.getLabel(
                initiative.status as InitiativeStatus
              )}
            </Badge>
          )
        },
        size: 120,
        minSize: 100,
        maxSize: 150,
        meta: {
          hidden: true, // Hidden from UI but still functional for sorting/grouping
        },
      },
      {
        id: 'completion',
        header: 'Progress',
        accessorFn: row => calculateInitiativeCompletionPercentage(row),
        cell: ({ row }) => {
          const initiative = row.original
          const completionPercentage =
            calculateInitiativeCompletionPercentage(initiative)
          return (
            <div className='flex items-center gap-2'>
              <div className='flex-1 bg-muted rounded-full h-2'>
                <div
                  className='bg-primary h-2 rounded-full transition-all'
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className='text-xs text-muted-foreground min-w-[3rem]'>
                {completionPercentage}%
              </span>
            </div>
          )
        },
        size: 120,
        minSize: 100,
        maxSize: 150,
        meta: {
          hidden: true, // Hidden from UI but still functional for sorting/grouping
        },
      },
      {
        id: 'priority',
        header: 'Priority',
        accessorKey: 'priority',
        cell: ({ row }) => {
          const initiative = row.original
          const priority = initiative.priority as TaskPriority
          return (
            <Badge
              variant={taskPriorityUtils.getVariant(priority) as BadgeVariant}
            >
              {taskPriorityUtils.getLabel(priority)}
            </Badge>
          )
        },
        size: 120,
        minSize: 100,
        maxSize: 150,
        meta: {
          hidden: true, // Hidden from UI but still functional for sorting/grouping
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const initiative = row.original
          return (
            <div className='flex items-center justify-end'>
              <Button
                variant='ghost'
                size='sm'
                onClick={e => {
                  e.stopPropagation()
                  onButtonClick(e, initiative.id)
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
  deleteAction: deleteInitiative,

  // UI configuration
  searchPlaceholder: 'Search initiatives...',
  emptyMessage: 'No initiatives found',
  loadingMessage: 'Loading initiatives...',

  // Grouping and sorting options
  groupingOptions: [
    { value: 'none', label: 'No grouping' },
    { value: 'teamName', label: 'Group by team' },
    { value: 'owners', label: 'Group by owner' },
    { value: 'status', label: 'Group by status' },
    { value: 'rag', label: 'Group by RAG status' },
  ],
  sortOptions: [
    { value: 'title', label: 'Title' },
    { value: 'status', label: 'Status' },
    { value: 'rag', label: 'RAG Status' },
    { value: 'priority', label: 'Priority' },
  ],

  // Group label formatting
  getGroupLabel: (groupValue: string, groupingColumn: string) => {
    if (groupingColumn === 'status') {
      return initiativeStatusUtils.getLabel(groupValue as InitiativeStatus)
    }
    if (groupingColumn === 'rag') {
      // Capitalize first letter of RAG status (green -> Green, amber -> Amber, red -> Red)
      return groupValue.charAt(0).toUpperCase() + groupValue.slice(1)
    }
    return groupValue || 'Unassigned'
  },

  // Custom row className for completed initiatives
  getRowClassName: (initiative: InitiativeWithRelations) => {
    if (COMPLETED_STATUSES.includes(initiative.status as InitiativeStatus)) {
      return 'bg-muted/30'
    }
    return ''
  },

  // Filter configuration
  filterContent: ({ settings, updateFilters }) => (
    <InitiativeFilterContent
      settings={settings}
      updateFilters={updateFilters}
    />
  ),

  hasActiveFiltersFn: filters => {
    return (
      filters.search !== '' ||
      (filters.status && filters.status.length > 0) ||
      (filters.rag && filters.rag.length > 0) ||
      (filters.teamId && filters.teamId.length > 0) ||
      (filters.ownerId && filters.ownerId.length > 0) ||
      filters.dateFrom !== '' ||
      filters.dateTo !== ''
    )
  },

  clearFiltersFn: () => ({
    search: '',
    status: [],
    rag: [],
    teamId: [],
    ownerId: [],
    dateFrom: '',
    dateTo: '',
  }),
}
