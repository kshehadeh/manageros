'use client'

import { useState, useRef } from 'react'
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
  matchAttendeesToPeople,
} from '@/lib/actions/meeting'
import { type MeetingFormData, meetingSchema } from '@/lib/validations'
import { Team } from '@prisma/client'
import {
  AlertCircle,
  Plus,
  X,
  Calendar,
  MapPin,
  Users,
  FileText,
  Clock,
  CalendarDays,
  Upload,
  Loader2,
} from 'lucide-react'
import { MarkdownEditor } from '@/components/markdown-editor'
import { SectionHeader } from '@/components/ui/section-header'
import { PersonSelect } from '@/components/ui/person-select'
import { InitiativeSelect } from '@/components/ui/initiative-select'
import { parseICSFile, validateICSFile } from '@/lib/utils/ics-parser'
import { toast } from 'sonner'

interface MeetingFormProps {
  teams: Team[]
  preselectedTeamId?: string
  preselectedInitiativeId?: string
  preselectedOwnerId?: string
  initialData?: Partial<MeetingFormData>
  isEditing?: boolean
  meetingId?: string
}

export function MeetingForm({
  teams,
  preselectedTeamId,
  preselectedInitiativeId,
  preselectedOwnerId,
  initialData,
  isEditing = false,
  meetingId,
}: MeetingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isImportingICS, setIsImportingICS] = useState(false)
  const icsFileInputRef = useRef<HTMLInputElement>(null)
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
      // Convert 'none' and empty string values to undefined for validation
      const processedFormData = {
        ...formData,
        teamId:
          formData.teamId === 'none' || !formData.teamId
            ? undefined
            : formData.teamId,
        initiativeId:
          formData.initiativeId === 'none' || !formData.initiativeId
            ? undefined
            : formData.initiativeId,
        ownerId:
          formData.ownerId === 'none' || !formData.ownerId
            ? undefined
            : formData.ownerId,
        recurrenceType:
          formData.recurrenceType === 'none' || !formData.recurrenceType
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

  const handleICSImport = async (file: File) => {
    setIsImportingICS(true)
    setErrors({})

    try {
      // Validate file
      const validationError = validateICSFile(file)
      if (validationError) {
        toast.error(validationError)
        return
      }

      // Read file content
      const fileContent = await file.text()

      // Parse ICS file
      const parsedData = await parseICSFile(fileContent)

      // Match attendees to people in the organization
      const matchedAttendees = await matchAttendeesToPeople(
        parsedData.attendeeEmails,
        parsedData.organizerEmail
      )

      // Format scheduledAt for datetime-local input
      const scheduledAtFormatted = parsedData.scheduledAt
        ? new Date(parsedData.scheduledAt).toISOString().slice(0, 16)
        : ''

      // Populate form with parsed data
      setFormData(prev => ({
        ...prev,
        title: parsedData.title,
        description: parsedData.description || '',
        scheduledAt: scheduledAtFormatted,
        duration: parsedData.duration || 60,
        location: parsedData.location || '',
        ownerId: matchedAttendees.ownerId || prev.ownerId,
        participants: matchedAttendees.participants,
      }))

      toast.success(
        `Meeting imported successfully! ${matchedAttendees.participants.length} participant(s) matched.`
      )
    } catch (error) {
      console.error('Error importing ICS file:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to import ICS file. Please check the file format.'
      )
    } finally {
      setIsImportingICS(false)
      // Reset file input
      if (icsFileInputRef.current) {
        icsFileInputRef.current.value = ''
      }
    }
  }

  const handleICSFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return
    handleICSImport(files[0])
  }

  const getSelectValue = (value: string | undefined) => value || 'none'
  const getFormValue = (value: string) => (value === 'none' ? '' : value)

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* General Error Message */}
      {errors.general && (
        <div className='bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm flex items-center gap-2'>
          <AlertCircle className='h-4 w-4' />
          {errors.general}
        </div>
      )}

      {/* ICS Import Button */}
      {!isEditing && (
        <div className='flex justify-end'>
          <Button
            type='button'
            variant='outline'
            onClick={() => icsFileInputRef.current?.click()}
            disabled={isImportingICS || isSubmitting}
          >
            {isImportingICS ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Importing...
              </>
            ) : (
              <>
                <Upload className='mr-2 h-4 w-4' />
                Import from ICS
              </>
            )}
          </Button>
          <input
            ref={icsFileInputRef}
            type='file'
            accept='.ics'
            onChange={e => handleICSFileSelect(e.target.files)}
            className='hidden'
            disabled={isImportingICS || isSubmitting}
          />
        </div>
      )}

      <div className='flex flex-col lg:flex-row gap-6'>
        {/* Main Form Content */}
        <div className='flex-1 space-y-6'>
          {/* Basic Information */}
          <div className='space-y-4'>
            <SectionHeader icon={CalendarDays} title='Basic Information' />
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='title'>
                  Meeting Title <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='title'
                  type='text'
                  value={formData.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                  placeholder='Enter meeting title'
                  className={errors.title ? 'border-destructive' : ''}
                  required
                />
                {errors.title && (
                  <p className='text-sm text-destructive'>{errors.title}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='description'>Description</Label>
                <MarkdownEditor
                  value={formData.description}
                  onChange={value => handleInputChange('description', value)}
                  placeholder='Enter meeting description... Use Markdown for formatting!'
                />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className='space-y-4'>
            <SectionHeader icon={Clock} title='Schedule' />
            <div className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='scheduledAt'>
                    Date & Time <span className='text-destructive'>*</span>
                  </Label>
                  <Input
                    id='scheduledAt'
                    type='datetime-local'
                    value={formData.scheduledAt}
                    onChange={e =>
                      handleInputChange('scheduledAt', e.target.value)
                    }
                    className={errors.scheduledAt ? 'border-destructive' : ''}
                  />
                  {errors.scheduledAt && (
                    <p className='text-sm text-destructive'>
                      {errors.scheduledAt}
                    </p>
                  )}
                </div>

                <div className='space-y-2'>
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

              <div className='space-y-4'>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='isRecurring'
                    checked={formData.isRecurring}
                    onCheckedChange={checked =>
                      handleInputChange('isRecurring', checked)
                    }
                  />
                  <Label htmlFor='isRecurring'>
                    This is a recurring meeting
                  </Label>
                </div>

                {formData.isRecurring && (
                  <div className='space-y-2'>
                    <Label htmlFor='recurrenceType'>Recurrence</Label>
                    <Select
                      value={formData.recurrenceType}
                      onValueChange={value =>
                        handleInputChange('recurrenceType', value)
                      }
                    >
                      <SelectTrigger
                        className={
                          errors.recurrenceType ? 'border-destructive' : ''
                        }
                      >
                        <SelectValue placeholder='Select recurrence type' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='daily'>Daily</SelectItem>
                        <SelectItem value='weekly'>Weekly</SelectItem>
                        <SelectItem value='monthly'>Monthly</SelectItem>
                        <SelectItem value='bi_monthly'>Bi-monthly</SelectItem>
                        <SelectItem value='semi_annually'>
                          Semi-annually
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.recurrenceType && (
                      <p className='text-sm text-destructive'>
                        {errors.recurrenceType}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className='space-y-4'>
            <SectionHeader icon={MapPin} title='Location' />
            <div className='space-y-2'>
              <Label htmlFor='location'>Location</Label>
              <Input
                id='location'
                value={formData.location}
                onChange={e => handleInputChange('location', e.target.value)}
                placeholder='Physical location or meeting link'
              />
            </div>
          </div>

          {/* Participants */}
          <div className='space-y-4'>
            <SectionHeader
              icon={Users}
              title='Participants'
              action={
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={addParticipant}
                >
                  <Plus className='h-4 w-4' />
                  Add Participant
                </Button>
              }
            />
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='ownerId'>Meeting Owner</Label>
                <PersonSelect
                  value={getSelectValue(formData.ownerId)}
                  onValueChange={value =>
                    handleInputChange('ownerId', getFormValue(value))
                  }
                  placeholder='Select meeting owner'
                  includeNone={true}
                  noneLabel='No owner'
                  showAvatar={true}
                  showRole={true}
                />
              </div>

              {formData.participants.length > 0 && (
                <div className='space-y-2'>
                  <Label>Additional Participants</Label>
                  <div className='space-y-2'>
                    {formData.participants.map((participant, index) => (
                      <div key={index} className='flex items-center gap-2'>
                        <PersonSelect
                          value={participant.personId}
                          onValueChange={value =>
                            updateParticipant(index, 'personId', value)
                          }
                          placeholder='Select participant'
                          showAvatar={true}
                          showRole={true}
                          className='flex-1'
                        />

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
              )}
            </div>
          </div>

          {/* Team & Initiative */}
          <div className='space-y-4'>
            <SectionHeader icon={Calendar} title='Team & Initiative' />
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
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

              <div className='space-y-2'>
                <Label htmlFor='initiativeId'>Initiative</Label>
                <InitiativeSelect
                  value={getSelectValue(formData.initiativeId)}
                  onValueChange={value =>
                    handleInputChange('initiativeId', getFormValue(value))
                  }
                  placeholder='Select an initiative'
                  includeNone={true}
                  noneLabel='No initiative'
                  showStatus={true}
                  showTeam={false}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className='space-y-4'>
            <SectionHeader icon={FileText} title='Notes' />
            <div className='space-y-2'>
              <MarkdownEditor
                value={formData.notes}
                onChange={value => handleInputChange('notes', value)}
                placeholder='Meeting notes and agenda items... Use Markdown for formatting!'
              />
            </div>
          </div>

          {/* Privacy Settings */}
          <div className='space-y-4'>
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
        </div>
      </div>

      {/* Submit Button */}
      <div className='flex justify-end gap-3'>
        <Button type='submit' variant='outline' disabled={isSubmitting}>
          <CalendarDays className='w-4 h-4 mr-2' />
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
