'use client'

import { ColumnDef } from '@tanstack/react-table'
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

interface CreateColumnsProps {
  onButtonClick?: (_e: React.MouseEvent, _initiativeId: string) => void
  grouping?: string[]
}

export function createInitiativeColumns({
  onButtonClick,
  grouping: _grouping = [],
}: CreateColumnsProps): ColumnDef<InitiativeWithRelations>[] {
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
    },
    {
      accessorKey: 'title',
      header: 'Initiative',
      size: 500,
      minSize: 300,
      maxSize: 1000,
      cell: ({ row }) => {
        const initiative = row.original
        return (
          <div className='space-y-0.5 flex-1'>
            <div className='font-medium'>{initiative.title}</div>
            <div className='text-xs text-muted-foreground'>
              {initiative.objectives.length} objectives •{' '}
              {initiative._count.tasks} tasks • {initiative._count.checkIns}{' '}
              check-ins
            </div>
          </div>
        )
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
    },
    {
      id: 'statusBadge',
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => {
        const initiative = row.original
        return (
          <Badge
            variant={initiativeStatusUtils.getVariant(
              initiative.status as InitiativeStatus
            )}
          >
            {initiativeStatusUtils.getLabel(
              initiative.status as InitiativeStatus
            )}
          </Badge>
        )
      },
      size: 120,
      minSize: 100,
      maxSize: 150,
    },
    {
      id: 'progress',
      header: 'Progress',
      cell: ({ row }) => {
        const initiative = row.original
        const completionPercentage =
          calculateInitiativeCompletionPercentage(initiative)
        return (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary'>
            {completionPercentage}%
          </span>
        )
      },
      enableGrouping: false,
      size: 100,
      minSize: 80,
      maxSize: 120,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const initiative = row.original
        return (
          <Button
            variant='ghost'
            className='h-8 w-8 p-0'
            onClick={e => {
              e.stopPropagation()
              if (onButtonClick) {
                onButtonClick(e, initiative.id)
              }
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
    // Hidden columns for grouping
    {
      id: 'team',
      header: 'Team',
      accessorFn: row => row.team?.name || 'No Team',
      cell: ({ row }) => {
        const initiative = row.original
        return initiative.team?.name || 'No Team'
      },
      meta: {
        hidden: true,
      } as { hidden: boolean },
      enableGrouping: true,
    },
    {
      id: 'owner',
      header: 'Owner',
      accessorFn: row => {
        if (row.owners.length === 0) return 'Unassigned'
        // For grouping, use the first owner
        return row.owners[0].person.name
      },
      cell: ({ row }) => {
        const initiative = row.original
        if (initiative.owners.length === 0) return 'Unassigned'
        return initiative.owners[0].person.name
      },
      meta: {
        hidden: true,
      } as { hidden: boolean },
      enableGrouping: true,
    },
    {
      id: 'status',
      header: 'Status',
      accessorFn: row =>
        initiativeStatusUtils.getLabel(row.status as InitiativeStatus),
      cell: ({ row }) => {
        const initiative = row.original
        return initiativeStatusUtils.getLabel(
          initiative.status as InitiativeStatus
        )
      },
      meta: {
        hidden: true,
      } as { hidden: boolean },
      enableGrouping: true,
    },
  ]
}
