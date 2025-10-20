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
  createColumns: ({ onButtonClick, visibleColumns }) => {
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
        accessorKey: 'scheduledAt',
        header: 'Scheduled',
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
          hidden: visibleColumns?.includes('scheduledAt') === false,
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
    { value: 'scheduledAt', label: 'Group by date' },
  ],
  sortOptions: [
    { value: 'participants', label: 'Participants' },
    { value: 'scheduledAt', label: 'Scheduled Date' },
  ],
}
