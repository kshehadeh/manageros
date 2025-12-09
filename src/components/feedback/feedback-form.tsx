'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { createFeedback, updateFeedback } from '@/lib/actions/feedback'
import { type FeedbackFormData } from '@/lib/validations'
import { type Person } from '@/generated/prisma'
import { NotionEditor } from '@/components/notes/notion-editor'
import { MessageSquare, Edit } from 'lucide-react'
import {
  FormTemplate,
  type FormSection,
  type FormHeader,
} from '@/components/ui/form-template'

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
  header?: FormHeader
}

export function FeedbackForm({
  person,
  feedback,
  redirectTo,
  onSuccess,
  onCancel,
  header: externalHeader,
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
      content: (
        <>
          <div className='space-y-2'>
            <Label htmlFor='kind'>Feedback Type</Label>
            <Select
              value={formData.kind}
              onValueChange={value => handleChange('kind', value)}
            >
              <SelectTrigger id='kind'>
                <SelectValue placeholder='Select feedback type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='note'>General Note</SelectItem>
                <SelectItem value='praise'>Praise</SelectItem>
                <SelectItem value='concern'>Concern</SelectItem>
              </SelectContent>
            </Select>
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
            <NotionEditor
              value={formData.body}
              onChange={value => handleChange('body', value)}
              placeholder='Share your feedback... Use Markdown for formatting!'
              showToolbarAlways={true}
            />
          </div>
        </>
      ),
    },
  ]

  const formHeader = externalHeader
    ? {
        ...externalHeader,
        icon: externalHeader.icon || (feedback ? Edit : MessageSquare),
      }
    : undefined

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
        header={formHeader}
      />
    </div>
  )
}
