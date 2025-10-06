'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createMeeting,
  updateMeeting,
} from '@/lib/actions/meeting'
import { type MeetingFormData, meetingSchema } from '@/lib/validations'
import { Person, Team, Initiative } from '@prisma/client'
import { AlertCircle, Plus, X } from 'lucide-react'
import { MarkdownEditor } from '@/components/markdown-editor'

interface MeetingFormProps {
  people: Person[]
  teams: Team[]
  initiatives: Initiative[]
  preselectedTeamId?: string
  preselectedInitiativeId?: string
  preselectedOwnerId?: string
  initialData?: Partial<MeetingFormData>
  isEditing?: boolean
  meetingId?: string
}

export function MeetingForm({
  people,
  teams,
  initiatives,
  preselectedTeamId,
  preselectedInitiativeId,
  preselectedOwnerId,
  initialData,
  isEditing = false,
  meetingId,
}: MeetingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  // Form state to prevent clearing on errors
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    scheduledAt: initialData?.scheduledAt || '',
    duration: initialData?.duration || 60,
    location: initialData?.location || '',
    notes: initialData?.notes || '',
    isRecurring: initialData?.isRecurring || false,
    recurrenceType:
      (initialData?.recurrenceType as MeetingFormData['recurrenceType']) ||
      'none',
    isPrivate:
      initialData?.isPrivate !== undefined ? initialData.isPrivate : true,
    teamId: preselectedTeamId || initialData?.teamId || 'none',
    initiativeId:
      preselectedInitiativeId || initialData?.initiativeId || 'none',
    ownerId: preselectedOwnerId || initialData?.ownerId || 'none',
    participants: initialData?.participants || [],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      // Convert 'none' values to undefined for validation
      const processedFormData = {
        ...formData,
        teamId: formData.teamId === 'none' ? undefined : formData.teamId,
        initiativeId:
          formData.initiativeId === 'none' ? undefined : formData.initiativeId,
        ownerId: formData.ownerId === 'none' ? undefined : formData.ownerId,
        recurrenceType:
          formData.recurrenceType === 'none'
            ? undefined
            : formData.recurrenceType,
      }

      // Validate the form data
      const validatedData = meetingSchema.parse(processedFormData)

      if (isEditing && meetingId) {
        await updateMeeting(meetingId, validatedData)
        // Redirect to the meeting detail page
        router.push(`/meetings/${meetingId}`)
      } else {
        const meeting = await createMeeting(validatedData)
        // Redirect to the new meeting detail page
        window.location.href = `/meetings/${meeting.id}`
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
    field: keyof MeetingFormData,
    value: string | boolean | number | undefined
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
          <Label htmlFor='title'>Meeting Title *</Label>
          <Input
            id='title'
            value={formData.title}
            onChange={e => handleInputChange('title', e.target.value)}
            placeholder='Enter meeting title'
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className='text-red-500 text-sm mt-1'>{errors.title}</p>
          )}
        </div>

        <div>
          <Label htmlFor='description'>Description</Label>
          <MarkdownEditor
            value={formData.description}
            onChange={value => handleInputChange('description', value)}
            placeholder='Enter meeting description... Use Markdown for formatting!'
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
            <Label htmlFor='duration'>Duration (minutes)</Label>
            <Input
              id='duration'
              type='number'
              min='1'
              max='480'
              value={formData.duration || ''}
              onChange={e =>
                handleInputChange(
                  'duration',
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              placeholder='60'
            />
          </div>
        </div>

        <div>
          <Label htmlFor='location'>Location</Label>
          <Input
            id='location'
            value={formData.location}
            onChange={e => handleInputChange('location', e.target.value)}
            placeholder='Physical location or meeting link'
          />
        </div>

        <div className='space-y-4'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='isRecurring'
              checked={formData.isRecurring}
              onCheckedChange={checked =>
                handleInputChange('isRecurring', checked)
              }
            />
            <Label htmlFor='isRecurring'>This is a recurring meeting</Label>
          </div>

          {formData.isRecurring && (
            <div>
              <Label htmlFor='recurrenceType'>Recurrence</Label>
              <Select
                value={formData.recurrenceType}
                onValueChange={value =>
                  handleInputChange('recurrenceType', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select recurrence type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='daily'>Daily</SelectItem>
                  <SelectItem value='weekly'>Weekly</SelectItem>
                  <SelectItem value='monthly'>Monthly</SelectItem>
                  <SelectItem value='bi_monthly'>Bi-monthly</SelectItem>
                  <SelectItem value='semi_annually'>Semi-annually</SelectItem>
                </SelectContent>
              </Select>
              {errors.recurrenceType && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.recurrenceType}
                </p>
              )}
            </div>
          )}

          <div className='flex items-center space-x-2'>
            <Checkbox
              id='isPrivate'
              checked={formData.isPrivate}
              onCheckedChange={checked =>
                handleInputChange('isPrivate', checked)
              }
            />
            <Label htmlFor='isPrivate'>
              Private meeting (only visible to participants)
            </Label>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label htmlFor='teamId'>Team</Label>
            <Select
              value={formData.teamId}
              onValueChange={value => handleInputChange('teamId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select a team' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>No team</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor='initiativeId'>Initiative</Label>
            <Select
              value={formData.initiativeId}
              onValueChange={value => handleInputChange('initiativeId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select an initiative' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>No initiative</SelectItem>
                {initiatives.map(initiative => (
                  <SelectItem key={initiative.id} value={initiative.id}>
                    {initiative.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor='ownerId'>Meeting Owner</Label>
          <Select
            value={formData.ownerId}
            onValueChange={value => handleInputChange('ownerId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder='Select meeting owner' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='none'>No owner</SelectItem>
              {people.map(person => (
                <SelectItem key={person.id} value={person.id}>
                  {person.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

        <div>
          <Label htmlFor='notes'>Notes</Label>
          <MarkdownEditor
            value={formData.notes}
            onChange={value => handleInputChange('notes', value)}
            placeholder='Meeting notes and agenda items... Use Markdown for formatting!'
          />
        </div>
      </div>

      <div className='flex justify-end gap-3'>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving...'
            : isEditing
              ? 'Update Meeting'
              : 'Create Meeting'}
        </Button>
      </div>
    </form>
  )
}
