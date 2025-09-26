'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EnhancedTaskInput } from '@/components/enhanced-task-input'
import { Textarea } from '@/components/ui/textarea'
import { createTask, updateTask } from '@/lib/actions'
import { type TaskFormData, taskSchema } from '@/lib/validations'
import { Person, Initiative, Objective } from '@prisma/client'
import {
  type TaskStatus,
  taskStatusUtils,
  DEFAULT_TASK_STATUS,
} from '@/lib/task-status'
import { taskPriorityUtils, DEFAULT_TASK_PRIORITY } from '@/lib/task-priority'
import { AlertCircle } from 'lucide-react'
import { HelpIcon } from '@/components/help-icon'

interface TaskFormProps {
  people: Person[]
  initiatives: Initiative[]
  objectives: Objective[]
  preselectedAssigneeId?: string
  preselectedInitiativeId?: string
  preselectedObjectiveId?: string
  initialData?: Partial<TaskFormData>
  isEditing?: boolean
  taskId?: string
}

export function TaskForm({
  people,
  initiatives,
  objectives,
  preselectedAssigneeId,
  preselectedInitiativeId,
  preselectedObjectiveId,
  initialData,
  isEditing = false,
  taskId,
}: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedInitiativeId, setSelectedInitiativeId] = useState(
    preselectedInitiativeId || initialData?.initiativeId || ''
  )

  // Form state to prevent clearing on errors
  const [formData, setFormData] = useState<TaskFormData>({
    title: initialData?.title || '',
    description: initialData?.description || undefined,
    assigneeId: preselectedAssigneeId || initialData?.assigneeId || undefined,
    status: initialData?.status || DEFAULT_TASK_STATUS,
    priority: (initialData?.priority as number) || DEFAULT_TASK_PRIORITY,
    estimate: initialData?.estimate || undefined,
    dueDate: initialData?.dueDate || undefined,
    initiativeId:
      preselectedInitiativeId || initialData?.initiativeId || undefined,
    objectiveId:
      preselectedObjectiveId || initialData?.objectiveId || undefined,
  })

  // Filter objectives based on selected initiative
  const availableObjectives = selectedInitiativeId
    ? objectives.filter(obj => obj.initiativeId === selectedInitiativeId)
    : []

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      // Validate the form data using Zod schema
      const validatedData = taskSchema.parse(formData)

      if (isEditing && taskId) {
        await updateTask(taskId, validatedData)
      } else {
        await createTask(validatedData)
      }
    } catch (error: unknown) {
      console.error('Error submitting task:', error)

      if (error && typeof error === 'object' && 'errors' in error) {
        // Handle Zod validation errors
        const fieldErrors: Record<string, string> = {}
        const zodError = error as {
          errors: Array<{ path: string[]; message: string }>
        }
        zodError.errors.forEach(err => {
          if (err.path && err.path.length > 0) {
            fieldErrors[err.path[0]] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        // Handle other errors (server errors, etc.)
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Error submitting task. Please try again.'
        setErrors({ general: errorMessage })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleInputChange(
    field: keyof TaskFormData,
    value: string | number | undefined
  ) {
    // Convert empty strings to undefined for optional fields (except title which is required)
    const processedValue = value === '' && field !== 'title' ? undefined : value
    setFormData(prev => ({ ...prev, [field]: processedValue }))
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  function handleDateDetected(date: string | null) {
    // Update the due date field if a date is detected
    if (date) {
      handleInputChange('dueDate', date)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {errors.general && (
        <div className='flex items-center gap-2 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md'>
          <AlertCircle className='h-4 w-4' />
          <span>{errors.general}</span>
        </div>
      )}

      <div className='space-y-4'>
        <div>
          <label htmlFor='title' className='block text-sm font-medium mb-2'>
            Task Title *
          </label>
          <EnhancedTaskInput
            value={formData.title}
            onChange={value => handleInputChange('title', value)}
            onDateDetected={handleDateDetected}
            placeholder='Enter task title'
            className={errors.title ? 'border-red-500' : ''}
            showDatePreview={false}
            showInlineDate={true}
          />
          {errors.title && (
            <p className='text-sm text-red-500 mt-1'>{errors.title}</p>
          )}
        </div>

        <div>
          <label
            htmlFor='description'
            className='block text-sm font-medium mb-2'
          >
            Description
          </label>
          <Textarea
            id='description'
            name='description'
            rows={3}
            value={formData.description || ''}
            onChange={e => handleInputChange('description', e.target.value)}
            placeholder='Enter task description'
            className={errors.description ? 'border-red-500' : ''}
          />
          {errors.description && (
            <p className='text-sm text-red-500 mt-1'>{errors.description}</p>
          )}
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label
              htmlFor='assigneeId'
              className='block text-sm font-medium mb-2'
            >
              Assignee
            </label>
            <select
              id='assigneeId'
              name='assigneeId'
              value={formData.assigneeId || ''}
              onChange={e => handleInputChange('assigneeId', e.target.value)}
              className={`input ${errors.assigneeId ? 'border-red-500' : ''}`}
            >
              <option value=''>Select assignee (optional)</option>
              {people.map(person => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
            {errors.assigneeId && (
              <p className='text-sm text-red-500 mt-1'>{errors.assigneeId}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='status'
              className='flex items-center gap-2 text-sm font-medium mb-2'
            >
              Status
              <HelpIcon helpId='task-status' size='sm' />
            </label>
            <select
              id='status'
              name='status'
              value={formData.status}
              onChange={e =>
                handleInputChange('status', e.target.value as TaskStatus)
              }
              className={`input ${errors.status ? 'border-red-500' : ''}`}
            >
              {taskStatusUtils.getSelectOptions().map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className='text-sm text-red-500 mt-1'>{errors.status}</p>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label
              htmlFor='priority'
              className='flex items-center gap-2 text-sm font-medium mb-2'
            >
              Priority
              <HelpIcon helpId='task-priorities' size='sm' />
            </label>
            <select
              id='priority'
              name='priority'
              value={formData.priority}
              onChange={e =>
                handleInputChange(
                  'priority',
                  parseInt(e.target.value) as number
                )
              }
              className={`input ${errors.priority ? 'border-red-500' : ''}`}
            >
              {taskPriorityUtils.getSelectOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.priority && (
              <p className='text-sm text-red-500 mt-1'>{errors.priority}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='estimate'
              className='block text-sm font-medium mb-2'
            >
              Estimate (hours)
            </label>
            <Input
              type='number'
              id='estimate'
              name='estimate'
              min='0'
              step='0.5'
              value={formData.estimate || ''}
              onChange={e =>
                handleInputChange(
                  'estimate',
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              placeholder='Hours'
              className={errors.estimate ? 'border-red-500' : ''}
            />
            {errors.estimate && (
              <p className='text-sm text-red-500 mt-1'>{errors.estimate}</p>
            )}
          </div>

          <div>
            <label htmlFor='dueDate' className='block text-sm font-medium mb-2'>
              Due Date
            </label>
            <Input
              type='date'
              id='dueDate'
              name='dueDate'
              value={formData.dueDate || ''}
              onChange={e => handleInputChange('dueDate', e.target.value)}
              className={errors.dueDate ? 'border-red-500' : ''}
            />
            {errors.dueDate && (
              <p className='text-sm text-red-500 mt-1'>{errors.dueDate}</p>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label
              htmlFor='initiativeId'
              className='block text-sm font-medium mb-2'
            >
              Initiative
            </label>
            <select
              id='initiativeId'
              name='initiativeId'
              value={selectedInitiativeId}
              onChange={e => {
                const value = e.target.value
                setSelectedInitiativeId(value)
                handleInputChange('initiativeId', value)
                // Clear objective when initiative changes
                handleInputChange('objectiveId', '')
              }}
              className={`input ${errors.initiativeId ? 'border-red-500' : ''}`}
            >
              <option value=''>Select initiative (optional)</option>
              {initiatives.map(initiative => (
                <option key={initiative.id} value={initiative.id}>
                  {initiative.title}
                </option>
              ))}
            </select>
            {errors.initiativeId && (
              <p className='text-sm text-red-500 mt-1'>{errors.initiativeId}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='objectiveId'
              className='block text-sm font-medium mb-2'
            >
              Objective
            </label>
            <select
              id='objectiveId'
              name='objectiveId'
              value={formData.objectiveId || ''}
              onChange={e => handleInputChange('objectiveId', e.target.value)}
              disabled={!selectedInitiativeId}
              className={`input ${errors.objectiveId ? 'border-red-500' : ''}`}
            >
              <option value=''>Select objective (optional)</option>
              {availableObjectives.map(objective => (
                <option key={objective.id} value={objective.id}>
                  {objective.title}
                </option>
              ))}
            </select>
            {errors.objectiveId && (
              <p className='text-sm text-red-500 mt-1'>{errors.objectiveId}</p>
            )}
          </div>
        </div>
      </div>

      <div className='flex items-center gap-3'>
        <Button type='submit' disabled={isSubmitting} variant='outline'>
          {isSubmitting
            ? 'Saving...'
            : isEditing
              ? 'Update Task'
              : 'Create Task'}
        </Button>
        <Button asChild variant='outline'>
          <Link href='/tasks'>Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
