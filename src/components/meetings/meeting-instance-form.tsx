'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import {
  createMeetingInstance,
  updateMeetingInstance,
} from '@/lib/actions/meeting-instance'
import {
  type MeetingInstanceFormData,
  meetingInstanceSchema,
} from '@/lib/validations'
import { Person } from '@prisma/client'
import { AlertCircle, Plus, X } from 'lucide-react'
import { MarkdownEditor } from '@/components/markdown-editor'

interface MeetingInstanceFormProps {
  meetingId: string
  people: Person[]
  initialData?: Partial<MeetingInstanceFormData>
  isEditing?: boolean
  instanceId?: string
  onSuccess?: () => void
}

export function MeetingInstanceForm({
  meetingId,
  people,
  initialData,
  isEditing = false,
  instanceId,
  onSuccess,
}: MeetingInstanceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  // Form state to prevent clearing on errors
  const [formData, setFormData] = useState<MeetingInstanceFormData>({
    meetingId,
    scheduledAt: initialData?.scheduledAt || '',
    notes: initialData?.notes || '',
    participants: initialData?.participants || [],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      // Validate the form data
      const validatedData = meetingInstanceSchema.parse(formData)

      if (isEditing && instanceId) {
        await updateMeetingInstance(instanceId, validatedData)
        // Redirect to the meeting instance detail page
        router.push(`/meetings/${meetingId}/instances/${instanceId}`)
      } else {
        await createMeetingInstance(validatedData)
        // Call success callback if provided (for dialog forms)
        if (onSuccess) {
          onSuccess()
        }
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

  const handleInputChange = (
    field: keyof MeetingInstanceFormData,
    value: string | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addParticipant = () => {
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, { personId: '', status: 'invited' }],
    }))
  }

  const removeParticipant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index),
    }))
  }

  const updateParticipant = (
    index: number,
    field: 'personId' | 'status',
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      ),
    }))
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {errors.general && (
        <div className='flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md'>
          <AlertCircle className='h-4 w-4' />
          <span className='text-sm'>{errors.general}</span>
        </div>
      )}

      <div className='space-y-4'>
        <div>
          <Label htmlFor='scheduledAt'>Date & Time *</Label>
          <Input
            id='scheduledAt'
            type='datetime-local'
            value={formData.scheduledAt}
            onChange={e => handleInputChange('scheduledAt', e.target.value)}
            className={errors.scheduledAt ? 'border-red-500' : ''}
          />
          {errors.scheduledAt && (
            <p className='text-red-500 text-sm mt-1'>{errors.scheduledAt}</p>
          )}
        </div>

        <div>
          <Label htmlFor='notes'>Notes</Label>
          <MarkdownEditor
            value={formData.notes || ''}
            onChange={value => handleInputChange('notes', value)}
            placeholder='Meeting notes and outcomes... Use Markdown for formatting!'
          />
        </div>

        <div>
          <div className='flex items-center justify-between mb-2'>
            <Label>Participants</Label>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={addParticipant}
              className='flex items-center gap-2'
            >
              <Plus className='h-4 w-4' />
              Add Participant
            </Button>
          </div>

          <div className='space-y-2'>
            {formData.participants.map((participant, index) => (
              <div key={index} className='flex items-center gap-2'>
                <Select
                  value={participant.personId}
                  onValueChange={value =>
                    updateParticipant(index, 'personId', value)
                  }
                >
                  <SelectTrigger className='flex-1'>
                    <SelectValue placeholder='Select participant' />
                  </SelectTrigger>
                  <SelectContent>
                    {people.map(person => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={participant.status}
                  onValueChange={value =>
                    updateParticipant(index, 'status', value)
                  }
                >
                  <SelectTrigger className='w-32'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='invited'>Invited</SelectItem>
                    <SelectItem value='accepted'>Accepted</SelectItem>
                    <SelectItem value='declined'>Declined</SelectItem>
                    <SelectItem value='tentative'>Tentative</SelectItem>
                    <SelectItem value='attended'>Attended</SelectItem>
                    <SelectItem value='absent'>Absent</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => removeParticipant(index)}
                  className='px-2'
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='flex justify-end gap-3'>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving...'
            : isEditing
              ? 'Update Instance'
              : 'Create Instance'}
        </Button>
      </div>
    </form>
  )
}
