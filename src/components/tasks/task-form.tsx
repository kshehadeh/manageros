'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  TaskSummaryInput,
  type TaskSummaryInputRef,
} from '@/components/tasks/task-summary-input'
import {
  TaskSummaryInputProvider,
  useTaskSummaryInput,
} from '@/components/tasks/task-summary-input-provider'
import { MarkdownEditor } from '@/components/markdown-editor'
import { DateTimePickerWithNaturalInput } from '@/components/ui/datetime-picker-with-natural-input'
import { createTask, updateTask } from '@/lib/actions/task'
import { type TaskFormData, taskSchema } from '@/lib/validations'
import { Person, Objective } from '@prisma/client'
import {
  type TaskStatus,
  taskStatusUtils,
  DEFAULT_TASK_STATUS,
} from '@/lib/task-status'
import { taskPriorityUtils, DEFAULT_TASK_PRIORITY } from '@/lib/task-priority'
import {
  AlertCircle,
  User,
  CheckCircle,
  Flag,
  Calendar,
  Target,
  Crosshair,
} from 'lucide-react'
import { HelpIcon } from '@/components/help-icon'
import { InitiativeSelect } from '@/components/ui/initiative-select'
import { PersonSelect } from '@/components/ui/person-select'

interface TaskFormProps {
  people: Person[]
  objectives: Objective[]
  preselectedAssigneeId?: string
  preselectedInitiativeId?: string
  preselectedObjectiveId?: string
  initialData?: Partial<TaskFormData>
  isEditing?: boolean
  taskId?: string
}

