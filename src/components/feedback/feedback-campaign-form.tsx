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
} from '@/lib/actions/feedback-campaign'
import { getFeedbackTemplates } from '@/lib/actions/feedback-template'
import { type FeedbackCampaignFormData } from '@/lib/validations'
import { type Person } from '@prisma/client'
import { X, Plus, Calendar, Mail, FileText } from 'lucide-react'
import { DateTimePickerWithNaturalInput } from '@/components/ui/datetime-picker-with-natural-input'
import { FormTemplate, type FormSection } from '@/components/ui/form-template'

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
    name?: string
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
    name: campaign?.name || '',
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

  const sections: FormSection[] = [
    {
      title: 'Campaign Details',
      icon: FileText,
      content: (
        <>
          <div className='space-y-2'>
            <Label htmlFor='name'>Campaign Name (Optional)</Label>
            <Input
              id='name'
              type='text'
              placeholder='e.g., Performance Review 2026'
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
            />
            <p className='text-sm text-muted-foreground'>
              Give your campaign a descriptive name to help identify it later
            </p>
          </div>

          <div className='space-y-2'>
            <Label>Feedback Template</Label>
            {isLoadingTemplates ? (
              <div className='text-muted-foreground'>Loading templates...</div>
            ) : (
              <Select
                value={formData.templateId}
                onValueChange={value =>
                  setFormData(prev => ({ ...prev, templateId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select a template' />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                      {template.isDefault && ' (Default)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {formData.templateId && (
              <div className='text-sm text-muted-foreground'>
                {templates.find(t => t.id === formData.templateId)?.description}
              </div>
            )}
          </div>
        </>
      ),
    },
    {
      title: 'Timeline',
      icon: Calendar,
      content: (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <DateTimePickerWithNaturalInput
            label='Start Date'
            value={formData.startDate}
            onChange={value =>
              setFormData(prev => ({ ...prev, startDate: value }))
            }
            placeholder="e.g., 'tomorrow', 'next Monday'"
            error={false}
            dateOnly={true}
            required
          />

          <DateTimePickerWithNaturalInput
            label='End Date'
            value={formData.endDate}
            onChange={value =>
              setFormData(prev => ({ ...prev, endDate: value }))
            }
            placeholder="e.g., 'tomorrow', 'next Monday'"
            error={false}
            dateOnly={true}
            required
          />
        </div>
      ),
    },
    {
      title: 'Invitations',
      icon: Mail,
      content: (
        <div className='space-y-2'>
          <Label>Invite Emails</Label>
          <div className='space-y-2'>
            {formData.inviteEmails.map((email, index) => (
              <div key={index} className='flex gap-2'>
                <Input
                  type='email'
                  value={email}
                  onChange={e => updateEmail(index, e.target.value)}
                  placeholder='Enter email address'
                  required={index === 0}
                />
                {formData.inviteEmails.length > 1 && (
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={() => removeEmailField(index)}
                    className='shrink-0'
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
              className='w-full'
            >
              <Plus className='h-4 w-4 mr-2' />
              Add Another Email
            </Button>
          </div>
        </div>
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
          text: campaign ? 'Update Campaign' : 'Create Campaign',
          loadingText: 'Saving...',
        }}
        generalError={error || undefined}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
