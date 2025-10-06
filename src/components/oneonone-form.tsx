'use client'

import { useState } from 'react'
import {
  createOneOnOne,
  updateOneOnOne,
} from '@/lib/actions/oneonone'
import { type OneOnOneFormData } from '@/lib/validations'
import Link from 'next/link'
import { MarkdownEditor } from './markdown-editor'
import { Button } from '@/components/ui/button'
import { Handshake } from 'lucide-react'
import {
  utcToLocalDateTimeString,
  getCurrentLocalDateTimeString,
} from '@/lib/timezone-utils'

interface Person {
  id: string
  name: string
  email: string | null
  role?: string | null
  manager?: { id: string; name: string } | null
  reports: Array<{ id: string; name: string }>
}

interface OneOnOneData {
  id: string
  managerId: string // participant1
  reportId: string // participant2
  scheduledAt: Date | null
  notes?: string | null
}

interface OneOnOneFormProps {
  people: Person[]
  preFilledManagerId?: string
  preFilledReportId?: string
  existingOneOnOne?: OneOnOneData
  onCancel?: () => void
}

export function OneOnOneForm({
  people,
  preFilledManagerId,
  preFilledReportId,
  existingOneOnOne,
  onCancel,
}: OneOnOneFormProps) {
  // Get current date and time in the format required by datetime-local input
  // Use utility functions for proper timezone handling

  const [formData, setFormData] = useState<OneOnOneFormData>({
    participant1Id: existingOneOnOne?.managerId || preFilledManagerId || '',
    participant2Id: existingOneOnOne?.reportId || preFilledReportId || '',
    scheduledAt: existingOneOnOne?.scheduledAt
      ? utcToLocalDateTimeString(existingOneOnOne.scheduledAt)
      : getCurrentLocalDateTimeString(),
    notes: existingOneOnOne?.notes || '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // Since the people list is already filtered to only include people the current user can have meetings with,
  // we can use the same list for both host and guest options
  const managerOptions = people
  const reportOptions = people

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
      <div className='card'>
        <h3 className='font-semibold mb-4'>Meeting Details</h3>
        <p className='text-sm text-muted-foreground mb-4'>
          These meetings will only be visible to the participants.
        </p>
        <div className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium mb-2'>
                Participant 1 *
              </label>
              <select
                value={formData.participant1Id}
                onChange={e =>
                  setFormData({ ...formData, participant1Id: e.target.value })
                }
                className='input'
                required
              >
                <option value=''>Select participant 1</option>
                {managerOptions.map(person => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                    {person.email ? ` (${person.email})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>
                Participant 2 *
              </label>
              <select
                value={formData.participant2Id}
                onChange={e =>
                  setFormData({ ...formData, participant2Id: e.target.value })
                }
                className='input'
                required
              >
                <option value=''>Select participant 2</option>
                {reportOptions.map(person => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                    {person.email ? ` (${person.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>Date *</label>
            <input
              type='datetime-local'
              value={formData.scheduledAt}
              onChange={e =>
                setFormData({ ...formData, scheduledAt: e.target.value })
              }
              className='input'
              required
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className='card'>
        <div>
          <label className='block text-sm font-medium mb-2'>Notes</label>
          <MarkdownEditor
            value={formData.notes || ''}
            onChange={value => setFormData({ ...formData, notes: value })}
            placeholder='Enter meeting notes... Use Markdown for formatting!'
          />
        </div>
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
