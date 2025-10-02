import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { taskStatusUtils, type TaskStatus } from '@/lib/task-status'
import { taskPriorityUtils, type TaskPriority } from '@/lib/task-priority'
import type { TaskListItem } from '@/lib/task-list-select'

interface TaskCardProps {
  task: TaskListItem
  statusVariant: 'neutral' | 'warning' | 'error' | 'success'
  priorityVariant: 'neutral' | 'warning' | 'error' | 'success'
}

export function TaskCard({
  task,
  statusVariant,
  priorityVariant,
}: TaskCardProps) {
  return (
    <Link
      href={`/tasks/${task.id}`}
      className='block border border-border rounded-xl p-3 hover:bg-accent/50 transition-colors'
    >
      <div className='space-y-2'>
        <div className='flex items-start justify-between'>
          <h4 className='font-medium text-sm leading-tight text-foreground'>
            {task.title}
          </h4>
          <div className='flex items-center gap-1 ml-2'>
            <Badge variant={statusVariant} className='text-xs'>
              {taskStatusUtils
                .getLabel(task.status as TaskStatus)
                .toUpperCase()}
            </Badge>
            <Badge variant={priorityVariant} className='text-xs'>
              {taskPriorityUtils.getShortLabel(task.priority as TaskPriority)}
            </Badge>
          </div>
        </div>

        {task.description && (
          <div className='line-clamp-2'>
            <ReadonlyNotesField
              content={task.description}
              variant='compact'
              showEmptyState={false}
            />
          </div>
        )}

        <div className='space-y-1'>
          {task.assignee && (
            <div className='text-xs text-muted-foreground'>
              <span className='font-medium'>Assignee:</span>{' '}
              {task.assignee.name}
            </div>
          )}

          {task.createdBy && (
            <div className='text-xs text-muted-foreground'>
              <span className='font-medium'>Created by:</span>{' '}
              {task.createdBy.name}
            </div>
          )}

          {task.initiative && (
            <div className='text-xs text-muted-foreground'>
              <span className='font-medium'>Initiative:</span>{' '}
              <Link
                href={`/initiatives/${task.initiative.id}`}
                className='text-primary hover:text-primary/80 transition-colors'
              >
                {task.initiative.title}
              </Link>
            </div>
          )}

          {task.objective && (
            <div className='text-xs text-muted-foreground'>
              <span className='font-medium'>Objective:</span>{' '}
              {task.objective.title}
            </div>
          )}

          {task.dueDate && (
            <div className='text-xs text-muted-foreground'>
              <span className='font-medium'>Due:</span>{' '}
              {new Date(task.dueDate).toLocaleDateString()}
            </div>
          )}

          {task.estimate && (
            <div className='text-xs text-muted-foreground'>
              <span className='font-medium'>Estimate:</span> {task.estimate}h
            </div>
          )}
        </div>

        <div className='text-xs text-muted-foreground'>
          Updated {new Date(task.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </Link>
  )
}
