'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useRouter } from 'next/navigation'
import { createFeedback, updateFeedback } from '@/lib/actions/feedback'
import { type FeedbackFormData } from '@/lib/validations'
import { type Person } from '@prisma/client'
import { MarkdownEditor } from '@/components/markdown-editor'
import { MessageSquare } from 'lucide-react'
import { FormTemplate, type FormSection } from '@/components/ui/form-template'

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

  const sections: FormSection[] = [
    {
      title: 'Feedback Information',
      icon: MessageSquare,
      content: (
        <>
          <div className='space-y-2'>
            <Label htmlFor='kind'>Feedback Type</Label>
            <select
              id='kind'
              value={formData.kind}
              onChange={e => handleChange('kind', e.target.value)}
              className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
            >
              <option value='note'>General Note</option>
              <option value='praise'>Praise</option>
              <option value='concern'>Concern</option>
            </select>
          </div>

          <div className='flex items-center space-x-2'>
            <Checkbox
              id='isPrivate'
              checked={formData.isPrivate}
              onCheckedChange={checked =>
                handleChange('isPrivate', checked as boolean)
              }
            />
            <Label
              htmlFor='isPrivate'
              className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
            >
              Private feedback
            </Label>
          </div>
          <p className='text-xs text-muted-foreground'>
            Private feedback is only visible to you. Public feedback is visible
            to everyone.
          </p>

          <div className='space-y-2'>
            <Label htmlFor='body'>Feedback Content</Label>
            <MarkdownEditor
              value={formData.body}
              onChange={value => handleChange('body', value)}
              placeholder='Share your feedback... Use Markdown for formatting!'
            />
          </div>
        </>
      ),
    },
  ]

  return (
    <div>
      {onCancel && (
        <div className='mb-4'>
          <Button type='button' onClick={onCancel} variant='outline'>
            Cancel
          </Button>
        </div>
      )}
      <FormTemplate
        sections={sections}
        onSubmit={handleSubmit}
        submitButton={{
          text: feedback ? 'Update Feedback' : 'Add Feedback',
          loadingText: 'Saving...',
          disabled: !formData.body.trim(),
        }}
        generalError={error || undefined}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
