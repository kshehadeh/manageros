'use client'

import { useState } from 'react'
import { createFeedback, updateFeedback } from '@/lib/actions'
import { type FeedbackFormData } from '@/lib/validations'
import { type Person } from '@prisma/client'
import { MarkdownEditor } from './markdown-editor'

interface FeedbackFormProps {
  person: Person
  feedback?: {
    id: string
    kind: 'praise' | 'concern' | 'note'
    isPrivate: boolean
    body: string
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export function FeedbackForm({
  person,
  feedback,
  onSuccess,
  onCancel,
}: FeedbackFormProps) {
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
      onSuccess?.()
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
        <div className='bg-red-900/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm'>
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
          className='w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
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
            className='rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-blue-500'
          />
          <span className='text-sm font-medium'>Private feedback</span>
        </label>
        <p className='text-xs text-neutral-400 mt-1'>
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
          maxLength={2000}
        />
      </div>

      <div className='flex gap-2 pt-4'>
        <button
          type='submit'
          disabled={isSubmitting || !formData.body.trim()}
          className='btn bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isSubmitting
            ? 'Saving...'
            : feedback
              ? 'Update Feedback'
              : 'Add Feedback'}
        </button>
        {onCancel && (
          <button
            type='button'
            onClick={onCancel}
            className='btn bg-neutral-700 hover:bg-neutral-600'
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
