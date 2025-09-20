'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { createCheckIn, updateCheckIn } from '@/lib/actions'
import { Rag } from '@/components/rag'
import type { CheckInFormData } from '@/lib/validations'

interface CheckInFormProps {
  initiativeId: string
  initiativeTitle: string
  checkIn?: {
    id: string
    weekOf: string
    rag: string
    confidence: number
    summary: string
    blockers?: string | null
    nextSteps?: string | null
  }
  onSuccess?: () => void
}

export function CheckInForm({
  initiativeId,
  initiativeTitle,
  checkIn,
  onSuccess,
}: CheckInFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state to preserve values on error
  const [formData, setFormData] = useState({
    weekOf: checkIn?.weekOf ? checkIn.weekOf.split('T')[0] : '',
    rag: checkIn?.rag ?? 'green',
    confidence: checkIn?.confidence ?? 80,
    summary: checkIn?.summary ?? '',
    blockers: checkIn?.blockers ?? '',
    nextSteps: checkIn?.nextSteps ?? '',
  })

  const isEditing = !!checkIn

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
        // Clear form for new check-ins
        setFormData({
          weekOf: '',
          rag: 'green',
          confidence: 80,
          summary: '',
          blockers: '',
          nextSteps: '',
        })
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
      <div className='mb-4'>
        <h3 className='text-lg font-semibold mb-2'>
          {isEditing ? 'Edit Check-in' : 'New Check-in'}
        </h3>
        <p className='text-sm text-muted-foreground'>
          Initiative: {initiativeTitle}
        </p>
      </div>

      {error && (
        <div className='bg-destructive/20 border border-destructive rounded-lg p-3 text-destructive text-sm'>
          {error}
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label htmlFor='weekOf' className='block text-sm font-medium mb-1'>
            Week of *
          </label>
          <input
            type='date'
            id='weekOf'
            name='weekOf'
            required
            value={formData.weekOf}
            onChange={e =>
              setFormData(prev => ({ ...prev, weekOf: e.target.value }))
            }
            className='input w-full'
          />
        </div>

        <div>
          <label
            htmlFor='confidence'
            className='block text-sm font-medium mb-1'
          >
            Confidence (%)
          </label>
          <input
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
            className='input w-full'
          />
        </div>
      </div>

      <div>
        <label htmlFor='rag' className='block text-sm font-medium mb-2'>
          RAG Status
        </label>
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

      <div>
        <label htmlFor='summary' className='block text-sm font-medium mb-1'>
          Summary *
        </label>
        <textarea
          id='summary'
          name='summary'
          required
          rows={3}
          value={formData.summary}
          onChange={e =>
            setFormData(prev => ({ ...prev, summary: e.target.value }))
          }
          placeholder='What happened this week?'
          className='input w-full resize-none'
        />
      </div>

      <div>
        <label htmlFor='blockers' className='block text-sm font-medium mb-1'>
          Blockers
        </label>
        <textarea
          id='blockers'
          name='blockers'
          rows={2}
          value={formData.blockers}
          onChange={e =>
            setFormData(prev => ({ ...prev, blockers: e.target.value }))
          }
          placeholder='Any blockers or challenges?'
          className='input w-full resize-none'
        />
      </div>

      <div>
        <label htmlFor='nextSteps' className='block text-sm font-medium mb-1'>
          Next Steps
        </label>
        <textarea
          id='nextSteps'
          name='nextSteps'
          rows={2}
          value={formData.nextSteps}
          onChange={e =>
            setFormData(prev => ({ ...prev, nextSteps: e.target.value }))
          }
          placeholder='What are the next steps?'
          className='input w-full resize-none'
        />
      </div>

      <div className='flex gap-2 pt-4'>
        <Button type='submit' disabled={isSubmitting} variant='outline'>
          {isSubmitting
            ? 'Saving...'
            : isEditing
              ? 'Update Check-in'
              : 'Create Check-in'}
        </Button>
        {onSuccess && (
          <Button type='button' onClick={onSuccess} variant='outline'>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
