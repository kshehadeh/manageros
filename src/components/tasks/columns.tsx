'use client'

import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge, BadgeVariant } from '@/components/ui/badge'
import {
  MoreHorizontal,
  User as UserIcon,
  Calendar,
  Target,
  Flag,
} from 'lucide-react'
import {
  taskStatusUtils,
  type TaskStatus,
  TASK_STATUS,
} from '@/lib/task-status'
import { taskPriorityUtils, type TaskPriority } from '@/lib/task-priority'
import type { TaskListItem } from '@/lib/task-list-select'

interface CreateColumnsProps {
  onTaskComplete: (_taskId: string, _currentStatus: TaskStatus) => void
  onButtonClick?: (_e: React.MouseEvent, _taskId: string) => void
  enableSizing?: boolean
  grouping?: string[]
}

export function createTaskColumns({
  onTaskComplete,
  onButtonClick,
  enableSizing = false,
  grouping = [],
}: CreateColumnsProps): ColumnDef<TaskListItem>[] {
  const getPriorityVariant = (priority: number) => {
    return taskPriorityUtils.getVariant(priority as TaskPriority)
  }

  const getPriorityLabel = (priority: number) => {
    return taskPriorityUtils.getLabel(priority as TaskPriority)
  }

  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
        />
      ),
      cell: ({ row }) => {
        const task = row.original
        const isCompleted = task.status === TASK_STATUS.DONE

        return (
          <Checkbox
            checked={isCompleted}
            onCheckedChange={() =>
              onTaskComplete(task.id, task.status as TaskStatus)
            }
            className='data-[state=checked]:bg-primary data-[state=checked]:border-primary'
          />
        )
      },
      enableGrouping: false,
      ...(enableSizing && { size: 40 }),
    },
    {
      accessorKey: 'title',
      header: 'Summary',
      cell: ({ row }) => {
        const task = row.original
        const isCompleted = task.status === TASK_STATUS.DONE

        return (
          <div className='space-y-0.5'>
            <div
              className={`${
                isCompleted ? 'line-through text-muted-foreground' : ''
              }`}
            >
              {task.title}
            </div>
            <div className='text-xs text-muted-foreground mt-1.5 flex items-center gap-2 flex-wrap'>
              {(task as any).assigneeName && (
                <div className='flex items-center gap-1'>
                  <UserIcon className='h-3 w-3' />
                  <Link
                    href={`/people/${(task as any).assigneeId}`}
                    className='text-primary hover:text-primary/80 transition-colors'
                    onClick={e => e.stopPropagation()}
                  >
                    {(task as any).assigneeName}
                  </Link>
                </div>
              )}
              <div className='flex items-center gap-1'>
                <Flag className='h-3 w-3' />
                <Badge
                  variant={getPriorityVariant(task.priority) as BadgeVariant}
                  className='text-xs px-1 py-0'
                >
                  {getPriorityLabel(task.priority)}
                </Badge>
              </div>
              {task.dueDate && (
                <div className='flex items-center gap-1'>
                  <Calendar className='h-3 w-3' />
                  <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              )}
              {(task as any).initiativeTitle && (
                <div className='flex items-center gap-1'>
                  <Target className='h-3 w-3' />
                  <Link
                    href={`/initiatives/${(task as any).initiativeId}`}
                    className='text-primary hover:text-primary/80 transition-colors'
                    onClick={e => e.stopPropagation()}
                  >
                    {(task as any).initiativeTitle}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )
      },
      ...(enableSizing && { size: 300 }),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      sortingFn: (rowA, rowB) => {
        const statusOrder = ['todo', 'doing', 'blocked', 'done', 'dropped']
        const aStatus = rowA.getValue('status') as string
        const bStatus = rowB.getValue('status') as string
        const aIndex = statusOrder.indexOf(aStatus)
        const bIndex = statusOrder.indexOf(bStatus)
        return aIndex - bIndex
      },
      cell: ({ row }) => {
        const task = row.original

        return (
          <Badge
            variant={taskStatusUtils.getUIVariant(task.status as TaskStatus)}
          >
            {taskStatusUtils.getLabel(task.status as TaskStatus)}
          </Badge>
        )
      },
      // Hide status column when grouping by status
      ...(grouping.includes('status') && {
        meta: {
          hidden: true,
        } as { hidden: boolean },
      }),
      ...(enableSizing && { size: 120 }),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const task = row.original
        return (
          <Button
            variant='ghost'
            className='h-8 w-8 p-0'
            onClick={e => {
              e.stopPropagation()
              if (onButtonClick) {
                onButtonClick(e, task.id)
              }
            }}
          >
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        )
      },
      enableGrouping: false,
      ...(enableSizing && { size: 50 }),
    },
    // Hidden columns for grouping
    {
      id: 'assignee',
      header: 'Assignee',
      accessorFn: row => (row as any).assigneeName || 'Unassigned',
      cell: ({ row }) => {
        const task = row.original as any
        return task.assigneeName || 'Unassigned'
      },
      // Always hidden - only used for grouping
      meta: {
        hidden: true,
      } as { hidden: boolean },
      enableGrouping: true,
    },
    {
      id: 'initiative',
      header: 'Initiative',
      accessorFn: row => (row as any).initiativeTitle || 'No Initiative',
      cell: ({ row }) => {
        const task = row.original as any
        return task.initiativeTitle || 'No Initiative'
      },
      // Always hidden - only used for grouping
      meta: {
        hidden: true,
      } as { hidden: boolean },
      enableGrouping: true,
    },
  ]
}
