'use client'

import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/lib/hooks/use-media-query'
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
import {
  TaskSummaryInput,
  type TaskSummaryInputRef,
} from '@/components/tasks/task-summary-input'
import {
  TaskSummaryInputProvider,
  useTaskSummaryInput,
} from '@/components/tasks/task-summary-input-provider'
import {
  updateTaskQuickEdit,
  createQuickTask,
  createQuickTaskForInitiative,
} from '@/lib/actions/task'
import {
  type TaskStatus,
  taskStatusUtils,
  TASK_STATUS,
} from '@/lib/task-status'
import { taskPriorityUtils } from '@/lib/task-priority'
import {
  AlertCircle,
  ExternalLink,
  User,
  Calendar,
  Flag,
  CheckCircle,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { usePeopleForSelect } from '@/hooks/use-organization-cache'

interface TaskQuickEditDialogProps {
  open: boolean
  onOpenChange: (_open: boolean) => void
  task?: {
    id: string
    title: string
    description?: string | null
    assigneeId?: string | null
    dueDate?: Date | string | null
    priority: number
    status: TaskStatus
  }
  initiativeId?: string
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
  onSuccess?: () => void
}

export interface TaskQuickEditDialogRef {
  focus: () => void
  reset: () => void
}

const TaskQuickEditDialogContent = forwardRef<
  TaskQuickEditDialogRef,
  TaskQuickEditDialogProps
>(
  (
    {
      open,
      onOpenChange,
      task,
      initiativeId,
      onTaskUpdate,
      onSuccess,
    }: TaskQuickEditDialogProps,
    ref
  ) => {
    const {
      getCleanedText,
      detectedDate,
      detectedPriority,
      originalText,
      cleanedText,
      reset,
    } = useTaskSummaryInput()
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const { people } = usePeopleForSelect()
    const textareaRef = useRef<TaskSummaryInputRef>(null)

    const isCreateMode = !task

    // Expose focus and reset methods through ref
    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus()
      },
      reset,
    }))

    // Store original values to revert to when detection is cleared
    const originalDueDate = task?.dueDate
      ? typeof task.dueDate === 'string'
        ? task.dueDate
        : task.dueDate.toISOString()
      : ''
    const originalPriority = task?.priority || 3

    const [formData, setFormData] = useState({
      title: task?.title || '',
      assigneeId: task?.assigneeId || 'unassigned',
      dueDate: originalDueDate,
      priority: originalPriority,
      status: task?.status || TASK_STATUS.TODO,
    })

    // Reset textarea and form state when dialog opens in create mode
    useEffect(() => {
      if (open && isCreateMode) {
        reset()
        setFormData({
          title: '',
          assigneeId: 'unassigned',
          dueDate: '',
          priority: 3,
          status: TASK_STATUS.TODO,
        })
        setErrors({})
      }
    }, [open, isCreateMode, reset])

    // Focus textarea when dialog opens
    useEffect(() => {
      if (open) {
        // Small delay to ensure the dialog is fully rendered
        const timer = setTimeout(() => {
          textareaRef.current?.focus()
        }, 100)
        return () => clearTimeout(timer)
      }
    }, [open])

    // Sync detected values with form fields
    useEffect(() => {
      if (detectedDate) {
        setFormData(prev => ({ ...prev, dueDate: detectedDate.date }))
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
        // Get cleaned text from provider (with detected dates/priorities removed)
        const cleanedTitle = getCleanedText()

        if (isCreateMode) {
          // Create mode
          const taskTitle = cleanedTitle || formData.title
          const taskDueDate = formData.dueDate || undefined
          const taskPriority = formData.priority

          if (initiativeId) {
            await createQuickTaskForInitiative(
              taskTitle,
              initiativeId,
              undefined,
              taskDueDate,
              taskPriority
            )
          } else {
            await createQuickTask(taskTitle, taskDueDate, taskPriority)
          }

          toast.success('Task created successfully!', {
            description: `"${taskTitle}" has been added to your tasks.`,
          })

          // Dispatch custom event to notify task lists to refresh
          window.dispatchEvent(new CustomEvent('task:created'))

          // Call success callback
          onSuccess?.()
        } else {
          // Edit mode
          const updateData = {
            title: cleanedTitle || formData.title, // Fallback to original if cleaned is empty
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
        }

        onOpenChange(false)
      } catch (error) {
        console.error(
          `Error ${isCreateMode ? 'creating' : 'updating'} task:`,
          error
        )

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
              : `Error ${isCreateMode ? 'creating' : 'updating'} task. Please try again.`
          setErrors({ general: errorMessage })
        }
      } finally {
        setIsSubmitting(false)
      }
    }

    const isMobile = useIsMobile()

    const handleOpenFullEditor = () => {
      if (!task) return
      onOpenChange(false)
      router.push(`/tasks/${task.id}/edit`)
    }

    // Full screen on mobile, regular dialog on desktop
    const dialogContentClassName = isMobile
      ? 'p-0 h-[100vh] max-h-[100vh] flex flex-col overflow-y-auto rounded-none left-0 top-0 translate-x-0 translate-y-0'
      : ''

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={dialogContentClassName}>
          <DialogHeader className={isMobile ? 'px-6 pt-6 pb-0' : ''}>
            <DialogTitle>
              {isCreateMode ? 'Create Task' : 'Quick Edit Task'}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className={
              isMobile
                ? 'space-y-4 px-6 pb-6 flex-1 overflow-y-auto'
                : 'space-y-4'
            }
          >
            {errors.general && (
              <div className='flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md'>
                <AlertCircle className='h-4 w-4' />
                <span>{errors.general}</span>
              </div>
            )}

            <div className='space-y-4 mt-4 md:mt-0'>
              {/* Summary Field */}
              <div className='space-y-2'>
                <TaskSummaryInput
                  ref={textareaRef}
                  value={isCreateMode ? originalText : formData.title}
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
                  placeholder={
                    isCreateMode ? 'Add a new task...' : 'Enter task summary...'
                  }
                  className={errors.title ? 'border-red-500' : ''}
                  textSize={isCreateMode ? 'base' : 'lg'}
                  inputClassName={
                    isCreateMode ? 'font-medium' : 'font-semibold'
                  }
                />
                {errors.title && (
                  <p className='text-sm text-red-500'>{errors.title}</p>
                )}
              </div>

              {/* All Other Fields - Only show in edit mode or if user wants to expand */}
              {!isCreateMode && (
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
                      <p className='text-sm text-red-500'>
                        {errors.assigneeId}
                      </p>
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
                        onValueChange={value =>
                          handleInputChange('status', value)
                        }
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
              )}
            </div>

            <div className='flex items-center justify-between pt-4'>
              {!isCreateMode && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleOpenFullEditor}
                  className='flex items-center gap-2'
                >
                  <ExternalLink className='h-4 w-4' />
                  Full Editor
                </Button>
              )}

              <div
                className={`flex items-center gap-2 ${isCreateMode ? 'ml-auto' : ''}`}
              >
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={
                    isSubmitting || (isCreateMode && !cleanedText.trim())
                  }
                >
                  {isSubmitting ? (
                    isCreateMode ? (
                      'Creating...'
                    ) : (
                      'Saving...'
                    )
                  ) : isCreateMode ? (
                    <>
                      <Plus className='h-4 w-4 mr-2' />
                      Create Task
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    )
  }
)

TaskQuickEditDialogContent.displayName = 'TaskQuickEditDialogContent'

const TaskQuickEditDialogWithRef = forwardRef<
  TaskQuickEditDialogRef,
  TaskQuickEditDialogProps
>((props, ref) => {
  return (
    <TaskSummaryInputProvider>
      <TaskQuickEditDialogContent {...props} ref={ref} />
    </TaskSummaryInputProvider>
  )
})

TaskQuickEditDialogWithRef.displayName = 'TaskQuickEditDialog'

export const TaskQuickEditDialog = TaskQuickEditDialogWithRef
