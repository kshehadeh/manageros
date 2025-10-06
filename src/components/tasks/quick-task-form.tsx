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
        // Create task with detected date if available
        let taskTitle = title.trim()
        let taskDueDate: string | undefined = undefined

        if (detectedDate) {
          // Use the detected date
          taskDueDate = detectedDate.date

          // Optionally remove the detected date text from the title
          // This gives the parent component control over whether to clean the title
          if (detectedDate.originalText) {
            taskTitle = taskTitle.replace(detectedDate.originalText, '').trim()
          }
        }

        if (initiativeId) {
          await createQuickTaskForInitiative(
            taskTitle,
            initiativeId,
            undefined,
            taskDueDate
          )
        } else {
          await createQuickTask(taskTitle, taskDueDate)
        }

        // Show success toast
        toast.success('Task created successfully!', {
          description: `"${taskTitle}" has been added to your tasks.`,
        })

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
        <div className='flex gap-2'>
          <div className='flex-1'>
            <SlateTaskTextarea
              ref={textareaRef}
              value={title}
              onChange={setTitle}
              onDateDetected={setDetectedDate}
              placeholder='Add a new task...'
              disabled={isSubmitting}
              rows={2}
            />
          </div>
          <Button
            type='submit'
            disabled={isSubmitting || !title.trim()}
            variant='outline'
            size='icon'
            className='shrink-0 self-start'
          >
            <Plus className='h-4 w-4' />
          </Button>
        </div>
      </form>
    )
  }
)

QuickTaskForm.displayName = 'QuickTaskForm'

export { QuickTaskForm }
