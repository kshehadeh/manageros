'use client'

import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Calendar, Users } from 'lucide-react'
import { OneOnOneListItem } from '@/hooks/use-oneonones'

interface CreateColumnsProps {
  onButtonClick?: (_e: React.MouseEvent, _oneOnOneId: string) => void
  currentUserId?: string
}

export function createOneOnOneColumns({
  onButtonClick,
  currentUserId,
}: CreateColumnsProps): ColumnDef<OneOnOneListItem>[] {
  return [
    {
      accessorKey: 'participants',
      header: 'Participants',
      size: 500,
      minSize: 300,
      maxSize: 1000,
      cell: ({ row }) => {
        const oneOnOne = row.original
        const isManager = oneOnOne.manager?.user?.id === currentUserId
        const otherPerson = isManager ? oneOnOne.report : oneOnOne.manager
        const relationLabel = isManager ? 'Report' : 'Manager'

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
              <div className='text-xs text-muted-foreground mt-1.5 flex items-center gap-2 flex-wrap'>
                <span>
                  With {relationLabel}:{' '}
                  <span className='font-medium'>{otherPerson.name}</span>
                </span>
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
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const oneOnOne = row.original
        return (
          <Button
            variant='ghost'
            className='h-8 w-8 p-0'
            onClick={e => {
              e.stopPropagation()
              if (onButtonClick) {
                onButtonClick(e, oneOnOne.id)
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
      id: 'manager',
      header: 'Participant 1',
      accessorFn: row => row.manager.name,
      cell: ({ row }) => row.original.manager.name,
      meta: {
        hidden: true,
      } as { hidden: boolean },
      enableGrouping: true,
    },
    {
      id: 'report',
      header: 'Participant 2',
      accessorFn: row => row.report.name,
      cell: ({ row }) => row.original.report.name,
      meta: {
        hidden: true,
      } as { hidden: boolean },
      enableGrouping: true,
    },
  ]
}
