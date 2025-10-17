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
import {
  AlertCircle,
  Plus,
  X,
  Calendar,
  StickyNote,
  Users,
  CheckCircle2,
  Copy,
} from 'lucide-react'
import { MarkdownEditor } from '@/components/markdown-editor'
import { PersonSelect } from '@/components/ui/person-select'
import { SectionHeader } from '@/components/ui/section-header'

interface MeetingInstanceFormProps {
  meetingId: string
  initialData?: Partial<MeetingInstanceFormData>
  isEditing?: boolean
  instanceId?: string
  onSuccess?: () => void
  parentMeetingParticipants?: Array<{
    id: string
    personId: string
    status: string
    person: {
      id: string
      name: string
      avatar?: string | null
    }
  }>
}

export function MeetingInstanceForm({
  meetingId,
  initialData,
  isEditing = false,
  instanceId,
  onSuccess,
  parentMeetingParticipants,
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

  const toggleAllAttendance = () => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.map(p => ({
        ...p,
        status: p.status === 'invited' ? 'attended' : 'invited',
      })),
    }))
  }

  const inheritParentParticipants = () => {
    if (!parentMeetingParticipants) return

    setFormData(prev => {
      const existingPersonIds = new Set(prev.participants.map(p => p.personId))
      const newParticipants = parentMeetingParticipants
        .filter(p => !existingPersonIds.has(p.personId))
        .map(p => ({
          personId: p.personId,
          status: 'invited' as const,
        }))

      return {
        ...prev,
        participants: [...prev.participants, ...newParticipants],
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {errors.general && (
        <div className='bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm flex items-center gap-2'>
          <AlertCircle className='h-4 w-4' />
          {errors.general}
        </div>
      )}

      <div className='flex flex-col gap-6'>
        {/* Schedule */}
        <div className='space-y-4'>
          <SectionHeader icon={Calendar} title='Schedule' />
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='scheduledAt'>
                Date & Time <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='scheduledAt'
                type='datetime-local'
                value={formData.scheduledAt}
                onChange={e => handleInputChange('scheduledAt', e.target.value)}
                className={errors.scheduledAt ? 'border-destructive' : ''}
              />
              {errors.scheduledAt && (
                <p className='text-sm text-destructive'>{errors.scheduledAt}</p>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className='space-y-4'>
          <SectionHeader icon={StickyNote} title='Notes' />
          <div className='space-y-4'>
            <MarkdownEditor
              value={formData.notes || ''}
              onChange={value => handleInputChange('notes', value)}
              placeholder='Meeting notes and outcomes... Use Markdown for formatting!'
            />
          </div>
        </div>

        {/* Participants */}
        <div className='space-y-4'>
          <SectionHeader
            icon={Users}
            title='Participants'
            action={
              <div className='flex items-center gap-2'>
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
                {parentMeetingParticipants &&
                  parentMeetingParticipants.length > 0 && (
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={inheritParentParticipants}
                      className='flex items-center gap-2'
                    >
                      <Copy className='h-4 w-4' />
                      Inherit from Parent
                    </Button>
                  )}
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={toggleAllAttendance}
                  className='flex items-center gap-2'
                >
                  <CheckCircle2 className='h-4 w-4' />
                  {formData.participants.every(p => p.status === 'attended')
                    ? 'Mark All Invited'
                    : 'Mark All Attended'}
                </Button>
              </div>
            }
          />

          <div className='space-y-2'>
            {formData.participants.map((participant, index) => (
              <div key={index} className='flex items-center gap-2'>
                <div className='flex-1'>
                  <PersonSelect
                    value={participant.personId}
                    onValueChange={value =>
                      updateParticipant(index, 'personId', value)
                    }
                    placeholder='Select participant'
                    showAvatar={true}
                    showRole={true}
                  />
                </div>

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

      <div className='flex justify-end gap-3 pt-4'>
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
