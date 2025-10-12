'use client'

import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Users, Building, Briefcase } from 'lucide-react'
import type { PersonListItem } from '@/types/api'
import { PersonAvatar } from '@/components/people/person-avatar'

interface CreateColumnsProps {
  onButtonClick?: (_e: React.MouseEvent, _personId: string) => void
  grouping?: string[] // Used by data-table to control column visibility
}

export function createPeopleColumns({
  onButtonClick,
  grouping: _grouping = [],
}: CreateColumnsProps): ColumnDef<PersonListItem>[] {
  const getStatusBadgeVariant = (status: string) => {
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
      size: 400,
      minSize: 250,
      maxSize: 600,
      cell: ({ row }) => {
        const person = row.original
        return (
          <div className='flex items-center gap-3'>
            <PersonAvatar
              name={person.name}
              avatar={person.avatarUrl}
              size='sm'
            />
            <div className='space-y-0.5 flex-1'>
              <div className='font-medium'>{person.name}</div>
              {person.role && (
                <div className='text-xs text-muted-foreground'>
                  {person.role}
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      id: 'teamName',
      header: 'Team',
      accessorFn: row => row.teamName || '—',
      cell: ({ row }) => {
        const person = row.original
        return (
          <div className='flex items-center gap-2'>
            <Building className='h-4 w-4 text-muted-foreground' />
            {person.teamId ? (
              <Link
                href={`/teams/${person.teamId}`}
                className='text-primary hover:text-primary/80 transition-colors'
                onClick={e => e.stopPropagation()}
              >
                {person.teamName || '—'}
              </Link>
            ) : (
              <span className='text-muted-foreground'>—</span>
            )}
          </div>
        )
      },
      size: 180,
      minSize: 120,
      maxSize: 250,
    },
    {
      id: 'managerName',
      header: 'Manager',
      accessorFn: row => row.managerName || '—',
      cell: ({ row }) => {
        const person = row.original
        return (
          <div className='flex items-center gap-2'>
            <Users className='h-4 w-4 text-muted-foreground' />
            {person.managerId ? (
              <Link
                href={`/people/${person.managerId}`}
                className='text-primary hover:text-primary/80 transition-colors'
                onClick={e => e.stopPropagation()}
              >
                {person.managerName || '—'}
              </Link>
            ) : (
              <span className='text-muted-foreground'>—</span>
            )}
          </div>
        )
      },
      size: 180,
      minSize: 120,
      maxSize: 250,
    },
    {
      id: 'jobRoleTitle',
      header: 'Job Role',
      accessorFn: row => row.jobRoleTitle || '—',
      cell: ({ row }) => {
        const person = row.original
        return (
          <div className='flex items-center gap-2'>
            <Briefcase className='h-4 w-4 text-muted-foreground' />
            <span className='text-muted-foreground'>
              {person.jobRoleTitle || '—'}
            </span>
          </div>
        )
      },
      size: 180,
      minSize: 120,
      maxSize: 250,
    },
    {
      id: 'reportCount',
      header: 'Reports',
      accessorKey: 'reportCount',
      cell: ({ row }) => {
        const person = row.original
        return (
          <span className='text-muted-foreground'>{person.reportCount}</span>
        )
      },
      size: 100,
      minSize: 80,
      maxSize: 120,
    },
    {
      id: 'statusBadge',
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
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const person = row.original
        return (
          <Button
            variant='ghost'
            className='h-8 w-8 p-0'
            onClick={e => {
              e.stopPropagation()
              if (onButtonClick) {
                onButtonClick(e, person.id)
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
      accessorFn: row => row.teamName || 'No Team',
      cell: ({ row }) => {
        const person = row.original
        return person.teamName || 'No Team'
      },
      meta: {
        hidden: true,
      } as { hidden: boolean },
      enableGrouping: true,
    },
    {
      id: 'manager',
      header: 'Manager',
      accessorFn: row => row.managerName || 'No Manager',
      cell: ({ row }) => {
        const person = row.original
        return person.managerName || 'No Manager'
      },
      meta: {
        hidden: true,
      } as { hidden: boolean },
      enableGrouping: true,
    },
    {
      id: 'jobRole',
      header: 'Job Role',
      accessorFn: row => row.jobRoleTitle || 'No Job Role',
      cell: ({ row }) => {
        const person = row.original
        return person.jobRoleTitle || 'No Job Role'
      },
      meta: {
        hidden: true,
      } as { hidden: boolean },
      enableGrouping: true,
    },
    {
      id: 'status',
      header: 'Status',
      accessorFn: row => getStatusLabel(row.status),
      cell: ({ row }) => {
        const person = row.original
        return getStatusLabel(person.status)
      },
      meta: {
        hidden: true,
      } as { hidden: boolean },
      enableGrouping: true,
    },
  ]
}
