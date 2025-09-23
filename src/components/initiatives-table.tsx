'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Edit, Eye, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { deleteInitiative } from '@/lib/actions'
import { toast } from 'sonner'

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
}

interface InitiativesTableProps {
  initiatives: InitiativeWithRelations[]
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  initiativeId: string
  triggerType: 'rightClick' | 'button'
}

export function InitiativesTable({ initiatives }: InitiativesTableProps) {
  const [_isPending, startTransition] = useTransition()
  const router = useRouter()
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    initiativeId: '',
    triggerType: 'rightClick',
  })

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

  const handleDelete = async (initiativeId: string) => {
    if (confirm('Are you sure you want to delete this initiative?')) {
      startTransition(async () => {
        try {
          await deleteInitiative(initiativeId)
          toast.success('Initiative deleted successfully')
        } catch (error) {
          console.error('Failed to delete initiative:', error)
          toast.error(
            error instanceof Error
              ? error.message
              : 'Failed to delete initiative'
          )
        }
      })
    }
  }

  const handleRowDoubleClick = (initiativeId: string) => {
    router.push(`/initiatives/${initiativeId}`)
  }

  const handleRowRightClick = (e: React.MouseEvent, initiativeId: string) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      initiativeId,
      triggerType: 'rightClick',
    })
  }

  const handleButtonClick = (e: React.MouseEvent, initiativeId: string) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setContextMenu({
      visible: true,
      x: rect.right - 160, // Position menu to the left of the button
      y: rect.bottom + 4, // Position menu below the button
      initiativeId,
      triggerType: 'button',
    })
  }

  const getRagColor = (rag: string) => {
    switch (rag) {
      case 'red':
        return 'bg-red-500'
      case 'amber':
        return 'bg-amber-500'
      case 'green':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getCompletionPercentage = (initiative: InitiativeWithRelations) => {
    // Simple calculation based on completed tasks vs total tasks
    // This could be enhanced with more sophisticated logic
    const totalTasks = initiative._count.tasks
    if (totalTasks === 0) return 0

    // For now, we'll use a placeholder calculation
    // In a real implementation, you'd count completed tasks
    return Math.min(Math.floor((initiative._count.tasks / 10) * 100), 100)
  }

  if (initiatives.length === 0) {
    return (
      <div className='text-muted-foreground text-sm text-center py-8'>
        No initiatives yet.
      </div>
    )
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow className='hover:bg-accent/50'>
            <TableHead className='text-muted-foreground'>Title</TableHead>
            <TableHead className='text-muted-foreground'>Description</TableHead>
            <TableHead className='text-muted-foreground'>Team</TableHead>
            <TableHead className='text-muted-foreground'>RAG</TableHead>
            <TableHead className='text-muted-foreground'>% Complete</TableHead>
            <TableHead className='text-muted-foreground'>
              # Objectives
            </TableHead>
            <TableHead className='text-muted-foreground'># Tasks</TableHead>
            <TableHead className='text-muted-foreground'># Check-ins</TableHead>
            <TableHead className='text-muted-foreground'>Owner</TableHead>
            <TableHead className='text-muted-foreground w-[50px]'>
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initiatives.map(initiative => (
            <TableRow
              key={initiative.id}
              className='hover:bg-accent/50 cursor-pointer'
              onDoubleClick={() => handleRowDoubleClick(initiative.id)}
              onContextMenu={e => handleRowRightClick(e, initiative.id)}
            >
              <TableCell className='font-medium text-foreground'>
                {initiative.title}
              </TableCell>
              <TableCell className='text-muted-foreground max-w-[200px] truncate'>
                {initiative.summary || '—'}
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {initiative.team?.name || '—'}
              </TableCell>
              <TableCell className='text-muted-foreground'>
                <div className='flex items-center gap-2'>
                  <div
                    className={`w-3 h-3 rounded-full ${getRagColor(initiative.rag)}`}
                  />
                  <span className='capitalize'>{initiative.rag}</span>
                </div>
              </TableCell>
              <TableCell className='text-muted-foreground'>
                <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary'>
                  {getCompletionPercentage(initiative)}%
                </span>
              </TableCell>
              <TableCell className='text-muted-foreground'>
                <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary'>
                  {initiative.objectives.length}
                </span>
              </TableCell>
              <TableCell className='text-muted-foreground'>
                <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary'>
                  {initiative._count.tasks}
                </span>
              </TableCell>
              <TableCell className='text-muted-foreground'>
                <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary'>
                  {initiative._count.checkIns}
                </span>
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {initiative.owners.length > 0
                  ? initiative.owners.map(owner => owner.person.name).join(', ')
                  : '—'}
              </TableCell>
              <TableCell>
                <Button
                  variant='ghost'
                  className='h-8 w-8 p-0'
                  onClick={e => handleButtonClick(e, initiative.id)}
                >
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
            className='w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 flex items-center gap-2'
            onClick={() => {
              handleDelete(contextMenu.initiativeId)
              setContextMenu(prev => ({ ...prev, visible: false }))
            }}
          >
            <Trash2 className='w-4 h-4' />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
