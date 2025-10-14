'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Users, Target, MoreHorizontal } from 'lucide-react'
import type { TeamListItem } from '@/hooks/use-teams'
import { TeamAvatar } from '@/components/teams/team-avatar'

interface CreateColumnsProps {
  onButtonClick?: (_e: React.MouseEvent, _teamId: string) => void
  grouping?: string[] // Used by data-table to control column visibility
}

export function createTeamsColumns({
  onButtonClick,
  grouping: _grouping = [],
}: CreateColumnsProps): ColumnDef<TeamListItem>[] {
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
    },
    {
      id: 'members',
      header: 'Members',
      accessorFn: row => row._count?.people ?? 0,
      cell: ({ row }) => {
        const team = row.original
        return (
          <div className='flex items-center gap-1 text-muted-foreground'>
            <Users className='h-3 w-3' />
            {team._count?.people ?? 0}
          </div>
        )
      },
      size: 120,
      minSize: 90,
      maxSize: 150,
    },
    {
      id: 'initiatives',
      header: 'Initiatives',
      accessorFn: row => row._count?.initiatives ?? 0,
      cell: ({ row }) => {
        const team = row.original
        return (
          <div className='flex items-center gap-1 text-muted-foreground'>
            <Target className='h-3 w-3' />
            {team._count?.initiatives ?? 0}
          </div>
        )
      },
      size: 130,
      minSize: 90,
      maxSize: 160,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        if (row.getIsGrouped()) {
          return null
        }
        const team = row.original
        return (
          <Button
            variant='ghost'
            className='h-8 w-8 p-0'
            onClick={e => {
              e.stopPropagation()
              if (onButtonClick) onButtonClick(e, team.id)
            }}
          >
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        )
      },
      enableGrouping: false,
      size: 60,
      minSize: 50,
      maxSize: 100,
    },
    // Hidden column used for grouping by parent
    {
      id: 'parent',
      header: 'Parent',
      accessorFn: row => row.parent?.name || 'No Parent',
      cell: ({ row }) => {
        const team = row.original
        return team.parent?.name || 'No Parent'
      },
      meta: {
        hidden: true,
      } as { hidden: boolean },
      enableGrouping: true,
    },
  ]
}
