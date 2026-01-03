'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createEntityLink, updateEntityLink } from '@/lib/actions/entity-links'

interface EntityLink {
  id: string
  url: string
  title: string | null
  description: string | null
  createdAt: Date
  updatedAt: Date
  createdBy: {
    id: string
    name: string
    email: string
  }
}

interface LinkFormProps {
  entityType: string
  entityId: string
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<EntityLink>
}

export function LinkForm({
  entityType,
  entityId,
  onSuccess,
  onCancel,
  initialData,
}: LinkFormProps) {
  const [formData, setFormData] = useState({
    url: initialData?.url || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      if (initialData?.id) {
        // Update existing link
        await updateEntityLink({
          id: initialData.id,
          ...formData,
        })
      } else {
        // Create new link
        await createEntityLink({
          ...formData,
          entityType,
          entityId,
        })
      }

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ general: error.message })
      } else if (error && typeof error === 'object' && 'issues' in error) {
        const fieldErrors: Record<string, string> = {}
        ;(
          error as { issues: Array<{ path: string[]; message: string }> }
        ).issues.forEach(issue => {
          fieldErrors[issue.path[0]] = issue.message
        })
        setErrors(fieldErrors)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-xl'>
      {errors.general && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-xl py-lg rounded-lg'>
          {errors.general}
        </div>
      )}

      <div>
        <Label htmlFor='url'>URL *</Label>
        <Input
          id='url'
          type='url'
          value={formData.url}
          onChange={e => handleInputChange('url', e.target.value)}
          placeholder='https://example.com'
          className={errors.url ? 'border-red-500' : ''}
          required
        />
        {errors.url && (
          <p className='text-red-600 text-sm mt-sm'>{errors.url}</p>
        )}
      </div>

      <div>
        <Label htmlFor='title'>Title</Label>
        <Input
          id='title'
          type='text'
          value={formData.title}
          onChange={e => handleInputChange('title', e.target.value)}
          placeholder='Optional title for the link'
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && (
          <p className='text-red-600 text-sm mt-1'>{errors.title}</p>
        )}
      </div>

      <div>
        <Label htmlFor='description'>Description</Label>
        <Textarea
          id='description'
          value={formData.description}
          onChange={e => handleInputChange('description', e.target.value)}
          placeholder='Optional description of what this link is for'
          className={errors.description ? 'border-red-500' : ''}
          rows={3}
        />
        {errors.description && (
          <p className='text-red-600 text-sm mt-1'>{errors.description}</p>
        )}
      </div>

      <div className='flex justify-end gap-md'>
        {onCancel && (
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type='submit' disabled={isSubmitting || !formData.url.trim()}>
          {isSubmitting
            ? 'Saving...'
            : initialData?.id
              ? 'Update Link'
              : 'Add Link'}
        </Button>
      </div>
    </form>
  )
}
