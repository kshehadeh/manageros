'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EnhancedTaskTextarea } from '@/components/tasks/enhanced-task-textarea'
import { createQuickTask } from '@/lib/actions'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

interface QuickTaskFormProps {
  onSuccess?: () => void
}

export function QuickTaskForm({ onSuccess }: QuickTaskFormProps) {
  const [title, setTitle] = useState('')
  const [detectedDate, setDetectedDate] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) return

    setIsSubmitting(true)

    try {
      // Create task with detected date if available
      const taskData = {
        title: title.trim(),
        dueDate: detectedDate || undefined,
      }

      await createQuickTask(taskData.title, taskData.dueDate)

      // Show success toast
      toast.success('Task created successfully!', {
        description: `"${taskData.title}" has been added to your tasks.`,
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
          <EnhancedTaskTextarea
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
