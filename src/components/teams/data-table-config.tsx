'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Users, Target, MoreHorizontal } from 'lucide-react'
import type { TeamListItem } from '@/hooks/use-teams'
import { TeamAvatar } from '@/components/teams/team-avatar'
import { useTeams } from '@/hooks/use-teams'
import { useTeamTableSettings } from '@/hooks/use-team-table-settings'
import { deleteTeam } from '@/lib/actions/team'
import type { DataTableConfig } from '@/components/common/generic-data-table'

type TeamFilters = {
  search?: string
  parentId?: string
}

export const teamDataTableConfig: DataTableConfig<TeamListItem, TeamFilters> = {
  // Entity identification
  entityType: 'team',
  entityName: 'Team',
  entityNamePlural: 'Teams',

  // Data fetching
  useDataHook: useTeams,

  // Settings management
  useSettingsHook: useTeamTableSettings,

  onRowClick: (router, teamId) => {
    router.push(`/teams/${teamId}`)
  },

  // Column definitions
  createColumns: ({ onButtonClick, visibleColumns, grouping }) => {
    const isGroupedByParent = grouping && grouping.includes('parent')

    return [
      {
        accessorKey: 'name',
        header: 'Name',
        size: 400,
        minSize: 250,
        maxSize: 600,
        cell: ({ row }) => {
          const team = row.original as TeamListItem & { avatar?: string | null }
          return (
            <div className='flex items-center gap-3'>
              <TeamAvatar
                name={team.name}
                avatar={team.avatar ?? null}
                size='sm'
              />
              <div className='space-y-0.5 flex-1'>
                <div className='font-medium'>{team.name}</div>
                {team.description && (
                  <div className='text-xs text-muted-foreground'>
                    {team.description}
                  </div>
                )}
              </div>
            </div>
          )
        },
        meta: {
          hidden: visibleColumns?.includes('name') === false,
        },
      },
      {
        id: 'members',
        header: 'Members',
        accessorFn: row => row._count?.people ?? 0,
        cell: ({ row }) => {
          const team = row.original
          const memberCount = team._count?.people ?? 0
          return (
            <div className='flex items-center gap-2'>
              <Users className='h-4 w-4 text-muted-foreground' />
              <span className='text-muted-foreground'>{memberCount}</span>
            </div>
          )
        },
        size: 100,
        minSize: 80,
        maxSize: 120,
        meta: {
          hidden: visibleColumns?.includes('members') === false,
        },
      },
      {
        id: 'initiatives',
        header: 'Initiatives',
        accessorFn: row => row._count?.initiatives ?? 0,
        cell: ({ row }) => {
          const team = row.original
          const initiativeCount = team._count?.initiatives ?? 0
          return (
            <div className='flex items-center gap-2'>
              <Target className='h-4 w-4 text-muted-foreground' />
              <span className='text-muted-foreground'>{initiativeCount}</span>
            </div>
          )
        },
        size: 100,
        minSize: 80,
        maxSize: 120,
        meta: {
          hidden: visibleColumns?.includes('initiatives') === false,
        },
      },
      {
        id: 'parent',
        header: 'Parent Team',
        accessorFn: row => row.parent?.name || '—',
        cell: ({ row }) => {
          const team = row.original
          if (!team.parent) {
            return <span className='text-muted-foreground'>—</span>
          }
          return (
            <span className='text-muted-foreground'>{team.parent.name}</span>
          )
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
        meta: {
          hidden:
            visibleColumns?.includes('parent') === false ||
            Boolean(isGroupedByParent),
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const team = row.original
          return (
            <div className='flex items-center justify-end'>
              <Button
                variant='ghost'
                size='sm'
                onClick={e => {
                  e.stopPropagation()
                  onButtonClick(e, team.id)
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
  deleteAction: deleteTeam,

  // UI configuration
  searchPlaceholder: 'Search teams...',
  emptyMessage: 'No teams found',
  loadingMessage: 'Loading teams...',

  // Grouping and sorting options
  groupingOptions: [
    { value: 'none', label: 'No grouping' },
    { value: 'parent', label: 'Group by parent team' },
  ],
  sortOptions: [
    { value: 'name', label: 'Name' },
    { value: 'members', label: 'Members' },
  ],
}
