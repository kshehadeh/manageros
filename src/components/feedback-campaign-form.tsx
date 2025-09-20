'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import {
  createFeedbackCampaign,
  updateFeedbackCampaign,
  getFeedbackTemplates,
} from '@/lib/actions'
import { type FeedbackCampaignFormData } from '@/lib/validations'
import { type Person } from '@prisma/client'
import { X, Plus } from 'lucide-react'

interface FeedbackTemplate {
  id: string
  name: string
  description?: string
  isDefault: boolean
  questions: {
    id: string
    question: string
    type: string
    required: boolean
    sortOrder: number
  }[]
}

interface FeedbackCampaignFormProps {
  person: Person
  campaign?: {
    id: string
    targetPersonId: string
    templateId?: string
    startDate: string
    endDate: string
    inviteEmails: string[]
  }
  redirectTo?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function FeedbackCampaignForm({
  person,
  campaign,
  redirectTo,
  onSuccess,
  onCancel,
}: FeedbackCampaignFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<FeedbackCampaignFormData>({
    targetPersonId: person.id,
    templateId: campaign?.templateId || '',
    startDate: campaign?.startDate || '',
    endDate: campaign?.endDate || '',
    inviteEmails: campaign?.inviteEmails || [''],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<FeedbackTemplate[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)

  // Load templates on component mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const fetchedTemplates = await getFeedbackTemplates()
        setTemplates(fetchedTemplates as FeedbackTemplate[])

        // Set default template if no template is selected
        if (!formData.templateId && fetchedTemplates.length > 0) {
          const defaultTemplate =
            fetchedTemplates.find(t => t.isDefault) || fetchedTemplates[0]
          setFormData(prev => ({ ...prev, templateId: defaultTemplate.id }))
        }
      } catch (err) {
        console.error('Failed to load templates:', err)
        setError('Failed to load feedback templates')
      } finally {
        setIsLoadingTemplates(false)
      }
    }

    loadTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Filter out empty emails
      const validEmails = formData.inviteEmails.filter(
        email => email.trim() !== ''
      )

      if (validEmails.length === 0) {
        throw new Error('At least one email address is required')
      }

      const submitData = {
        ...formData,
        inviteEmails: validEmails,
      }

      if (campaign) {
        await updateFeedbackCampaign(campaign.id, submitData)
      } else {
        await createFeedbackCampaign(submitData)
      }

      if (onSuccess) {
        onSuccess()
      } else if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.push(`/people/${person.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addEmailField = () => {
    setFormData(prev => ({
      ...prev,
      inviteEmails: [...prev.inviteEmails, ''],
    }))
  }

  const removeEmailField = (index: number) => {
    if (formData.inviteEmails.length > 1) {
      setFormData(prev => ({
        ...prev,
        inviteEmails: prev.inviteEmails.filter((_, i) => i !== index),
      }))
    }
  }

  const updateEmail = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      inviteEmails: prev.inviteEmails.map((email, i) =>
        i === index ? value : email
      ),
    }))
  }

  return (
    <div className='w-full max-w-2xl mx-auto'>
      <div className='mb-6'>
        <h2 className='text-2xl font-bold text-white mb-2'>
          {campaign ? 'Edit Feedback Campaign' : 'Create Feedback Campaign'}
        </h2>
        <p className='text-gray-400'>
          Create a feedback campaign for {person.name}. External stakeholders
          will be invited to provide feedback.
        </p>
      </div>
      <form onSubmit={handleSubmit} className='space-y-6'>
        {error && (
          <div className='p-3 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-md'>
            {error}
          </div>
        )}

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label className='text-white'>Feedback Template</Label>
            {isLoadingTemplates ? (
              <div className='text-gray-400'>Loading templates...</div>
            ) : (
              <Select
                value={formData.templateId}
                onValueChange={value =>
                  setFormData(prev => ({ ...prev, templateId: value }))
                }
              >
                <SelectTrigger className='bg-neutral-800 border-neutral-700 text-white'>
                  <SelectValue placeholder='Select a template' />
                </SelectTrigger>
                <SelectContent className='bg-neutral-800 border-neutral-700'>
                  {templates.map(template => (
                    <SelectItem
                      key={template.id}
                      value={template.id}
                      className='text-white hover:bg-neutral-700'
                    >
                      {template.name}
                      {template.isDefault && ' (Default)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {formData.templateId && (
              <div className='text-sm text-gray-400'>
                {templates.find(t => t.id === formData.templateId)?.description}
              </div>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='startDate' className='text-white'>
                Start Date
              </Label>
              <Input
                id='startDate'
                type='date'
                value={formData.startDate}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className='bg-neutral-800 border-neutral-700 text-white'
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='endDate' className='text-white'>
                End Date
              </Label>
              <Input
                id='endDate'
                type='date'
                value={formData.endDate}
                onChange={e =>
                  setFormData(prev => ({ ...prev, endDate: e.target.value }))
                }
                className='bg-neutral-800 border-neutral-700 text-white'
                required
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label className='text-white'>Invite Emails</Label>
            <div className='space-y-2'>
              {formData.inviteEmails.map((email, index) => (
                <div key={index} className='flex gap-2'>
                  <Input
                    type='email'
                    value={email}
                    onChange={e => updateEmail(index, e.target.value)}
                    placeholder='Enter email address'
                    className='bg-neutral-800 border-neutral-700 text-white'
                    required={index === 0}
                  />
                  {formData.inviteEmails.length > 1 && (
                    <Button
                      type='button'
                      variant='outline'
                      size='icon'
                      onClick={() => removeEmailField(index)}
                      className='shrink-0 border-neutral-700 hover:bg-neutral-700'
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type='button'
                variant='outline'
                onClick={addEmailField}
                className='w-full border-neutral-700 hover:bg-neutral-700'
              >
                <Plus className='h-4 w-4 mr-2' />
                Add Another Email
              </Button>
            </div>
          </div>
        </div>

        <div className='flex gap-3 pt-4'>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting
              ? 'Saving...'
              : campaign
                ? 'Update Campaign'
                : 'Create Campaign'}
          </Button>
          {onCancel && (
            <Button
              type='button'
              variant='outline'
              onClick={onCancel}
              className='border-neutral-700 hover:bg-neutral-700'
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
