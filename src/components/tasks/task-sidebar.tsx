'use client'

import { LinkManager } from '@/components/entity-links'
import { SectionHeader } from '@/components/ui/section-header'
import { InlineEditableDropdown } from '@/components/common/inline-editable-dropdown'
import { InlineEditableDate } from '@/components/common/inline-editable-date'
import {
  Calendar,
  User,
  Clock,
  Rocket,
  Target,
  Flag,
  ListTodo,
} from 'lucide-react'
import Link from 'next/link'
import {
  updateTaskStatus,
  updateTaskPriority,
  updateTaskDueDate,
} from '@/lib/actions/task'
import { taskStatusUtils, type TaskStatus } from '@/lib/task-status'
import { taskPriorityUtils, type TaskPriority } from '@/lib/task-priority'

interface EntityLink {
  id: string
  url: string
  title: string | null
  description: string | null
  createdAt: Date
  updatedAt: Date
  createdBy: {
    id: string
    name: string
    email: string
  }
}

interface TaskSidebarProps {
  links: EntityLink[]
  entityId: string
  status: TaskStatus
  priority: TaskPriority
  initiative?: {
    id: string
    title: string
  } | null
  objective?: {
    id: string
    title: string
  } | null
  estimate?: number | null
  dueDate?: Date | null
  createdBy?: {
    id: string
    name: string
  } | null
  updatedAt: Date
}

export function TaskSidebar({
  links,
  entityId,
  status,
  priority,
  initiative,
  objective,
  estimate,
  dueDate,
  createdBy,
  updatedAt,
}: TaskSidebarProps) {
  const hasDetails = initiative || objective || estimate || dueDate || createdBy

  const handleStatusChange = async (newStatus: string | number) => {
    console.log('handleStatusChange', newStatus)
    await updateTaskStatus(entityId, newStatus as TaskStatus)
  }

  const handlePriorityChange = async (newPriority: string | number) => {
    await updateTaskPriority(entityId, newPriority as number)
  }

  const handleDueDateChange = async (newDueDate: Date | null) => {
    await updateTaskDueDate(entityId, newDueDate)
  }

  const statusOptions = taskStatusUtils.getSelectOptions().map(option => ({
    value: option.value,
    label: option.label,
    variant: taskStatusUtils.getVariant(option.value) || undefined,
  }))

  const priorityOptions = taskPriorityUtils.getSelectOptions().map(option => ({
    value: option.value,
    label: option.label,
    variant: taskPriorityUtils.getRAGVariant(option.value),
  }))

  return (
    <div className='w-full lg:w-80 space-y-6'>
      {/* Details Section */}
      {hasDetails && (
        <div className='page-section'>
          <SectionHeader icon={Clock} title='Details' />
          <div className='text-sm'>
            <table className='w-full'>
              <tbody>
                <tr>
                  <td className='py-1 pr-3'>
                    <div className='flex items-center gap-2 text-muted-foreground'>
                      <ListTodo className='w-3.5 h-3.5' />
                      <span className='font-medium'>Status</span>
                    </div>
                  </td>
                  <td className='py-1'>
                    <InlineEditableDropdown
                      value={status}
                      options={statusOptions}
                      onValueChange={handleStatusChange}
                      getVariant={value =>
                        taskStatusUtils.getVariant(value as TaskStatus) ||
                        'default'
                      }
                      getLabel={value =>
                        taskStatusUtils.getLabel(value as TaskStatus)
                      }
                    />
                  </td>
                </tr>

                <tr>
                  <td className='py-1 pr-3'>
                    <div className='flex items-center gap-2 text-muted-foreground'>
                      <Flag className='w-3.5 h-3.5' />
                      <span className='font-medium'>Priority</span>
                    </div>
                  </td>
                  <td className='py-1'>
                    <InlineEditableDropdown
                      value={priority}
                      options={priorityOptions}
                      onValueChange={handlePriorityChange}
                      getVariant={value =>
                        taskPriorityUtils.getRAGVariant(value as TaskPriority)
                      }
                      getLabel={value =>
                        taskPriorityUtils.getLabel(value as TaskPriority)
                      }
                    />
                  </td>
                </tr>

                {initiative && (
                  <tr>
                    <td className='py-1 pr-3'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Rocket className='w-3.5 h-3.5' />
                        <span className='font-medium'>Initiative</span>
                      </div>
                    </td>
                    <td className='py-1'>
                      <Link
                        href={`/initiatives/${initiative.id}`}
                        className='text-primary hover:text-primary/80 font-medium'
                      >
                        {initiative.title}
                      </Link>
                    </td>
                  </tr>
                )}

                {objective && (
                  <tr>
                    <td className='py-1 pr-3'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Target className='w-3.5 h-3.5' />
                        <span className='font-medium'>Objective</span>
                      </div>
                    </td>
                    <td className='py-1'>{objective.title}</td>
                  </tr>
                )}

                {estimate && (
                  <tr>
                    <td className='py-1 pr-3'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Clock className='w-3.5 h-3.5' />
                        <span className='font-medium'>Estimate</span>
                      </div>
                    </td>
                    <td className='py-1'>{estimate} hours</td>
                  </tr>
                )}

                <tr>
                  <td className='py-1 pr-3'>
                    <div className='flex items-center gap-2 text-muted-foreground'>
                      <Calendar className='w-3.5 h-3.5' />
                      <span className='font-medium'>Due</span>
                    </div>
                  </td>
                  <td className='py-1'>
                    <InlineEditableDate
                      value={dueDate || null}
                      onValueChange={handleDueDateChange}
                      emptyStateText='Click to set due date'
                      shortFormat={true}
                    />
                  </td>
                </tr>

                {createdBy && (
                  <tr>
                    <td className='py-1 pr-3'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <User className='w-3.5 h-3.5' />
                        <span className='font-medium'>Creator</span>
                      </div>
                    </td>
                    <td className='py-1'>{createdBy.name}</td>
                  </tr>
                )}

                <tr>
                  <td className='py-1 pr-3'>
                    <div className='flex items-center gap-2 text-muted-foreground'>
                      <Clock className='w-3.5 h-3.5' />
                      <span className='font-medium'>Updated</span>
                    </div>
                  </td>
                  <td className='py-1'>
                    {new Date(updatedAt).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Links Section */}
      <div className='page-section'>
        <LinkManager entityType='Task' entityId={entityId} links={links} />
      </div>
    </div>
  )
}
