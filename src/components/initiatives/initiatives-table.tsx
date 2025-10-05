'use client'

import { useState, useTransition, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Edit, Eye, Trash2, Search, Filter } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { deleteInitiative } from '@/lib/actions'
import { toast } from 'sonner'
import { Person, Team } from '@prisma/client'
import { calculateInitiativeCompletionPercentage } from '@/lib/completion-utils'
import { DeleteModal } from '@/components/common/delete-modal'
import { RagCircle } from '@/components/rag'

interface FilterState {
  keyword: string
  ownerId: string
  teamId: string
  rag: string
  dateRange: string
  startDate: string
  endDate: string
}

interface InitiativeWithRelations {
  id: string
  title: string
  summary: string | null
  outcome: string | null
  startDate: Date | null
  targetDate: Date | null
  status: string
  rag: string
  confidence: number
  teamId: string | null
  organizationId: string
  createdAt: Date
  updatedAt: Date
  objectives: Array<{
    id: string
    title: string
    keyResult: string | null
    sortIndex: number
  }>
  team: {
    id: string
    name: string
  } | null
  owners: Array<{
    personId: string
    role: string
    person: {
      id: string
      name: string
    }
  }>
  _count: {
    checkIns: number
    tasks: number
  }
  tasks: Array<{
    status: string
  }>
}

interface InitiativesTableProps {
  initiatives: InitiativeWithRelations[]
  people: Person[]
  teams: Team[]
  hideFilters?: boolean
  hideOwner?: boolean // Hide owner column
  hideActions?: boolean // Hide actions column
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  initiativeId: string
  triggerType: 'rightClick' | 'button'
}

