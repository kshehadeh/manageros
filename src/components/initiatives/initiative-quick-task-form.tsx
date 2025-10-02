'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EnhancedTaskInput } from '@/components/tasks/enhanced-task-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createQuickTaskForInitiative } from '@/lib/actions'
import { Objective } from '@prisma/client'
import { Plus } from 'lucide-react'

interface InitiativeQuickTaskFormProps {
  initiativeId: string
  objectives: Objective[]
}

export function InitiativeQuickTaskForm({
  initiativeId,
  objectives,
}: InitiativeQuickTaskFormProps) {
  const [title, setTitle] = useState('')
  const [detectedDate, setDetectedDate] = useState<string | null>(null)
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string>('none')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) return

    setIsSubmitting(true)

    try {
      await createQuickTaskForInitiative(
        title.trim(),
        initiativeId,
        selectedObjectiveId === 'none' ? undefined : selectedObjectiveId,
        detectedDate || undefined
      )
      setTitle('') // Clear the form after successful submission
      setDetectedDate(null) // Clear detected date
      setSelectedObjectiveId('none') // Clear objective selection
    } catch (error) {
      console.error('Error creating quick task:', error)
      // You could add a toast notification here if you have one
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-3'>
      <div className='flex gap-2'>
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
      </div>
      {objectives.length > 0 && (
        <Select
          value={selectedObjectiveId}
          onValueChange={setSelectedObjectiveId}
          disabled={isSubmitting}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Objective (optional)' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='none'>No objective</SelectItem>
            {objectives.map(objective => (
              <SelectItem key={objective.id} value={objective.id}>
                {objective.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </form>
  )
}
