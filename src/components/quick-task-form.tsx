'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EnhancedTaskInput } from '@/components/enhanced-task-input'
import { createQuickTask } from '@/lib/actions'
import { Plus } from 'lucide-react'

export function QuickTaskForm() {
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
      setTitle('') // Clear the form after successful submission
      setDetectedDate(null) // Clear detected date
    } catch (error) {
      console.error('Error creating quick task:', error)
      // You could add a toast notification here if you have one
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex gap-2'>
      <EnhancedTaskInput
        value={title}
        onChange={setTitle}
        onDateDetected={setDetectedDate}
        placeholder='Add a new task...'
        className='flex-1'
        disabled={isSubmitting}
        showDatePreview={false}
        showInlineDate={true}
      />
      <Button
        type='submit'
        disabled={isSubmitting || !title.trim()}
        variant='outline'
        size='icon'
        className='shrink-0'
      >
        <Plus className='h-4 w-4' />
      </Button>
    </form>
  )
}
