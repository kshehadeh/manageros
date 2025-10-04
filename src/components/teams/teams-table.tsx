'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
  Target,
  Building2,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { deleteTeam } from '@/lib/actions'
import { toast } from 'sonner'
import { TeamWithCounts } from '@/types/team'
import { DeleteModal } from '@/components/common/delete-modal'
import { TeamAvatar } from '@/components/teams/team-avatar'

interface SortState {
  column: string | null
  direction: 'asc' | 'desc'
}

interface TeamsTableProps {
  teams: TeamWithCounts[]
  onTeamUpdate?: () => void
}

export function TeamsTable({ teams, onTeamUpdate }: TeamsTableProps) {
  const router = useRouter()
  const [_isPending, startTransition] = useTransition()
  const [sorting, setSorting] = useState<SortState>({
    column: null,
    direction: 'asc',
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  // Handle column sorting
  const handleSort = (column: string) => {
    setSorting(prev => {
      if (prev.column === column) {
        // If clicking the same column, toggle direction
        return {
          column,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        }
      } else {
        // If clicking a different column, set to ascending
        return {
          column,
          direction: 'asc',
        }
      }
    })
  }

  // Get sort icon for column header
  const getSortIcon = (column: string) => {
    if (sorting.column !== column) {
      return <ArrowUpDown className='h-4 w-4 text-muted-foreground' />
    }
    return sorting.direction === 'asc' ? (
      <ArrowUp className='h-4 w-4 text-primary' />
    ) : (
      <ArrowDown className='h-4 w-4 text-primary' />
    )
  }

  // Sort teams based on current sort state
  const sortedTeams = useMemo(() => {
    const sorted = [...teams]

    if (sorting.column) {
      sorted.sort((a, b) => {
        let aValue: string | number
        let bValue: string | number

        switch (sorting.column) {
          case 'name':
            aValue = a.name.toLowerCase()
            bValue = b.name.toLowerCase()
            break
          case 'parent':
            aValue = a.parent?.name?.toLowerCase() || ''
            bValue = b.parent?.name?.toLowerCase() || ''
            break
          case 'members':
            aValue = a._count.people
            bValue = b._count.people
            break
          case 'initiatives':
            aValue = a._count.initiatives
            bValue = b._count.initiatives
            break
          case 'children':
            aValue = a._count.children
            bValue = b._count.children
            break
          default:
            return 0
        }

        if (aValue < bValue) {
          return sorting.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sorting.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    return sorted
  }, [teams, sorting])

  const handleDeleteConfirm = (teamId: string) => {
    startTransition(async () => {
      try {
        await deleteTeam(teamId)
        toast.success('Team deleted successfully')
        if (onTeamUpdate) {
          onTeamUpdate()
        }
      } catch (error) {
        console.error('Error deleting team:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete team'
        )
      }
    })
  }

  const handleRowClick = (teamId: string) => {
    router.push(`/teams/${teamId}`)
  }

  return (
    <div className='space-y-4'>
      {/* Table */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className='cursor-pointer hover:bg-accent/50'
                onClick={() => handleSort('name')}
              >
                <div className='flex items-center gap-2'>
                  Name
                  {getSortIcon('name')}
                </div>
              </TableHead>
              <TableHead
                className='cursor-pointer hover:bg-accent/50'
                onClick={() => handleSort('parent')}
              >
                <div className='flex items-center gap-2'>
                  Parent
                  {getSortIcon('parent')}
                </div>
              </TableHead>
              <TableHead
                className='cursor-pointer hover:bg-accent/50 text-center'
                onClick={() => handleSort('members')}
              >
                <div className='flex items-center justify-center gap-2'>
                  <Users className='h-4 w-4' />
                  {getSortIcon('members')}
                </div>
              </TableHead>
              <TableHead
                className='cursor-pointer hover:bg-accent/50 text-center'
                onClick={() => handleSort('initiatives')}
              >
                <div className='flex items-center justify-center gap-2'>
                  <Target className='h-4 w-4' />
                  {getSortIcon('initiatives')}
                </div>
              </TableHead>
              <TableHead
                className='cursor-pointer hover:bg-accent/50 text-center'
                onClick={() => handleSort('children')}
              >
                <div className='flex items-center justify-center gap-2'>
                  <Building2 className='h-4 w-4' />
                  {getSortIcon('children')}
                </div>
              </TableHead>
              <TableHead className='w-[50px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTeams.map(team => (
              <TableRow
                key={team.id}
                className='hover:bg-accent/50 cursor-pointer'
                onClick={() => handleRowClick(team.id)}
              >
                <TableCell className='font-medium'>
                  <div className='flex items-center gap-3'>
                    <TeamAvatar
                      name={team.name}
                      avatar={team.avatar}
                      size='sm'
                    />
                    <div>
                      <div className='font-medium text-foreground'>
                        {team.name}
                      </div>
                      {team.description && (
                        <div className='text-sm text-muted-foreground mt-1'>
                          {team.description}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {team.parent ? (
                    <Link
                      href={`/teams/${team.parent.id}`}
                      className='hover:text-primary transition-colors'
                      onClick={e => e.stopPropagation()}
                    >
                      {team.parent.name}
                    </Link>
                  ) : (
                    <span className='text-muted-foreground'>—</span>
                  )}
                </TableCell>
                <TableCell className='text-center text-muted-foreground'>
                  <div className='flex items-center justify-center gap-1'>
                    <Users className='h-3 w-3' />
                    {team._count.people}
                  </div>
                </TableCell>
                <TableCell className='text-center text-muted-foreground'>
                  <div className='flex items-center justify-center gap-1'>
                    <Target className='h-3 w-3' />
                    {team._count.initiatives}
                  </div>
                </TableCell>
                <TableCell className='text-center text-muted-foreground'>
                  <div className='flex items-center justify-center gap-1'>
                    <Building2 className='h-3 w-3' />
                    {team._count.children}
                  </div>
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/teams/${team.id}`}
                          className='flex items-center gap-2'
                        >
                          <Eye className='h-4 w-4' />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/teams/${team.id}/edit`}
                          className='flex items-center gap-2'
                        >
                          <Edit className='h-4 w-4' />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setDeleteTargetId(team.id)
                          setShowDeleteModal(true)
                        }}
                        className='text-destructive focus:text-destructive'
                      >
                        <Trash2 className='h-4 w-4' />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {sortedTeams.length === 0 && (
        <div className='text-center py-8 text-muted-foreground'>
          No teams found.
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteTargetId(null)
        }}
        onConfirm={() => {
          if (deleteTargetId) {
            return handleDeleteConfirm(deleteTargetId)
          }
        }}
        title='Delete Team'
        entityName='team'
      />
    </div>
  )
}