function TaskFormContent({
  people: _people,
  objectives,
  preselectedAssigneeId,
  preselectedInitiativeId,
  preselectedObjectiveId,
  initialData,
  isEditing = false,
  taskId,
}: TaskFormProps) {
  const { getCleanedText, detectedDate, detectedPriority } =
    useTaskSummaryInput()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedInitiativeId, setSelectedInitiativeId] = useState(
    preselectedInitiativeId || initialData?.initiativeId || ''
  )
  const summaryInputRef = useRef<TaskSummaryInputRef>(null)

  // Store original values to revert to when detection is cleared
  const originalDueDate = initialData?.dueDate || ''
  const originalPriority =
    (initialData?.priority as number) || DEFAULT_TASK_PRIORITY

  // Form state to prevent clearing on errors
  const [formData, setFormData] = useState<TaskFormData>({
    title: initialData?.title || '',
    description: initialData?.description || undefined,
    assigneeId: preselectedAssigneeId || initialData?.assigneeId || undefined,
    status: initialData?.status || DEFAULT_TASK_STATUS,
    priority: originalPriority,
    dueDate: originalDueDate,
    initiativeId:
      preselectedInitiativeId || initialData?.initiativeId || undefined,
    objectiveId:
      preselectedObjectiveId || initialData?.objectiveId || undefined,
  })

  // Filter objectives based on selected initiative
  const availableObjectives = selectedInitiativeId
    ? objectives.filter(obj => obj.initiativeId === selectedInitiativeId)
    : []

  // Focus on summary input when form mounts
  useEffect(() => {
    if (summaryInputRef.current) {
      summaryInputRef.current.focus()
    }
  }, [])

  // Sync detected values with form fields
  useEffect(() => {
    if (detectedDate) {
      // Use full ISO date for DateTimePickerWithNaturalInput
      setFormData(prev => ({
        ...prev,
        dueDate: detectedDate.date,
      }))
      // Clear field error when date is detected
      if (errors.dueDate) {
        setErrors(prev => ({ ...prev, dueDate: '' }))
      }
    } else {
      // Revert to original date when detection is cleared
      setFormData(prev => ({ ...prev, dueDate: originalDueDate }))
    }
  }, [detectedDate, errors.dueDate, originalDueDate])

  useEffect(() => {
    if (detectedPriority) {
      setFormData(prev => ({ ...prev, priority: detectedPriority.priority }))
      // Clear field error when priority is detected
      if (errors.priority) {
        setErrors(prev => ({ ...prev, priority: '' }))
      }
    } else {
      // Revert to original priority when detection is cleared
      setFormData(prev => ({ ...prev, priority: originalPriority }))
    }
  }, [detectedPriority, errors.priority, originalPriority])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      // Get cleaned text from provider (with detected dates/priorities removed)
      const cleanedTitle = getCleanedText()

      // Create form data with cleaned title
      const formDataWithCleanedTitle = {
        ...formData,
        title: cleanedTitle || formData.title, // Fallback to original if cleaned is empty
      }

      // Validate the form data using Zod schema
      const validatedData = taskSchema.parse(formDataWithCleanedTitle)

      if (isEditing && taskId) {
        await updateTask(taskId, validatedData)
      } else {
        await createTask(validatedData)
      }
    } catch (error: unknown) {
      console.error('Error submitting task:', error)

      // Don't handle redirect errors - let them bubble up
      if (error && typeof error === 'object' && 'digest' in error) {
        const digest = (error as { digest?: string }).digest
        if (digest?.startsWith('NEXT_REDIRECT')) {
          throw error // Re-throw redirect errors
        }
      }

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
          <TaskSummaryInput
            ref={summaryInputRef}
            value={formData.title}
            inputClassName='text-2xl font-semibold'
            onChange={() => {
              // Let the provider handle all text updates
            }}
            onSubmit={() => {
              // Create a minimal synthetic event for handleSubmit
              const syntheticEvent = {
                preventDefault: () => {},
              } as React.FormEvent<HTMLFormElement>
              handleSubmit(syntheticEvent)
            }}
            placeholder='Enter task title and details...'
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className='text-sm text-red-500 mt-1'>{errors.title}</p>
          )}
        </div>

        <div>
          <MarkdownEditor
            value={formData.description || ''}
            onChange={value => handleInputChange('description', value)}
            placeholder='Enter task description... Use Markdown for formatting!'
            className={errors.description ? 'border-red-500' : ''}
          />
          {errors.description && (
            <p className='text-sm text-red-500 mt-1'>{errors.description}</p>
          )}
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <div className='flex items-center gap-2'>
              <User className='h-4 w-4 text-muted-foreground shrink-0' />
              <PersonSelect
                value={formData.assigneeId || ''}
                onValueChange={value => {
                  const actualValue = value === 'none' ? '' : value
                  handleInputChange('assigneeId', actualValue || undefined)
                }}
                placeholder='Select assignee (optional)'
                includeNone={true}
                noneLabel='No assignee'
                showAvatar={true}
                showRole={true}
                className={`flex-1 ${errors.assigneeId ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.assigneeId && (
              <p className='text-sm text-red-500 mt-1'>{errors.assigneeId}</p>
            )}
          </div>

          <div>
            <div className='flex items-center gap-2'>
              <CheckCircle className='h-4 w-4 text-muted-foreground shrink-0' />
              <select
                id='status'
                name='status'
                value={formData.status}
                onChange={e =>
                  handleInputChange('status', e.target.value as TaskStatus)
                }
                className={`input flex-1 ${errors.status ? 'border-red-500' : ''}`}
              >
                {taskStatusUtils.getSelectOptions().map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <HelpIcon helpId='task-status' size='sm' />
            </div>
            {errors.status && (
              <p className='text-sm text-red-500 mt-1'>{errors.status}</p>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <div className='flex items-center gap-2'>
              <Flag className='h-4 w-4 text-muted-foreground shrink-0' />
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
                className={`input flex-1 ${errors.priority ? 'border-red-500' : ''}`}
              >
                {taskPriorityUtils.getSelectOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <HelpIcon helpId='task-priorities' size='sm' />
            </div>
            {errors.priority && (
              <p className='text-sm text-red-500 mt-1'>{errors.priority}</p>
            )}
          </div>

          <div>
            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4 text-muted-foreground shrink-0' />
              <DateTimePickerWithNaturalInput
                value={formData.dueDate}
                onChange={value => handleInputChange('dueDate', value)}
                placeholder="e.g., 'tomorrow', 'next Monday', 'Jan 15'"
                disabled={isSubmitting}
                error={!!errors.dueDate}
                dateOnly={false}
                shortFormat={false}
              />
            </div>
            {errors.dueDate && (
              <p className='text-sm text-red-500 mt-1'>{errors.dueDate}</p>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <div className='flex items-center gap-2'>
              <Target className='h-4 w-4 text-muted-foreground shrink-0' />
              <InitiativeSelect
                value={selectedInitiativeId}
                onValueChange={value => {
                  const actualValue = value === 'none' ? '' : value
                  setSelectedInitiativeId(actualValue)
                  handleInputChange('initiativeId', actualValue)
                  // Clear objective when initiative changes
                  handleInputChange('objectiveId', '')
                }}
                placeholder='Select initiative (optional)'
                includeNone={true}
                noneLabel='No initiative'
                showStatus={true}
                showTeam={false}
                className={errors.initiativeId ? 'border-red-500' : ''}
              />
            </div>
            {errors.initiativeId && (
              <p className='text-sm text-red-500 mt-1'>{errors.initiativeId}</p>
            )}
          </div>

          <div>
            <div className='flex items-center gap-2'>
              <Crosshair className='h-4 w-4 text-muted-foreground shrink-0' />
              <select
                id='objectiveId'
                name='objectiveId'
                value={formData.objectiveId || ''}
                onChange={e => handleInputChange('objectiveId', e.target.value)}
                disabled={!selectedInitiativeId}
                className={`input flex-1 ${errors.objectiveId ? 'border-red-500' : ''}`}
              >
                <option value=''>Select objective (optional)</option>
                {availableObjectives.map(objective => (
                  <option key={objective.id} value={objective.id}>
                    {objective.title}
                  </option>
                ))}
              </select>
            </div>
            {errors.objectiveId && (
              <p className='text-sm text-red-500 mt-1'>{errors.objectiveId}</p>
            )}
          </div>
        </div>
      </div>

      <div className='flex items-center gap-3'>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving...'
            : isEditing
              ? 'Update Task'
              : 'Create Task'}
        </Button>
      </div>
    </form>
  )
}

export function TaskForm(props: TaskFormProps) {
  return (
    <TaskSummaryInputProvider>
      <TaskFormContent {...props} />
    </TaskSummaryInputProvider>
  )
}
