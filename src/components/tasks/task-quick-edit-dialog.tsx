'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateTimePickerWithNaturalInput } from '@/components/ui/datetime-picker-with-natural-input'
import { SlateTaskTextarea } from '@/components/tasks/slate-task-textarea'
import { updateTaskQuickEdit } from '@/lib/actions/task'
import { type TaskStatus, taskStatusUtils } from '@/lib/task-status'
import { taskPriorityUtils } from '@/lib/task-priority'
import { type DetectedDate } from '@/lib/utils/date-detection'
import { type DetectedPriority } from '@/lib/utils/priority-detection'
import {
  AlertCircle,
  ExternalLink,
  User,
  Calendar,
  Flag,
  CheckCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { usePeopleForSelect } from '@/hooks/use-organization-cache'

interface TaskQuickEditDialogProps {
  open: boolean
  onOpenChange: (_open: boolean) => void
  task: {
    id: string
    title: string
    description?: string | null
    assigneeId?: string | null
    dueDate?: Date | string | null
    priority: number
    status: TaskStatus
  }
  onTaskUpdate?: (
    _updatedTask: Partial<{
      title: string
      assigneeId: string | null
      assigneeName: string | null
      dueDate: Date | string | null
      priority: number
      status: TaskStatus
    }>
  ) => void
}

export function TaskQuickEditDialog({
  open,
  onOpenChange,
  task,
  onTaskUpdate,
}: TaskQuickEditDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { people } = usePeopleForSelect()

  const [formData, setFormData] = useState({
    title: task.title,
    assigneeId: task.assigneeId || 'unassigned',
    dueDate: task.dueDate
      ? typeof task.dueDate === 'string'
        ? task.dueDate
        : task.dueDate.toISOString()
      : '',
    priority: task.priority || 3, // Default to Medium priority if undefined
    status: task.status,
  })

  // Manual scroll lock management to ensure proper cleanup
  useEffect(() => {
    if (open) {
      // Save current scroll position
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'

      return () => {
        // Restore scroll position and remove styles
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [open])

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | number
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleDateChange = (value: string) => {
    setFormData(prev => ({ ...prev, dueDate: value }))
    // Clear field error when user changes date
    if (errors.dueDate) {
      setErrors(prev => ({ ...prev, dueDate: '' }))
    }
  }

  const handleDateDetected = (detectedDate: DetectedDate | null) => {
    // Update the due date field if a date is detected
    if (detectedDate) {
      setFormData(prev => ({ ...prev, dueDate: detectedDate.date }))
      // Clear field error when date is detected
      if (errors.dueDate) {
        setErrors(prev => ({ ...prev, dueDate: '' }))
      }
    }
  }

  const handlePriorityDetected = (
    detectedPriority: DetectedPriority | null
  ) => {
    // Update the priority field if a priority is detected
    if (detectedPriority) {
      setFormData(prev => ({ ...prev, priority: detectedPriority.priority }))
      // Clear field error when priority is detected
      if (errors.priority) {
        setErrors(prev => ({ ...prev, priority: '' }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      // Prepare the update data
      const updateData = {
        title: formData.title,
        assigneeId:
          formData.assigneeId === 'unassigned' ? null : formData.assigneeId,
        dueDate: formData.dueDate || null,
        priority: formData.priority,
        status: formData.status,
      }

      await updateTaskQuickEdit(task.id, updateData)

      toast.success('Task updated successfully')

      // Get the assignee name for the optimistic update
      const assigneeName =
        formData.assigneeId === 'unassigned'
          ? null
          : people.find(p => p.id === formData.assigneeId)?.name || null

      // Pass the updated task data back for optimistic update
      onTaskUpdate?.({
        title: formData.title,
        assigneeId:
          formData.assigneeId === 'unassigned' ? null : formData.assigneeId,
        assigneeName,
        dueDate: formData.dueDate || null,
        priority: formData.priority,
        status: formData.status,
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Error updating task:', error)

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
        // Handle other errors
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Error updating task. Please try again.'
        setErrors({ general: errorMessage })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenFullEditor = () => {
    onOpenChange(false)
    router.push(`/tasks/${task.id}/edit`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='md:max-w-[50vw] max-w-full'>
        <DialogHeader>
          <DialogTitle>Quick Edit Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {errors.general && (
            <div className='flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md'>
              <AlertCircle className='h-4 w-4' />
              <span>{errors.general}</span>
            </div>
          )}

          <div className='space-y-4'>
            {/* Summary Field */}
            <div className='space-y-2'>
              <SlateTaskTextarea
                value={formData.title}
                onChange={value => handleInputChange('title', value)}
                onDateDetected={handleDateDetected}
                onPriorityDetected={handlePriorityDetected}
                onSubmit={() => {
                  // Create a minimal synthetic event for handleSubmit
                  const syntheticEvent = {
                    preventDefault: () => {},
                  } as React.FormEvent<HTMLFormElement>
                  handleSubmit(syntheticEvent)
                }}
                placeholder='Enter task summary...'
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className='text-sm text-red-500'>{errors.title}</p>
              )}
            </div>

            {/* All Other Fields */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Assignee */}
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <User className='h-4 w-4 text-muted-foreground' />
                  <Select
                    value={formData.assigneeId}
                    onValueChange={value =>
                      handleInputChange('assigneeId', value)
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      className={errors.assigneeId ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder='Select assignee' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='unassigned'>Unassigned</SelectItem>
                      {people.map(person => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {errors.assigneeId && (
                  <p className='text-sm text-red-500'>{errors.assigneeId}</p>
                )}
              </div>

              {/* Priority */}
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <Flag className='h-4 w-4 text-muted-foreground' />
                  <Select
                    value={formData.priority?.toString() || '3'}
                    onValueChange={value =>
                      handleInputChange('priority', parseInt(value))
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      className={errors.priority ? 'border-red-500' : ''}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {taskPriorityUtils.getSelectOptions().map(option => (
                        <SelectItem
                          key={option.value}
                          value={option.value.toString()}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {errors.priority && (
                  <p className='text-sm text-red-500'>{errors.priority}</p>
                )}
              </div>

              {/* Status */}
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <CheckCircle className='h-4 w-4 text-muted-foreground' />
                  <Select
                    value={formData.status}
                    onValueChange={value => handleInputChange('status', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      className={errors.status ? 'border-red-500' : ''}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {taskStatusUtils.getSelectOptions().map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {errors.status && (
                  <p className='text-sm text-red-500'>{errors.status}</p>
                )}
              </div>

              {/* Due Date */}
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4 text-muted-foreground' />
                  <DateTimePickerWithNaturalInput
                    value={formData.dueDate}
                    onChange={handleDateChange}
                    placeholder="e.g., 'tomorrow', 'next Monday'"
                    disabled={isSubmitting}
                    error={!!errors.dueDate}
                    dateOnly={false}
                    shortFormat={true}
                  />
                </div>
                {errors.dueDate && (
                  <p className='text-sm text-red-500'>{errors.dueDate}</p>
                )}
              </div>
            </div>
          </div>

          <div className='flex items-center justify-between pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={handleOpenFullEditor}
              className='flex items-center gap-2'
            >
              <ExternalLink className='h-4 w-4' />
              Full Editor
            </Button>

            <div className='flex items-center gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
