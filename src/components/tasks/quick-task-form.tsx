'use client'

import { useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { Button } from '@/components/ui/button'
import {
  SlateTaskTextarea,
  type SlateTaskTextareaRef,
} from '@/components/tasks/slate-task-textarea'
import {
  SlateTaskTextareaProvider,
  useSlateTaskTextarea,
} from '@/components/tasks/slate-task-textarea-provider'
import {
  createQuickTask,
  createQuickTaskForInitiative,
} from '@/lib/actions/task'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

interface QuickTaskFormProps {
  onSuccess?: () => void
  initiativeId?: string
}

export interface QuickTaskFormRef {
  focus: () => void
}

const QuickTaskFormContent = forwardRef<QuickTaskFormRef, QuickTaskFormProps>(
  ({ onSuccess, initiativeId }, ref) => {
    const { getCleanedText, detectedDate, detectedPriority } =
      useSlateTaskTextarea()
    const [title, setTitle] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const textareaRef = useRef<SlateTaskTextareaRef>(null)

    // Expose focus method to parent component
    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus()
      },
    }))

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault()

      if (!title.trim()) return

      setIsSubmitting(true)

      try {
        // Get cleaned text from provider (with detected dates/priorities removed)
        const taskTitle = getCleanedText() || title.trim()
        let taskDueDate: string | undefined = undefined
        let taskPriority: number | undefined = undefined

        if (detectedDate) {
          // Use the detected date
          taskDueDate = detectedDate.date
        }

        if (detectedPriority) {
          // Use the detected priority
          taskPriority = detectedPriority.priority
        }

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

        // Show success toast
        toast.success('Task created successfully!', {
          description: `"${taskTitle}" has been added to your tasks.`,
        })

        // Dispatch custom event to notify task lists to refresh
        window.dispatchEvent(new CustomEvent('task:created'))

        // Clear the form after successful submission
        setTitle('')

        // Close the modal
        onSuccess?.()
      } catch (error) {
        console.error('Error creating quick task:', error)
        toast.error('Failed to create task', {
          description:
            'Please try again or contact support if the issue persists.',
        })
      } finally {
        setIsSubmitting(false)
      }
    }

    return (
      <form onSubmit={handleSubmit} className='space-y-3'>
        <SlateTaskTextarea
          ref={textareaRef}
          value={title}
          onChange={setTitle}
          onSubmit={() => {
            // Create a minimal synthetic event for handleSubmit
            const syntheticEvent = {
              preventDefault: () => {},
            } as React.FormEvent<HTMLFormElement>
            handleSubmit(syntheticEvent)
          }}
          placeholder='Add a new task...'
          disabled={isSubmitting}
        />
        <div className='flex justify-end'>
          <Button
            type='submit'
            disabled={isSubmitting || !title.trim()}
            variant='outline'
          >
            <Plus className='h-4 w-4 mr-2' />
            Create Task
          </Button>
        </div>
      </form>
    )
  }
)

QuickTaskFormContent.displayName = 'QuickTaskFormContent'

const QuickTaskForm = forwardRef<QuickTaskFormRef, QuickTaskFormProps>(
  (props, ref) => {
    return (
      <SlateTaskTextareaProvider>
        <QuickTaskFormContent {...props} ref={ref} />
      </SlateTaskTextareaProvider>
    )
  }
)

QuickTaskForm.displayName = 'QuickTaskForm'

export { QuickTaskForm }
