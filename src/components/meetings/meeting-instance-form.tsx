'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
  importMeetingInstanceFromICS,
} from '@/lib/actions/meeting-instance'
import { toast } from 'sonner'
import {
  type MeetingInstanceFormData,
  meetingInstanceSchema,
} from '@/lib/validations'
import {
  Plus,
  X,
  Calendar,
  StickyNote,
  Users,
  CheckCircle2,
  Copy,
  Upload,
  Loader2,
} from 'lucide-react'
import { MarkdownEditor } from '@/components/markdown-editor'
import { PersonSelect } from '@/components/ui/person-select'
import { FormTemplate, type FormSection } from '@/components/ui/form-template'
import { DateTimePickerWithNaturalInput } from '@/components/ui/datetime-picker-with-natural-input'

interface MeetingInstanceFormProps {
  meetingId: string
  initialData?: Partial<MeetingInstanceFormData>
  isEditing?: boolean
  instanceId?: string
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
  onSubmit?: (formData: MeetingInstanceFormData) => void | Promise<void>
  errors?: Record<string, string>
  isSubmitting?: boolean
}

export function MeetingInstanceForm({
  meetingId,
  initialData,
  isEditing = false,
  instanceId,
  parentMeetingParticipants,
  onSubmit: externalOnSubmit,
  errors: externalErrors,
  isSubmitting: externalIsSubmitting,
}: MeetingInstanceFormProps) {
  const [internalIsSubmitting, setInternalIsSubmitting] = useState(false)
  const [internalErrors, setInternalErrors] = useState<Record<string, string>>(
    {}
  )
  const [isImportingICS, setIsImportingICS] = useState(false)
  const icsFileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Use external props if provided, otherwise use internal state
  const isSubmitting = externalIsSubmitting ?? internalIsSubmitting
  const errors = externalErrors ?? internalErrors
  const setErrors = externalErrors ? () => {} : setInternalErrors
  const setIsSubmitting = externalIsSubmitting
    ? () => {}
    : setInternalIsSubmitting

  // Form state to prevent clearing on errors
  const [formData, setFormData] = useState<MeetingInstanceFormData>({
    meetingId,
    scheduledAt: initialData?.scheduledAt || '',
    notes: initialData?.notes || '',
    participants: initialData?.participants || [],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // If external submit handler provided, use it
    if (externalOnSubmit) {
      await externalOnSubmit(formData)
      return
    }

    // Otherwise use internal submission logic
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
        const createdInstance = await createMeetingInstance(validatedData)
        // Redirect to the newly created instance detail page
        router.push(`/meetings/${meetingId}/instances/${createdInstance.id}`)
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

  const handleICSImport = async (file: File) => {
    setIsImportingICS(true)
    setErrors({})

    try {
      // Validate file extension
      if (!file.name.toLowerCase().endsWith('.ics')) {
        toast.error('Please select a valid ICS calendar file (.ics)')
        return
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        toast.error('ICS file is too large. Maximum size is 5MB')
        return
      }

      // Read file content
      const fileContent = await file.text()

      // Call server action to parse and match attendees
      const importedData = await importMeetingInstanceFromICS(fileContent)

      // Populate form with imported data
      setFormData(prev => ({
        ...prev,
        scheduledAt: importedData.scheduledAt,
        notes: importedData.notes || '',
        participants: importedData.participants,
      }))

      toast.success(
        `Meeting instance imported successfully! ${importedData.participants.length} participant(s) matched.`
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

  const sections: FormSection[] = [
    {
      title: 'Schedule',
      icon: Calendar,
      action: (
        <Button
          type='button'
          variant='outline'
          size='sm'
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
      ),
      content: (
        <div className='space-y-2'>
          <Label htmlFor='scheduledAt'>
            Date & Time <span className='text-destructive'>*</span>
          </Label>
          <DateTimePickerWithNaturalInput
            value={formData.scheduledAt}
            onChange={value => handleInputChange('scheduledAt', value)}
            placeholder="e.g., 'tomorrow at 3pm', 'next Monday', 'Jan 15 at 10am'"
            error={!!errors.scheduledAt}
            required
          />
          {errors.scheduledAt && (
            <p className='text-sm text-destructive'>{errors.scheduledAt}</p>
          )}
          <input
            ref={icsFileInputRef}
            type='file'
            accept='.ics'
            onChange={e => handleICSFileSelect(e.target.files)}
            className='hidden'
            disabled={isImportingICS || isSubmitting}
          />
        </div>
      ),
    },
    {
      title: 'Notes',
      icon: StickyNote,
      content: (
        <MarkdownEditor
          value={formData.notes || ''}
          onChange={value => handleInputChange('notes', value)}
          placeholder='Meeting notes and outcomes... Use Markdown for formatting!'
        />
      ),
    },
    {
      title: 'Participants',
      icon: Users,
      action: (
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
      ),
      content: (
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
      ),
    },
  ]

  return (
    <FormTemplate
      sections={sections}
      onSubmit={handleSubmit}
      submitButton={{
        text: isEditing ? 'Update Instance' : 'Create Instance',
        loadingText: 'Saving...',
        icon: CheckCircle2,
      }}
      generalError={errors.general}
      isSubmitting={isSubmitting}
    />
  )
}
