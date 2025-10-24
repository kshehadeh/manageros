'use client'

import { useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { Button } from '@/components/ui/button'
import {
  SlateTaskTextarea,
  type SlateTaskTextareaRef,
} from '@/components/tasks/slate-task-textarea'
import {
  createQuickTask,
  createQuickTaskForInitiative,
} from '@/lib/actions/task'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { type DetectedDate } from '@/lib/utils/date-detection'
import { type DetectedPriority } from '@/lib/utils/priority-detection'

interface QuickTaskFormProps {
  onSuccess?: () => void
  initiativeId?: string
}

export interface QuickTaskFormRef {
  focus: () => void
}

const QuickTaskForm = forwardRef<QuickTaskFormRef, QuickTaskFormProps>(
  ({ onSuccess, initiativeId }, ref) => {
    const [title, setTitle] = useState('')
    const [detectedDate, setDetectedDate] = useState<DetectedDate | null>(null)
    const [detectedPriority, setDetectedPriority] =
      useState<DetectedPriority | null>(null)
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
        // Create task with detected date and priority if available
        let taskTitle = title.trim()
        let taskDueDate: string | undefined = undefined
        let taskPriority: number | undefined = undefined

        if (detectedDate) {
          // Use the detected date
          taskDueDate = detectedDate.date

          // Optionally remove the detected date text from the title
          // This gives the parent component control over whether to clean the title
          if (detectedDate.originalText) {
            taskTitle = taskTitle.replace(detectedDate.originalText, '').trim()
          }
        }

        if (detectedPriority) {
          // Use the detected priority
          taskPriority = detectedPriority.priority

          // Optionally remove the detected priority text from the title
          if (detectedPriority.originalText) {
            taskTitle = taskTitle
              .replace(detectedPriority.originalText, '')
              .trim()
          }
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
        setDetectedDate(null)

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
          onDateDetected={setDetectedDate}
          onPriorityDetected={setDetectedPriority}
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

QuickTaskForm.displayName = 'QuickTaskForm'

export { QuickTaskForm }
