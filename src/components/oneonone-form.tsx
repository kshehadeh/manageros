'use client'

import { useState } from 'react'
import { createOneOnOne, updateOneOnOne } from '@/lib/actions/oneonone'
import { type OneOnOneFormData } from '@/lib/validations'
import Link from 'next/link'
import { MarkdownEditor } from './markdown-editor'
import { Button } from '@/components/ui/button'
import {
  Handshake,
  Calendar,
  FileText,
  Loader2,
  ArrowLeftRight,
} from 'lucide-react'
import { SectionHeader } from '@/components/ui/section-header'
import { PersonSelect } from '@/components/ui/person-select'
import { DateTimePickerWithNaturalInput } from '@/components/ui/datetime-picker-with-natural-input'
import { usePeopleCache } from '@/hooks/use-organization-cache'

interface OneOnOneData {
  id: string
  managerId: string // participant1
  reportId: string // participant2
  scheduledAt: Date | null
  notes?: string | null
}

interface OneOnOneFormProps {
  preFilledManagerId?: string
  preFilledReportId?: string
  existingOneOnOne?: OneOnOneData
  onCancel?: () => void
}

export function OneOnOneForm({
  preFilledManagerId,
  preFilledReportId,
  existingOneOnOne,
  onCancel,
}: OneOnOneFormProps) {
  // Use the people cache to get people data
  const { people, isLoading, error } = usePeopleCache()

  const [formData, setFormData] = useState<OneOnOneFormData>({
    participant1Id: existingOneOnOne?.managerId || preFilledManagerId || '',
    participant2Id: existingOneOnOne?.reportId || preFilledReportId || '',
    scheduledAt: existingOneOnOne?.scheduledAt
      ? existingOneOnOne.scheduledAt instanceof Date
        ? existingOneOnOne.scheduledAt.toISOString()
        : existingOneOnOne.scheduledAt
      : new Date().toISOString(),
    notes: existingOneOnOne?.notes || '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSwapParticipants = () => {
    setFormData({
      ...formData,
      participant1Id: formData.participant2Id,
      participant2Id: formData.participant1Id,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (existingOneOnOne) {
        await updateOneOnOne(existingOneOnOne.id, formData)
      } else {
        await createOneOnOne(formData)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setIsSubmitting(false)
    }
  }

  // Show loading state while fetching people
  if (isLoading && people.length === 0) {
    return (
      <div className='card text-center py-8'>
        <Loader2 className='w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground' />
        <p className='text-sm text-muted-foreground'>Loading people...</p>
      </div>
    )
  }

  // Show error state if there was an error fetching people
  if (error) {
    return (
      <div className='card text-center py-8'>
        <h3 className='font-semibold mb-2 text-destructive'>
          Error Loading People
        </h3>
        <p className='text-sm text-muted-foreground mb-4'>{error}</p>
        <Button asChild variant='outline'>
          <Link href='/people'>Manage People</Link>
        </Button>
      </div>
    )
  }

  // Show empty state if no people are available
  if (people.length === 0) {
    return (
      <div className='card text-center py-8'>
        <h3 className='font-semibold mb-2'>No Meeting Partners Available</h3>
        <p className='text-sm text-muted-foreground mb-4'>
          No participants available for 1:1 meetings. Contact your administrator
          to add people to your organization.
        </p>
        <Button asChild variant='outline'>
          <Link href='/people'>Manage People</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* Meeting Details */}
      <div className='space-y-4'>
        <SectionHeader icon={Calendar} title='Meeting Details' />
        <p className='text-sm text-muted-foreground'>
          These meetings will only be visible to the participants.
        </p>
        <div className='space-y-4'>
          <div className='flex items-end gap-4'>
            <div className='flex-1'>
              <label className='block text-sm font-medium mb-2'>
                Participant 1 *
              </label>
              <PersonSelect
                value={formData.participant1Id}
                onValueChange={value =>
                  setFormData({ ...formData, participant1Id: value })
                }
                placeholder='Select participant 1'
                showAvatar={true}
                showRole={true}
              />
            </div>

            <div className='flex items-end'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleSwapParticipants}
                className='h-10 px-3'
                title='Swap participants'
              >
                <ArrowLeftRight className='w-4 h-4' />
              </Button>
            </div>

            <div className='flex-1'>
              <label className='block text-sm font-medium mb-2'>
                Participant 2 *
              </label>
              <PersonSelect
                value={formData.participant2Id}
                onValueChange={value =>
                  setFormData({ ...formData, participant2Id: value })
                }
                placeholder='Select participant 2'
                showAvatar={true}
                showRole={true}
              />
            </div>
          </div>

          <div>
            <DateTimePickerWithNaturalInput
              value={formData.scheduledAt}
              onChange={value =>
                setFormData({ ...formData, scheduledAt: value })
              }
              label='Date & Time'
              required
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className='space-y-4'>
        <SectionHeader icon={FileText} title='Notes' />
        <MarkdownEditor
          value={formData.notes || ''}
          onChange={value => setFormData({ ...formData, notes: value })}
          placeholder='Enter meeting notes... Use Markdown for formatting!'
        />
      </div>

      {/* Submit Button */}
      <div className='flex justify-end gap-2'>
        {onCancel && (
          <Button type='button' variant='ghost' onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type='submit'
          variant='outline'
          disabled={
            isSubmitting ||
            !formData.participant1Id ||
            !formData.participant2Id ||
            !formData.scheduledAt
          }
          className='flex items-center gap-2'
        >
          <Handshake className='w-4 h-4' />
          {isSubmitting
            ? existingOneOnOne
              ? 'Updating...'
              : 'Creating...'
            : existingOneOnOne
              ? 'Update 1:1 Meeting'
              : 'Create 1:1 Meeting'}
        </Button>
      </div>
    </form>
  )
}
