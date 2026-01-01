'use client'

import {
  ListTodo,
  Flag,
  TrendingUp,
  Ruler,
  Hash,
  Activity,
  Calendar,
  Target,
  Info,
} from 'lucide-react'
import {
  PropertiesSidebar,
  type PropertyItem,
} from '@/components/ui/properties-sidebar'
import { SectionHeader } from '@/components/ui/section-header'
import { InlineEditableDropdown } from '@/components/common/inline-editable-dropdown'
import {
  updateInitiativeStatus,
  updateInitiativeRag,
  updateInitiativePriority,
  updateInitiativeSize,
  updateInitiativeStartDate,
  updateInitiativeTargetDate,
} from '@/lib/actions/initiative'
import { InlineEditableDate } from '@/components/common/inline-editable-date'
import {
  initiativeStatusUtils,
  type InitiativeStatus,
} from '@/lib/initiative-status'
import { taskPriorityUtils, type TaskPriority } from '@/lib/task-priority'
import { initiativeSizeUtils, type InitiativeSize } from '@/lib/initiative-size'
import { Rag } from '@/components/rag'

interface InitiativePropertiesSidebarProps {
  initiativeId: string
  status: InitiativeStatus
  rag: string | null
  priority: number | null
  size: string | null
  slot: number | null
  startDate: Date | null
  targetDate: Date | null
  progress?: number
  canEdit?: boolean
}

export function InitiativePropertiesSidebar({
  initiativeId,
  status,
  rag,
  priority,
  size,
  slot,
  startDate,
  targetDate,
  progress,
  canEdit = true,
}: InitiativePropertiesSidebarProps) {
  const handleStatusChange = async (newStatus: string | number) => {
    await updateInitiativeStatus(initiativeId, newStatus as string)
  }

  const handleRagChange = async (newRag: string | number) => {
    await updateInitiativeRag(initiativeId, newRag as string)
  }

  const handlePriorityChange = async (newPriority: string | number) => {
    await updateInitiativePriority(initiativeId, newPriority as number)
  }

  const handleSizeChange = async (newSize: string | number) => {
    const sizeValue = newSize === '' ? null : (newSize as string)
    await updateInitiativeSize(initiativeId, sizeValue)
  }

  const handleStartDateChange = async (newDate: Date | null) => {
    await updateInitiativeStartDate(initiativeId, newDate)
  }

  const handleTargetDateChange = async (newDate: Date | null) => {
    await updateInitiativeTargetDate(initiativeId, newDate)
  }

  const statusOptions = initiativeStatusUtils
    .getSelectOptions()
    .map(option => ({
      value: option.value,
      label: option.label,
      variant: initiativeStatusUtils.getVariant(option.value) || undefined,
    }))

  const ragOptions = [
    { value: 'green', label: 'Green' },
    { value: 'amber', label: 'Amber' },
    { value: 'red', label: 'Red' },
  ]

  const priorityOptions = taskPriorityUtils.getSelectOptions().map(option => ({
    value: option.value,
    label: option.label,
    variant: taskPriorityUtils.getRAGVariant(option.value),
  }))

  const sizeOptions = initiativeSizeUtils.getSelectOptions().map(option => ({
    value: option.value,
    label: option.label,
    variant: initiativeSizeUtils.getVariant(option.value),
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
          getLabel={value =>
            initiativeStatusUtils.getLabel(value as InitiativeStatus)
          }
        />
      ) : (
        <span className='text-sm'>
          {initiativeStatusUtils.getLabel(status)}
        </span>
      ),
    },
    {
      key: 'rag',
      label: 'RAG',
      icon: Activity,
      value: canEdit ? (
        <InlineEditableDropdown
          value={rag || 'green'}
          options={ragOptions}
          onValueChange={handleRagChange}
          getLabel={value => {
            const label = ragOptions.find(o => o.value === value)?.label
            return label || String(value)
          }}
        />
      ) : (
        <Rag rag={rag || 'green'} size='small' />
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      icon: Flag,
      value:
        priority !== null ? (
          canEdit ? (
            <InlineEditableDropdown
              value={priority}
              options={priorityOptions}
              onValueChange={handlePriorityChange}
              getLabel={value =>
                taskPriorityUtils.getLabel(value as TaskPriority)
              }
            />
          ) : (
            <span className='text-sm'>
              {taskPriorityUtils.getLabel(priority as TaskPriority)}
            </span>
          )
        ) : (
          <span className='text-muted-foreground text-sm'>Not set</span>
        ),
    },
    {
      key: 'size',
      label: 'Size',
      icon: Ruler,
      value: canEdit ? (
        <InlineEditableDropdown
          value={size || ''}
          options={[{ value: '', label: 'Not set' }, ...sizeOptions]}
          onValueChange={handleSizeChange}
          getLabel={value => {
            if (!value) return 'Not set'
            return initiativeSizeUtils.isValid(value as string)
              ? initiativeSizeUtils.getLabel(value as InitiativeSize)
              : 'Not set'
          }}
        />
      ) : size && initiativeSizeUtils.isValid(size) ? (
        <span className='text-sm'>
          {initiativeSizeUtils.getLabel(size as InitiativeSize)}
        </span>
      ) : (
        <span className='text-muted-foreground text-sm'>Not set</span>
      ),
    },
    {
      key: 'slot',
      label: 'Slot',
      icon: Hash,
      value:
        slot !== null ? (
          <span className='text-sm font-medium'>#{slot}</span>
        ) : (
          <span className='text-muted-foreground text-sm'>Not assigned</span>
        ),
    },
    {
      key: 'startDate',
      label: 'Start',
      icon: Calendar,
      value: canEdit ? (
        <InlineEditableDate
          value={startDate}
          onValueChange={handleStartDateChange}
          emptyStateText='Not set'
          shortFormat={true}
        />
      ) : startDate ? (
        <span className='text-sm'>
          {startDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ) : (
        <span className='text-muted-foreground text-sm'>Not set</span>
      ),
    },
    {
      key: 'targetDate',
      label: 'Target',
      icon: Target,
      value: canEdit ? (
        <InlineEditableDate
          value={targetDate}
          onValueChange={handleTargetDateChange}
          emptyStateText='Not set'
          shortFormat={true}
        />
      ) : targetDate ? (
        <span className='text-sm'>
          {targetDate.toLocaleDateString('en-US', {
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

  if (progress !== undefined) {
    properties.push({
      key: 'progress',
      label: 'Progress',
      icon: TrendingUp,
      value: <span className='text-sm font-medium'>{progress}%</span>,
    })
  }

  return (
    <div>
      <SectionHeader icon={Info} title='Details' />
      <PropertiesSidebar properties={properties} />
    </div>
  )
}
