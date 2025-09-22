'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createQuickTaskForInitiative } from '@/lib/actions'
import { Objective } from '@prisma/client'

interface InitiativeQuickTaskFormProps {
  initiativeId: string
  objectives: Objective[]
}

export function InitiativeQuickTaskForm({
  initiativeId,
  objectives,
}: InitiativeQuickTaskFormProps) {
  const [title, setTitle] = useState('')
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
        selectedObjectiveId === 'none' ? undefined : selectedObjectiveId
      )
      setTitle('') // Clear the form after successful submission
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
        <Input
          type='text'
          placeholder='Add a new task...'
          value={title}
          onChange={e => setTitle(e.target.value)}
          className='flex-1'
          disabled={isSubmitting}
        />
        {objectives.length > 0 && (
          <Select
            value={selectedObjectiveId}
            onValueChange={setSelectedObjectiveId}
            disabled={isSubmitting}
          >
            <SelectTrigger className='w-48'>
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
        <Button
          type='submit'
          disabled={isSubmitting || !title.trim()}
          variant='outline'
        >
          {isSubmitting ? 'Adding...' : 'Add'}
        </Button>
      </div>
    </form>
  )
}
