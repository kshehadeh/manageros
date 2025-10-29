'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateTimePickerWithNaturalInput } from '@/components/ui/datetime-picker-with-natural-input'
import { useState, useEffect } from 'react'
import { createCheckIn, updateCheckIn } from '@/lib/actions/checkin'
import { Rag } from '@/components/rag'
import type { CheckInFormData } from '@/lib/validations'
import type { CheckInFormDataProps } from './checkin-modal'

export function CheckInFormContent({
  initiativeId,
  initiativeTitle,
  checkIn,
  onSuccess,
  showTitle = false,
}: CheckInFormDataProps & { showTitle?: boolean }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!checkIn

  // Convert date string to ISO format for datetime picker
  const getWeekOfISO = (dateString?: string): string => {
    if (!dateString) return ''
    // If it's already a full ISO string, return it
    if (dateString.includes('T')) return dateString
    // If it's just a date (YYYY-MM-DD), convert to ISO at midnight
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(dateString + 'T00:00:00').toISOString()
    }
    // Otherwise try to parse it as a date
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? '' : date.toISOString()
  }

  // Form state to preserve values on error
  const [formData, setFormData] = useState({
    weekOf: getWeekOfISO(checkIn?.weekOf),
    rag: checkIn?.rag ?? 'green',
    confidence: checkIn?.confidence ?? 80,
    summary: checkIn?.summary ?? '',
    blockers: checkIn?.blockers ?? '',
    nextSteps: checkIn?.nextSteps ?? '',
  })

  // Reset form when checkIn changes
  useEffect(() => {
    setFormData({
      weekOf: getWeekOfISO(checkIn?.weekOf),
      rag: checkIn?.rag ?? 'green',
      confidence: checkIn?.confidence ?? 80,
      summary: checkIn?.summary ?? '',
      blockers: checkIn?.blockers ?? '',
      nextSteps: checkIn?.nextSteps ?? '',
    })
    setError(null)
  }, [checkIn])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const data: CheckInFormData = {
        initiativeId,
        weekOf: formData.weekOf,
        rag: formData.rag as 'green' | 'amber' | 'red',
        confidence: formData.confidence,
        summary: formData.summary,
        blockers: formData.blockers,
        nextSteps: formData.nextSteps,
      }

      if (isEditing) {
        await updateCheckIn(checkIn.id, data)
      } else {
        await createCheckIn(data)
      }

      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {showTitle && (
        <div className='mb-4'>
          <h3 className='text-lg font-semibold mb-2'>
            {isEditing ? 'Edit Check-in' : 'New Check-in'}
          </h3>
          <p className='text-sm text-muted-foreground'>
            Initiative: {initiativeTitle}
          </p>
        </div>
      )}

      {error && (
        <div className='bg-destructive/20 border border-destructive rounded-lg p-3 text-destructive text-sm'>
          {error}
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <DateTimePickerWithNaturalInput
            value={formData.weekOf}
            onChange={value =>
              setFormData(prev => ({ ...prev, weekOf: value }))
            }
            label='Week of'
            placeholder="e.g., 'next Monday', 'Jan 15', 'this week'"
            required
            dateOnly
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='confidence'>Confidence (%)</Label>
          <Input
            type='number'
            id='confidence'
            name='confidence'
            min='0'
            max='100'
            value={formData.confidence}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                confidence: parseInt(e.target.value) || 0,
              }))
            }
          />
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='rag'>RAG Status</Label>
        <div className='flex gap-2'>
          {(['green', 'amber', 'red'] as const).map(color => (
            <label
              key={color}
              className='flex items-center gap-2 cursor-pointer'
            >
              <input
                type='radio'
                name='rag'
                value={color}
                checked={formData.rag === color}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    rag: e.target.value as 'green' | 'amber' | 'red',
                  }))
                }
                className='sr-only'
              />
              <div className='px-3 py-1 rounded-lg text-sm font-medium transition-colors bg-secondary text-secondary-foreground'>
                <Rag rag={color} />
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='summary'>Summary *</Label>
        <Textarea
          id='summary'
          name='summary'
          required
          rows={3}
          value={formData.summary}
          onChange={e =>
            setFormData(prev => ({ ...prev, summary: e.target.value }))
          }
          placeholder='What happened this week?'
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='blockers'>Blockers</Label>
        <Textarea
          id='blockers'
          name='blockers'
          rows={2}
          value={formData.blockers}
          onChange={e =>
            setFormData(prev => ({ ...prev, blockers: e.target.value }))
          }
          placeholder='Any blockers or challenges?'
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='nextSteps'>Next Steps</Label>
        <Textarea
          id='nextSteps'
          name='nextSteps'
          rows={2}
          value={formData.nextSteps}
          onChange={e =>
            setFormData(prev => ({ ...prev, nextSteps: e.target.value }))
          }
          placeholder='What are the next steps?'
        />
      </div>

      <div className='flex justify-end gap-2 pt-4'>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving...'
            : isEditing
              ? 'Update Check-in'
              : 'Create Check-in'}
        </Button>
      </div>
    </form>
  )
}
