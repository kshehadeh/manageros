'use client'

import { useState } from 'react'
import { createOneOnOne, updateOneOnOne } from '@/lib/actions'
import { type OneOnOneFormData } from '@/lib/validations'
import Link from 'next/link'

interface Person {
  id: string
  name: string
  email: string
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
}

export function OneOnOneForm({
  people,
  preFilledManagerId,
  preFilledReportId,
  existingOneOnOne,
}: OneOnOneFormProps) {
  // Get current date and time in the format required by datetime-local input
  const getCurrentDateTime = () => {
    const now = new Date()
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
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
  // we can use the same list for both manager and report options
  const managerOptions = people
  const reportOptions = people

  if (people.length === 0) {
    return (
      <div className='card text-center py-8'>
        <h3 className='font-semibold mb-2'>No Meeting Partners Available</h3>
        <p className='text-sm text-neutral-400 mb-4'>
          You don&apos;t have any direct reports or a manager assigned. Contact
          your administrator to set up reporting relationships.
        </p>
        <Link href='/people' className='btn bg-blue-600 hover:bg-blue-700'>
          Manage People
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* Meeting Details */}
      <div className='card'>
        <h3 className='font-semibold mb-4'>Meeting Details</h3>
        <p className='text-sm text-neutral-400 mb-4'>
          You can only create 1:1 meetings with people you manage or who manage
          you. These meetings will only be visible to the participants.
        </p>
        {(preFilledManagerId || preFilledReportId) && (
          <div className='bg-blue-900/20 border border-blue-700 rounded-lg p-3 mb-4'>
            <p className='text-sm text-blue-300'>
              ✓ Form pre-filled based on your selection
            </p>
          </div>
        )}
        <div className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium mb-2'>
                Manager *
              </label>
              <select
                value={formData.managerId}
                onChange={e =>
                  setFormData({ ...formData, managerId: e.target.value })
                }
                className='input'
                required
              >
                <option value=''>Select a manager</option>
                {managerOptions.map(person => (
                  <option key={person.id} value={person.id}>
                    {person.name} ({person.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>Report *</label>
              <select
                value={formData.reportId}
                onChange={e =>
                  setFormData({ ...formData, reportId: e.target.value })
                }
                className='input'
                required
              >
                <option value=''>Select a report</option>
                {reportOptions.map(person => (
                  <option key={person.id} value={person.id}>
                    {person.name} ({person.email})
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
        <h3 className='font-semibold mb-4'>Meeting Notes</h3>
        <div>
          <label className='block text-sm font-medium mb-2'>
            Notes (Markdown supported)
          </label>
          <textarea
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            className='input min-h-[150px] resize-y font-mono text-sm'
            placeholder='Enter meeting notes... (Markdown formatting supported)'
            rows={6}
          />
          <p className='text-xs text-neutral-500 mt-2'>
            You can use Markdown formatting like **bold**, *italic*, - lists,
            etc.
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className='flex justify-end'>
        <button
          type='submit'
          disabled={
            isSubmitting ||
            !formData.managerId ||
            !formData.reportId ||
            !formData.scheduledAt
          }
          className='btn bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isSubmitting
            ? existingOneOnOne
              ? 'Updating...'
              : 'Creating...'
            : existingOneOnOne
              ? 'Update 1:1 Meeting'
              : 'Create 1:1 Meeting'}
        </button>
      </div>
    </form>
  )
}
