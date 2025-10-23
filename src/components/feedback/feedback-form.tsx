'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { createFeedback, updateFeedback } from '@/lib/actions/feedback'
import { type FeedbackFormData } from '@/lib/validations'
import { type Person } from '@prisma/client'
import { MarkdownEditor } from '@/components/markdown-editor'

interface FeedbackFormProps {
  person: Person
  feedback?: {
    id: string
    kind: 'praise' | 'concern' | 'note'
    isPrivate: boolean
    body: string
  }
  redirectTo?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function FeedbackForm({
  person,
  feedback,
  redirectTo,
  onSuccess,
  onCancel,
}: FeedbackFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<FeedbackFormData>({
    aboutId: person.id,
    kind: feedback?.kind || 'note',
    isPrivate: feedback?.isPrivate ?? true,
    body: feedback?.body || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (feedback) {
        await updateFeedback(feedback.id, formData)
      } else {
        await createFeedback(formData)
      }

      // Handle redirect or callback
      if (redirectTo) {
        router.push(redirectTo)
      } else {
        onSuccess?.()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (
    field: keyof FeedbackFormData,
    value: string | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {error && (
        <div className='bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm'>
          {error}
        </div>
      )}

      <div>
        <label htmlFor='kind' className='block text-sm font-medium mb-2'>
          Feedback Type
        </label>
        <select
          id='kind'
          value={formData.kind}
          onChange={e => handleChange('kind', e.target.value)}
          className='input'
        >
          <option value='note'>General Note</option>
          <option value='praise'>Praise</option>
          <option value='concern'>Concern</option>
        </select>
      </div>

      <div>
        <label className='flex items-center space-x-2'>
          <input
            type='checkbox'
            checked={formData.isPrivate}
            onChange={e => handleChange('isPrivate', e.target.checked)}
            className='rounded border-input bg-background text-primary focus:ring-ring'
          />
          <span className='text-sm font-medium'>Private feedback</span>
        </label>
        <p className='text-xs text-muted-foreground mt-1'>
          Private feedback is only visible to you. Public feedback is visible to
          everyone.
        </p>
      </div>

      <div>
        <label htmlFor='body' className='block text-sm font-medium mb-2'>
          Feedback Content
        </label>
        <MarkdownEditor
          value={formData.body}
          onChange={value => handleChange('body', value)}
          placeholder='Share your feedback... Use Markdown for formatting!'
        />
      </div>

      <div className='flex gap-2 pt-4'>
        <Button type='submit' disabled={isSubmitting || !formData.body.trim()}>
          {isSubmitting
            ? 'Saving...'
            : feedback
              ? 'Update Feedback'
              : 'Add Feedback'}
        </Button>
        {onCancel && (
          <Button type='button' onClick={onCancel} variant='outline'>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