export function InitiativesTable({
  initiatives,
  people,
  teams,
  hideFilters = false,
  hideOwner = false,
  hideActions = false,
}: InitiativesTableProps) {
  const [_isPending, startTransition] = useTransition()
  const router = useRouter()
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    initiativeId: '',
    triggerType: 'rightClick',
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    keyword: '',
    ownerId: 'all',
    teamId: 'all',
    rag: 'all',
    dateRange: 'all',
    startDate: '',
    endDate: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  // Filter initiatives based on current filter state
  const filteredInitiatives = useMemo(() => {
    return initiatives.filter(initiative => {
      // Keyword filter (searches title and summary)
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase()
        const titleMatch = initiative.title.toLowerCase().includes(keyword)
        const summaryMatch =
          initiative.summary?.toLowerCase().includes(keyword) || false
        if (!titleMatch && !summaryMatch) return false
      }

      // Owner filter
      if (filters.ownerId && filters.ownerId !== 'all') {
        const hasOwner = initiative.owners.some(
          owner => owner.personId === filters.ownerId
        )
        if (!hasOwner) return false
      }

      // Team filter
      if (filters.teamId && filters.teamId !== 'all') {
        if (filters.teamId === 'no-team') {
          if (initiative.teamId) return false
        } else {
          if (initiative.teamId !== filters.teamId) return false
        }
      }

      // RAG filter
      if (
        filters.rag &&
        filters.rag !== 'all' &&
        initiative.rag !== filters.rag
      ) {
        return false
      }

      // Date range filter
      if (filters.dateRange && filters.dateRange !== 'all') {
        const initiativeDate =
          initiative.startDate || initiative.targetDate || initiative.createdAt
        const now = new Date()

        switch (filters.dateRange) {
          case 'today':
            const today = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            )
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
            if (initiativeDate < today || initiativeDate >= tomorrow)
              return false
            break
          case 'this-week':
            const startOfWeek = new Date(now)
            startOfWeek.setDate(now.getDate() - now.getDay())
            startOfWeek.setHours(0, 0, 0, 0)
            if (initiativeDate < startOfWeek) return false
            break
          case 'this-month':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            if (initiativeDate < startOfMonth) return false
            break
          case 'last-30-days':
            const thirtyDaysAgo = new Date(
              now.getTime() - 30 * 24 * 60 * 60 * 1000
            )
            if (initiativeDate < thirtyDaysAgo) return false
            break
          case 'custom':
            if (filters.startDate) {
              const startDate = new Date(filters.startDate)
              startDate.setHours(0, 0, 0, 0)
              if (initiativeDate < startDate) return false
            }
            if (filters.endDate) {
              const endDate = new Date(filters.endDate)
              endDate.setHours(23, 59, 59, 999)
              if (initiativeDate > endDate) return false
            }
            break
        }
      }

      return true
    })
  }, [initiatives, filters])

  // Handle clicking outside context menu to close it
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(prev => ({ ...prev, visible: false }))
    }

    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu.visible])

  const handleDeleteConfirm = async (initiativeId: string) => {
    startTransition(async () => {
      try {
        await deleteInitiative(initiativeId)
        toast.success('Initiative deleted successfully')
      } catch (error) {
        console.error('Failed to delete initiative:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete initiative'
        )
      }
    })
  }

  const handleRowDoubleClick = (initiativeId: string) => {
    router.push(`/initiatives/${initiativeId}`)
  }

  if (initiatives.length === 0) {
    return (
      <div className='text-center py-8'>
        <p className='text-muted-foreground text-sm'>No open initiatives</p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {/* Filter Controls */}
      {!hideFilters && (
        <div className='px-0'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 transition-all duration-200 ${
                  showFilters
                    ? 'rounded-b-none border-b-0 bg-background'
                    : 'rounded-lg'
                }`}
              >
                <Filter className='h-4 w-4' />
                Filters
                {Object.values(filters).some(
                  filter => filter !== '' && filter !== 'all'
                ) && <div className='h-2 w-2 bg-primary rounded-full' />}
              </Button>
            </div>
            <div className='text-sm text-muted-foreground'>
              Showing {filteredInitiatives.length} of {initiatives.length}{' '}
              initiatives
            </div>
          </div>

          {showFilters && (
            <div className='border border-t-0 rounded-b-lg rounded-t-none p-4 bg-muted/30'>
              <div>
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
                  {/* Keyword Search */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Search</label>
                    <div className='relative'>
                      <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                      <Input
                        placeholder='Search initiatives...'
                        value={filters.keyword}
                        onChange={e =>
                          setFilters(prev => ({
                            ...prev,
                            keyword: e.target.value,
                          }))
                        }
                        className='pl-8'
                      />
                    </div>
                  </div>

                  {/* Owner Filter */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Owner</label>
                    <Select
                      value={filters.ownerId}
                      onValueChange={value =>
                        setFilters(prev => ({ ...prev, ownerId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='All owners' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All owners</SelectItem>
                        {people.map(person => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Team Filter */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Team</label>
                    <Select
                      value={filters.teamId}
                      onValueChange={value =>
                        setFilters(prev => ({ ...prev, teamId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='All teams' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All teams</SelectItem>
                        <SelectItem value='no-team'>No team</SelectItem>
                        {teams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* RAG Filter */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>RAG Status</label>
                    <Select
                      value={filters.rag}
                      onValueChange={value =>
                        setFilters(prev => ({ ...prev, rag: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='All RAG statuses' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All RAG statuses</SelectItem>
                        <SelectItem value='red'>Red</SelectItem>
                        <SelectItem value='amber'>Amber</SelectItem>
                        <SelectItem value='green'>Green</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range Filter */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Date Range</label>
                    <Select
                      value={filters.dateRange}
                      onValueChange={value =>
                        setFilters(prev => ({ ...prev, dateRange: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='All dates' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All dates</SelectItem>
                        <SelectItem value='today'>Today</SelectItem>
                        <SelectItem value='this-week'>This week</SelectItem>
                        <SelectItem value='this-month'>This month</SelectItem>
                        <SelectItem value='last-30-days'>
                          Last 30 days
                        </SelectItem>
                        <SelectItem value='custom'>Custom range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Custom Date Range Inputs */}
                {filters.dateRange === 'custom' && (
                  <div className='grid gap-4 md:grid-cols-2 mt-4'>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>Start Date</label>
                      <Input
                        type='date'
                        value={filters.startDate}
                        onChange={e =>
                          setFilters(prev => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>End Date</label>
                      <Input
                        type='date'
                        value={filters.endDate}
                        onChange={e =>
                          setFilters(prev => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Clear Filters Button */}
                <div className='flex justify-end mt-4'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setFilters({
                        keyword: '',
                        ownerId: 'all',
                        teamId: 'all',
                        rag: 'all',
                        dateRange: 'all',
                        startDate: '',
                        endDate: '',
                      })
                    }
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initiative Table */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-accent/50'>
              <TableHead className='text-muted-foreground w-8 p-2'>
                RAG
              </TableHead>
              <TableHead className='text-muted-foreground p-2'>
                Initiative
              </TableHead>
              <TableHead className='text-muted-foreground hidden md:table-cell p-2'>
                Team
              </TableHead>
              {!hideOwner && (
                <TableHead className='text-muted-foreground hidden md:table-cell'>
                  Owner
                </TableHead>
              )}
              {!hideActions && (
                <TableHead className='text-muted-foreground text-right p-2'>
                  Progress
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInitiatives.map(initiative => (
              <TableRow
                key={initiative.id}
                className='hover:bg-accent/50 cursor-pointer'
                onClick={() => handleRowDoubleClick(initiative.id)}
              >
                <TableCell className='text-muted-foreground p-2 align-top'>
                  <div className='flex items-start justify-center pt-1'>
                    <RagCircle rag={initiative.rag} />
                  </div>
                </TableCell>
                <TableCell className='font-medium text-foreground p-2'>
                  <div>
                    <div className='font-medium'>{initiative.title}</div>
                    <div className='text-xs text-muted-foreground mt-1'>
                      {initiative.objectives.length} objectives •{' '}
                      {initiative._count.tasks} tasks •{' '}
                      {initiative._count.checkIns} check-ins
                    </div>
                  </div>
                </TableCell>
                <TableCell className='text-muted-foreground hidden md:table-cell p-2'>
                  {initiative.team?.name || '—'}
                </TableCell>
                {!hideOwner && (
                  <TableCell className='text-muted-foreground hidden md:table-cell'>
                    {initiative.owners.length > 0
                      ? initiative.owners
                          .map(owner => owner.person.name)
                          .join(', ')
                      : '—'}
                  </TableCell>
                )}
                {!hideActions && (
                  <TableCell className='text-right p-2'>
                    <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary'>
                      {calculateInitiativeCompletionPercentage(initiative)}%
                    </span>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className='fixed z-50 bg-popover text-popover-foreground border rounded-md shadow-lg py-1 min-w-[160px]'
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className='w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2'
            onClick={() => {
              router.push(`/initiatives/${contextMenu.initiativeId}`)
              setContextMenu(prev => ({ ...prev, visible: false }))
            }}
          >
            <Eye className='w-4 h-4' />
            View
          </button>
          <button
            className='w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2'
            onClick={() => {
              router.push(`/initiatives/${contextMenu.initiativeId}/edit`)
              setContextMenu(prev => ({ ...prev, visible: false }))
            }}
          >
            <Edit className='w-4 h-4' />
            Edit
          </button>
          <button
            className='w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors flex items-center gap-2'
            onClick={() => {
              setContextMenu(prev => ({ ...prev, visible: false }))
              setDeleteTargetId(contextMenu.initiativeId)
              setShowDeleteModal(true)
            }}
          >
            <Trash2 className='w-4 h-4' />
            Delete
          </button>
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
        title='Delete Initiative'
        entityName='initiative'
      />
    </div>
  )
}
