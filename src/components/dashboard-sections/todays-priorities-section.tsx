'use client'

import { useState, useEffect } from 'react'
import {
  ListTodo,
  Calendar,
  Users,
  MessageSquare,
  MoreHorizontal,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Link } from '@/components/ui/link'
import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns'
import { TaskQuickEditDialog } from '@/components/tasks/task-quick-edit-dialog'
import type { TaskStatus } from '@/lib/task-status'
import { taskStatusUtils } from '@/lib/task-status'
import { useRouter } from 'next/navigation'
import { useDataTableContextMenu } from '@/components/common/data-table-context-menu'
import {
  ViewDetailsMenuItem,
  EditMenuItem,
  MarkAsDoneMenuItem,
  SetDueDateMenuItem,
} from '@/components/common/context-menu-items'

export type PriorityItemType = 'task' | 'meeting' | 'oneonone' | 'feedback'

export interface PriorityItem {
  id: string
  type: PriorityItemType
  title: string
  date: Date | null
  href: string
  status?: string
  metadata?: string
  // Task-specific fields
  description?: string | null
  assigneeId?: string | null
  priority?: number
}

interface TodaysPrioritiesSectionProps {
  items: PriorityItem[]
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return ''

  const dateObj = new Date(date)

  if (isToday(dateObj)) {
    const hours = dateObj.getHours()
    const minutes = dateObj.getMinutes()
    const ampm = hours >= 12 ? 'pm' : 'am'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`
  }

  if (isTomorrow(dateObj)) {
    return 'Tomorrow'
  }

  if (isPast(dateObj)) {
    const daysPast = differenceInDays(new Date(), dateObj)
    if (daysPast === 0) {
      return 'Today'
    }
    return format(dateObj, 'MMM d')
  }

  return format(dateObj, 'MMM d')
}

function getPriorityIcon(item: PriorityItem) {
  switch (item.type) {
    case 'task':
      if (item.status === 'done') {
        return <ListTodo className='h-4 w-4 text-green-500' />
      }
      if (item.date && isPast(new Date(item.date)) && item.status !== 'done') {
        return <ListTodo className='h-4 w-4 text-red-500' />
      }
      return <ListTodo className='h-4 w-4 text-muted-foreground' />
    case 'meeting':
      return <Calendar className='h-4 w-4 text-blue-500' />
    case 'oneonone':
      return <Users className='h-4 w-4 text-purple-500' />
    case 'feedback':
      return <MessageSquare className='h-4 w-4 text-teal-500' />
    default:
      return <ListTodo className='h-4 w-4 text-muted-foreground' />
  }
}

function getPriorityBadge(item: PriorityItem) {
  if (item.type === 'task') {
    if (item.date && isPast(new Date(item.date)) && item.status !== 'done') {
      return (
        <Badge variant='destructive' className='text-xs'>
          Overdue
        </Badge>
      )
    }
    if (item.status === 'done') {
      return (
        <Badge
          variant='outline'
          className='text-xs bg-green-500/10 text-green-500 border-green-500/20'
        >
          Complete
        </Badge>
      )
    }
  }
  return null
}

function getPriorityLabel(item: PriorityItem): string {
  switch (item.type) {
    case 'task':
      if (!item.date) return ''
      if (isToday(new Date(item.date))) {
        return `Due today`
      }
      if (isPast(new Date(item.date))) {
        return 'Overdue'
      }
      return `Due ${formatDate(item.date)}`
    case 'meeting':
    case 'oneonone':
      if (!item.date) return 'Scheduled'
      return isToday(new Date(item.date))
        ? `Today at ${formatDate(item.date)}`
        : `${formatDate(item.date)}`
    case 'feedback':
      if (!item.date) return 'Active'
      return `Due ${formatDate(item.date)}`
    default:
      return ''
  }
}

export function TodaysPrioritiesSection({
  items,
}: TodaysPrioritiesSectionProps) {
  const router = useRouter()
  const [selectedTask, setSelectedTask] = useState<PriorityItem | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { handleButtonClick, ContextMenuComponent } = useDataTableContextMenu()

  // Sort items: overdue tasks first, then by date
  const sortedItems = [...items].sort((a, b) => {
    // Overdue tasks go to top
    if (
      a.type === 'task' &&
      a.date &&
      isPast(new Date(a.date)) &&
      a.status !== 'done'
    ) {
      if (
        b.type !== 'task' ||
        !b.date ||
        !isPast(new Date(b.date)) ||
        b.status === 'done'
      ) {
        return -1
      }
    }
    if (
      b.type === 'task' &&
      b.date &&
      isPast(new Date(b.date)) &&
      b.status !== 'done'
    ) {
      if (
        a.type !== 'task' ||
        !a.date ||
        !isPast(new Date(a.date)) ||
        a.status === 'done'
      ) {
        return 1
      }
    }

    // Done tasks go to bottom
    if (a.type === 'task' && a.status === 'done') return 1
    if (b.type === 'task' && b.status === 'done') return -1

    // Then sort by date
    if (a.date && b.date) {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    }
    if (a.date) return -1
    if (b.date) return 1

    return 0
  })

  // Limit to top 8 priorities
  const priorities = sortedItems.slice(0, 8)

  // Open dialog after selectedTask has been updated
  useEffect(() => {
    if (selectedTask) {
      setIsDialogOpen(true)
    }
  }, [selectedTask])

  // Reset selectedTask when dialog is closed
  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setSelectedTask(null)
    }
  }

  const handleTaskClick = (e: React.MouseEvent, item: PriorityItem) => {
    e.preventDefault()
    if (item.type === 'task') {
      setSelectedTask(item)
    }
  }

  const handleTaskUpdate = () => {
    router.refresh()
  }

  const handleTaskActionClick = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault()
    e.stopPropagation()
    handleButtonClick(e, taskId)
  }

  if (priorities.length === 0) {
    return null
  }

  return (
    <>
      <PageSection
        header={<SectionHeader icon={ListTodo} title="Today's Priorities" />}
      >
        <div className='flex flex-col gap-lg'>
          {priorities.map(item => {
            if (item.type === 'task') {
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={e => handleTaskClick(e, item)}
                  className='block cursor-pointer'
                >
                  <Card className='p-lg bg-muted/20 border-0 rounded-md shadow-none hover:bg-muted/30 transition-colors cursor-pointer'>
                    <div className='flex items-center justify-between gap-lg'>
                      <div className='flex items-center gap-lg flex-1 min-w-0'>
                        {getPriorityIcon(item)}
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-md flex-wrap'>
                            <span className='text-sm font-medium truncate'>
                              {item.title}
                            </span>
                          </div>
                          <div className='flex items-center gap-md text-xs text-muted-foreground mt-sm'>
                            <span>{getPriorityLabel(item)}</span>
                            {item.metadata && <span>• {item.metadata}</span>}
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center gap-md shrink-0'>
                        {item.status && (
                          <Badge
                            variant={taskStatusUtils.getVariant(
                              item.status as TaskStatus
                            )}
                            className='text-xs shrink-0'
                          >
                            {taskStatusUtils.getLabel(
                              item.status as TaskStatus
                            )}
                          </Badge>
                        )}
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0 hover:bg-muted shrink-0'
                          onClick={e => handleTaskActionClick(e, item.id)}
                        >
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              )
            }

            return (
              <Link
                key={`${item.type}-${item.id}`}
                href={item.href}
                className='block'
              >
                <Card className='p-lg bg-muted/20 border-0 rounded-md shadow-none hover:bg-muted/30 transition-colors cursor-pointer'>
                  <div className='flex items-center justify-between gap-lg'>
                    <div className='flex items-center gap-lg flex-1 min-w-0'>
                      {getPriorityIcon(item)}
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-md flex-wrap'>
                          <span className='text-sm font-medium truncate'>
                            {item.title}
                          </span>
                          {getPriorityBadge(item)}
                        </div>
                        <div className='flex items-center gap-md text-xs text-muted-foreground mt-sm'>
                          <span>{getPriorityLabel(item)}</span>
                          {item.metadata && <span>• {item.metadata}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </PageSection>

      {/* Context Menu */}
      <ContextMenuComponent>
        {({ entityId, close }) => {
          const task = priorities.find(
            item => item.type === 'task' && item.id === entityId
          )
          if (!task || task.type !== 'task') return null

          return (
            <>
              <ViewDetailsMenuItem
                entityId={entityId}
                entityType='tasks'
                close={close}
              />
              <EditMenuItem
                entityId={entityId}
                entityType='tasks'
                close={close}
              />
              <MarkAsDoneMenuItem
                taskId={entityId}
                currentStatus={task.status || 'todo'}
                close={close}
                onSuccess={handleTaskUpdate}
              />
              <SetDueDateMenuItem
                taskId={entityId}
                close={close}
                onSuccess={handleTaskUpdate}
              />
            </>
          )
        }}
      </ContextMenuComponent>

      {/* Task Quick Edit Dialog */}
      {selectedTask && selectedTask.type === 'task' && (
        <TaskQuickEditDialog
          open={isDialogOpen}
          onOpenChange={handleDialogOpenChange}
          task={{
            id: selectedTask.id,
            title: selectedTask.title,
            description: selectedTask.description || null,
            assigneeId: selectedTask.assigneeId || null,
            dueDate: selectedTask.date
              ? selectedTask.date instanceof Date
                ? selectedTask.date
                : new Date(selectedTask.date)
              : null,
            priority: selectedTask.priority ?? 2,
            status: (selectedTask.status || 'todo') as TaskStatus,
          }}
          onTaskUpdate={handleTaskUpdate}
        />
      )}
    </>
  )
}
