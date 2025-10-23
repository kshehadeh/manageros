'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateTimePickerWithNaturalInput } from '@/components/ui/datetime-picker-with-natural-input'
import { MarkdownEditor } from '@/components/markdown-editor'
import { updateTaskQuickEdit } from '@/lib/actions/task'
import { type TaskStatus } from '@/lib/task-status'
import { taskPriorityUtils } from '@/lib/task-priority'
import { AlertCircle, ExternalLink } from 'lucide-react'
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
      description: string | null
      assigneeId: string | null
      assigneeName: string | null
      dueDate: Date | string | null
      priority: number
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
    description: task.description || '',
    assigneeId: task.assigneeId || 'unassigned',
    dueDate: task.dueDate
      ? typeof task.dueDate === 'string'
        ? task.dueDate
        : task.dueDate.toISOString()
      : '',
    priority: task.priority,
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      // Prepare the update data
      const updateData = {
        title: formData.title,
        description: formData.description || undefined,
        assigneeId:
          formData.assigneeId === 'unassigned' ? null : formData.assigneeId,
        dueDate: formData.dueDate || null,
        priority: formData.priority,
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
        description: formData.description || null,
        assigneeId:
          formData.assigneeId === 'unassigned' ? null : formData.assigneeId,
        assigneeName,
        dueDate: formData.dueDate || null,
        priority: formData.priority,
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
      <DialogContent className='sm:max-w-[800px]'>
        <DialogHeader>
          <DialogTitle>Quick Edit Task</DialogTitle>
          <DialogDescription>
            Make quick changes to this task. Use Markdown for rich text
            formatting. Use the full editor for more options.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {errors.general && (
            <div className='flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md'>
              <AlertCircle className='h-4 w-4' />
              <span>{errors.general}</span>
            </div>
          )}

          <div className='flex flex-col lg:flex-row gap-6'>
            {/* Main Content - Summary and Description */}
            <div className='flex-1 space-y-4'>
              <div className='space-y-2'>
                <label htmlFor='title' className='text-sm font-medium'>
                  Summary *
                </label>
                <Input
                  id='title'
                  value={formData.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                  placeholder='Enter task summary'
                  className={errors.title ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                  required
                />
                {errors.title && (
                  <p className='text-sm text-red-500'>{errors.title}</p>
                )}
              </div>

              <div className='space-y-2'>
                <label htmlFor='description' className='text-sm font-medium'>
                  Description
                </label>
                <MarkdownEditor
                  value={formData.description}
                  onChange={value => handleInputChange('description', value)}
                  placeholder='Enter task description... Use Markdown for formatting!'
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className='text-sm text-red-500'>{errors.description}</p>
                )}
              </div>
            </div>

            {/* Right Sidebar - Assignee, Priority, Due Date */}
            <div className='w-full lg:w-80 space-y-4'>
              <div className='space-y-2'>
                <label htmlFor='assigneeId' className='text-sm font-medium'>
                  Assignee
                </label>
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
                {errors.assigneeId && (
                  <p className='text-sm text-red-500'>{errors.assigneeId}</p>
                )}
              </div>

              <div className='space-y-2'>
                <label htmlFor='priority' className='text-sm font-medium'>
                  Priority
                </label>
                <Select
                  value={formData.priority.toString()}
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
                {errors.priority && (
                  <p className='text-sm text-red-500'>{errors.priority}</p>
                )}
              </div>

              <div className='space-y-2'>
                <DateTimePickerWithNaturalInput
                  label='Due Date & Time'
                  value={formData.dueDate}
                  onChange={handleDateChange}
                  placeholder="e.g., 'tomorrow at 2pm', 'next Monday', 'in 3 days'"
                  disabled={isSubmitting}
                  error={!!errors.dueDate}
                  dateOnly={false}
                  shortFormat={true}
                />
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
