'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal } from 'lucide-react'
import { RagCircle } from '@/components/rag'
import type { InitiativeWithRelations } from '@/types/initiative'
import { calculateInitiativeCompletionPercentage } from '@/lib/completion-utils'
import {
  initiativeStatusUtils,
  type InitiativeStatus,
} from '@/lib/initiative-status'
import { useInitiatives } from '@/hooks/use-initiatives'
import { useInitiativeTableSettings } from '@/hooks/use-initiative-table-settings'
import { deleteInitiative } from '@/lib/actions/initiative'
import type { DataTableConfig } from '@/components/common/generic-data-table'

type InitiativeFilters = {
  search?: string
  teamId?: string
  ownerId?: string
  rag?: string
  status?: string
  dateFrom?: string
  dateTo?: string
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
          return (
            <div className='flex items-start gap-2'>
              <div className='pt-1'>
                <RagCircle rag={initiative.rag} />
              </div>
              <div className='space-y-0.5 flex-1'>
                <div className='font-medium'>{initiative.title}</div>
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
  ],
}
