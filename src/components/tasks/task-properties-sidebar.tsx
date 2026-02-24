'use client'

import {
  ListTodo,
  Flag,
  Calendar,
  User,
  Clock,
  Rocket,
  Target,
  Info,
  Bell,
} from 'lucide-react'
import {
  PropertiesSidebar,
  type PropertyItem,
} from '@/components/ui/properties-sidebar'
import { SectionHeader } from '@/components/ui/section-header'
import { InlineEditableDropdown } from '@/components/common/inline-editable-dropdown'
import { InlineEditableDate } from '@/components/common/inline-editable-date'
import {
  updateTaskStatus,
  updateTaskPriority,
  updateTaskDueDate,
} from '@/lib/actions/task'
import { updateTaskReminderPreference } from '@/lib/actions/task-reminders'
import { getReminderOptions, getReminderLabel } from '@/lib/task-reminders'
import { taskStatusUtils, type TaskStatus } from '@/lib/task-status'
import { taskPriorityUtils, type TaskPriority } from '@/lib/task-priority'
import { Link } from '@/components/ui/link'

interface TaskPropertiesSidebarProps {
  taskId: string
  status: TaskStatus
  priority: TaskPriority
  assignee?: {
    id: string
    name: string
  } | null
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
  reminderMinutesBeforeDue?: number | null
  createdBy?: {
    id: string
    name: string
  } | null
  updatedAt: Date
  canEdit?: boolean
  showHeader?: boolean
}

export function TaskPropertiesSidebar({
  taskId,
  status,
  priority,
  assignee,
  initiative,
  objective,
  estimate,
  dueDate,
  reminderMinutesBeforeDue,
  createdBy,
  updatedAt,
  canEdit = true,
  showHeader = true,
}: TaskPropertiesSidebarProps) {
  const handleStatusChange = async (newStatus: string | number) => {
    await updateTaskStatus(taskId, newStatus as TaskStatus)
  }

  const handlePriorityChange = async (newPriority: string | number) => {
    await updateTaskPriority(taskId, newPriority as number)
  }

  const handleDueDateChange = async (newDueDate: Date | null) => {
    await updateTaskDueDate(taskId, newDueDate)
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

  const properties: PropertyItem[] = [
    {
      key: 'status',
      label: 'Status',
      icon: ListTodo,
      value: canEdit ? (
        <InlineEditableDropdown
          value={status}
          options={statusOptions}
          onValueChange={handleStatusChange}
          getLabel={value => taskStatusUtils.getLabel(value as TaskStatus)}
        />
      ) : (
        <span className='text-sm'>{taskStatusUtils.getLabel(status)}</span>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      icon: Flag,
      value: canEdit ? (
        <InlineEditableDropdown
          value={priority}
          options={priorityOptions}
          onValueChange={handlePriorityChange}
          getLabel={value => taskPriorityUtils.getLabel(value as TaskPriority)}
        />
      ) : (
        <span className='text-sm'>{taskPriorityUtils.getLabel(priority)}</span>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due',
      icon: Calendar,
      value: canEdit ? (
        <InlineEditableDate
          value={dueDate || null}
          onValueChange={handleDueDateChange}
          emptyStateText='Not set'
          shortFormat={true}
        />
      ) : dueDate ? (
        <span className='text-sm'>
          {dueDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ) : (
        <span className='text-muted-foreground text-sm'>Not set</span>
      ),
    },
  ]

  if (dueDate != null && canEdit) {
    const reminderOptions = getReminderOptions().map(opt => ({
      value: (opt.value ?? 'none') as string | number,
      label: opt.label,
      variant: undefined,
    }))
    properties.push({
      key: 'reminder',
      label: 'Reminder',
      icon: Bell,
      value: (
        <InlineEditableDropdown
          value={(reminderMinutesBeforeDue ?? 'none') as string | number}
          options={reminderOptions}
          onValueChange={async (val: string | number) => {
            const v = val === 'none' || val === '' ? null : (val as number)
            await updateTaskReminderPreference(taskId, v)
          }}
          getLabel={value =>
            value === 'none' || value === '' || value == null
              ? 'No reminder'
              : getReminderLabel(value as number)
          }
        />
      ),
    })
  } else if (dueDate != null && reminderMinutesBeforeDue != null) {
    properties.push({
      key: 'reminder',
      label: 'Reminder',
      icon: Bell,
      value: (
        <span className='text-sm'>
          {getReminderLabel(reminderMinutesBeforeDue)}
        </span>
      ),
    })
  }

  if (assignee) {
    properties.push({
      key: 'assignee',
      label: 'Assignee',
      icon: User,
      value: (
        <Link
          href={`/people/${assignee.id}`}
          className='text-sm text-primary hover:underline'
        >
          {assignee.name}
        </Link>
      ),
    })
  }

  if (initiative) {
    properties.push({
      key: 'initiative',
      label: 'Initiative',
      icon: Rocket,
      value: (
        <Link
          href={`/initiatives/${initiative.id}`}
          className='text-sm text-primary hover:underline'
        >
          {initiative.title}
        </Link>
      ),
    })
  }

  if (objective) {
    properties.push({
      key: 'objective',
      label: 'Objective',
      icon: Target,
      value: <span className='text-sm'>{objective.title}</span>,
    })
  }

  if (estimate) {
    properties.push({
      key: 'estimate',
      label: 'Estimate',
      icon: Clock,
      value: <span className='text-sm'>{estimate} hours</span>,
    })
  }

  if (createdBy) {
    properties.push({
      key: 'createdBy',
      label: 'Creator',
      icon: User,
      value: <span className='text-sm'>{createdBy.name}</span>,
    })
  }

  properties.push({
    key: 'updatedAt',
    label: 'Updated',
    icon: Clock,
    value: (
      <span className='text-sm'>{new Date(updatedAt).toLocaleString()}</span>
    ),
  })

  return (
    <div>
      {showHeader && <SectionHeader icon={Info} title='Details' />}
      <PropertiesSidebar properties={properties} />
    </div>
  )
}
