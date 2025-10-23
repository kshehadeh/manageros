'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Calendar, Users } from 'lucide-react'
import { OneOnOneListItem } from '@/hooks/use-oneonones'
import { useOneOnOnes } from '@/hooks/use-oneonones'
import { useOneOnOneTableSettings } from '@/hooks/use-oneonone-table-settings'
import { deleteOneOnOne } from '@/lib/actions/oneonone'
import type { DataTableConfig } from '@/components/common/generic-data-table'

// Get relative date group for a given date
function getRelativeDateGroup(date: Date | string | null): string {
  if (!date) return 'unscheduled'

  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return 'invalid'

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const meetingDate = new Date(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate()
  )

  const diffTime = today.getTime() - meetingDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  // Future dates (including today)
  if (diffDays <= 0) {
    return '0-today'
  }

  // Yesterday
  if (diffDays === 1) {
    return '1-yesterday'
  }

  // Last 7 days (excluding yesterday)
  if (diffDays <= 7) {
    return '2-last-week'
  }

  // Last 30 days (excluding last week)
  if (diffDays <= 30) {
    return '3-last-month'
  }

  // Everything else
  return '4-older'
}

// Format relative date group label
function formatRelativeDateGroupLabel(groupKey: string): string {
  switch (groupKey) {
    case 'unscheduled':
      return 'Unscheduled'
    case '0-today':
      return 'Today'
    case '1-yesterday':
      return 'Yesterday'
    case '2-last-week':
      return 'Last Week'
    case '3-last-month':
      return 'Last Month'
    case '4-older':
      return 'Older'
    default:
      return groupKey
  }
}

type OneOnOneFilters = {
  search?: string
  managerId?: string
  reportId?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  scheduledFrom?: string
  scheduledTo?: string
}

export const oneOnOneDataTableConfig: DataTableConfig<
  OneOnOneListItem,
  OneOnOneFilters
> = {
  // Entity identification
  entityType: 'oneonones',
  entityName: 'One-on-One',
  entityNamePlural: 'oneonones',

  // Data fetching
  useDataHook: useOneOnOnes,

  // Settings management
  useSettingsHook: useOneOnOneTableSettings,

  // Column definitions
  createColumns: ({ onButtonClick, visibleColumns, grouping }) => {
    // Check which column is being grouped by to hide it
    const isGroupedByManager = grouping && grouping.includes('manager')
    const isGroupedByReport = grouping && grouping.includes('report')
    const isGroupedByDate = grouping && grouping.includes('scheduledAt')

    return [
      {
        accessorKey: 'participants',
        header: 'Participants',
        size: 500,
        minSize: 300,
        maxSize: 1000,
        cell: ({ row }) => {
          const oneOnOne = row.original
          return (
            <div className='flex items-start gap-3'>
              <div className='space-y-0.5 flex-1'>
                <div className='flex items-center gap-2'>
                  <Users className='h-4 w-4 text-muted-foreground' />
                  <Link
                    href={`/people/${oneOnOne.manager.id}`}
                    className='font-medium link-hover'
                    onClick={e => e.stopPropagation()}
                  >
                    {oneOnOne.manager.name}
                  </Link>
                  <span className='text-muted-foreground'>↔</span>
                  <Link
                    href={`/people/${oneOnOne.report.id}`}
                    className='font-medium link-hover'
                    onClick={e => e.stopPropagation()}
                  >
                    {oneOnOne.report.name}
                  </Link>
                </div>
                {oneOnOne.notes && (
                  <div
                    className='text-sm text-muted-foreground break-words mt-2'
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {oneOnOne.notes}
                  </div>
                )}
              </div>
            </div>
          )
        },
        meta: {
          hidden: visibleColumns?.includes('participants') === false,
        },
      },
      {
        id: 'manager',
        header: 'Manager',
        accessorFn: row => row.manager.name,
        cell: ({ row }) => {
          const oneOnOne = row.original
          return (
            <Link
              href={`/people/${oneOnOne.manager.id}`}
              className='font-medium link-hover'
              onClick={e => e.stopPropagation()}
            >
              {oneOnOne.manager.name}
            </Link>
          )
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
        meta: {
          hidden:
            visibleColumns?.includes('manager') === false || isGroupedByManager,
        },
      },
      {
        id: 'report',
        header: 'Report',
        accessorFn: row => row.report.name,
        cell: ({ row }) => {
          const oneOnOne = row.original
          return (
            <Link
              href={`/people/${oneOnOne.report.id}`}
              className='font-medium link-hover'
              onClick={e => e.stopPropagation()}
            >
              {oneOnOne.report.name}
            </Link>
          )
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
        meta: {
          hidden:
            visibleColumns?.includes('report') === false || isGroupedByReport,
        },
      },
      {
        id: 'scheduledAt',
        header: 'Scheduled',
        accessorFn: row => {
          // When grouping by date, return the relative date group
          // Otherwise return the actual date for sorting
          if (grouping && grouping.includes('scheduledAt')) {
            return getRelativeDateGroup(row.scheduledAt)
          }
          return row.scheduledAt
        },
        cell: ({ row }) => {
          const oneOnOne = row.original
          return (
            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4 text-muted-foreground' />
              <span>
                {oneOnOne.scheduledAt
                  ? new Date(oneOnOne.scheduledAt).toLocaleString()
                  : 'TBD'}
              </span>
            </div>
          )
        },
        size: 200,
        minSize: 150,
        maxSize: 300,
        meta: {
          hidden:
            visibleColumns?.includes('scheduledAt') === false ||
            isGroupedByDate,
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const oneOnOne = row.original
          return (
            <div className='flex items-center justify-end'>
              <Button
                variant='ghost'
                size='sm'
                onClick={e => {
                  e.stopPropagation()
                  onButtonClick(e, oneOnOne.id)
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
  deleteAction: deleteOneOnOne,

  // UI configuration
  searchPlaceholder: 'Search one-on-ones...',
  emptyMessage: 'No one-on-ones found',
  loadingMessage: 'Loading one-on-ones...',

  // Grouping and sorting options
  groupingOptions: [
    { value: 'none', label: 'No grouping' },
    { value: 'manager', label: 'Group by manager' },
    { value: 'report', label: 'Group by report' },
    { value: 'scheduledAt', label: 'Group by date' },
  ],
  sortOptions: [
    { value: 'participants', label: 'Participants' },
    { value: 'manager', label: 'Manager' },
    { value: 'report', label: 'Report' },
    { value: 'scheduledAt', label: 'Scheduled Date' },
  ],

  // Custom group label formatting
  getGroupLabel: (groupValue: string, groupingColumn: string) => {
    if (groupingColumn === 'scheduledAt') {
      return formatRelativeDateGroupLabel(groupValue)
    }
    return groupValue || 'Unassigned'
  },
}
