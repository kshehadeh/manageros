'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createQuickTask } from '@/lib/actions'

export function QuickTaskForm() {
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) return

    setIsSubmitting(true)

    try {
      await createQuickTask(title.trim())
      setTitle('') // Clear the form after successful submission
    } catch (error) {
      console.error('Error creating quick task:', error)
      // You could add a toast notification here if you have one
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex gap-2'>
      <Input
        type='text'
        placeholder='Add a new task...'
        value={title}
        onChange={e => setTitle(e.target.value)}
        className='flex-1'
        disabled={isSubmitting}
      />
      <Button
        type='submit'
        disabled={isSubmitting || !title.trim()}
        variant='outline'
      >
        {isSubmitting ? 'Adding...' : 'Add'}
      </Button>
    </form>
  )
}
