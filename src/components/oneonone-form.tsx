'use client'

import { useState } from 'react'
import { createOneOnOne, updateOneOnOne } from '@/lib/actions'
import { type OneOnOneFormData } from '@/lib/validations'
import Link from 'next/link'
import { MarkdownEditor } from './markdown-editor'
import { Button } from '@/components/ui/button'
import { Handshake } from 'lucide-react'

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
  managerId: string
  reportId: string
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
  const getCurrentDateTime = () => {
    const now = new Date()

    // Round to the nearest half hour
    const minutes = now.getMinutes()
    const roundedMinutes = minutes < 15 ? 0 : minutes < 45 ? 30 : 0
    const roundedHours = minutes >= 45 ? now.getHours() + 1 : now.getHours()

    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(roundedHours).padStart(2, '0')
    const minutesStr = String(roundedMinutes).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutesStr}`
  }

  // Format existing date for datetime-local input
  const formatExistingDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const [formData, setFormData] = useState<OneOnOneFormData>({
    managerId: existingOneOnOne?.managerId || preFilledManagerId || '',
    reportId: existingOneOnOne?.reportId || preFilledReportId || '',
    scheduledAt: existingOneOnOne?.scheduledAt
      ? formatExistingDate(existingOneOnOne.scheduledAt)
      : getCurrentDateTime(),
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
          You don&apos;t have any direct reports or a manager assigned. Contact
          your administrator to set up reporting relationships.
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
              <label className='block text-sm font-medium mb-2'>Host *</label>
              <select
                value={formData.managerId}
                onChange={e =>
                  setFormData({ ...formData, managerId: e.target.value })
                }
                className='input'
                required
              >
                <option value=''>Select a host</option>
                {managerOptions.map(person => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                    {person.email ? ` (${person.email})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>Guest *</label>
              <select
                value={formData.reportId}
                onChange={e =>
                  setFormData({ ...formData, reportId: e.target.value })
                }
                className='input'
                required
              >
                <option value=''>Select a guest</option>
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
            !formData.managerId ||
            !formData.reportId ||
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
