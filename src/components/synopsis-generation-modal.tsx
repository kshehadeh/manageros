'use client'

import { useState } from 'react'
import { generatePersonSynopsis } from '@/lib/actions/synopsis'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CalendarDays, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

interface SynopsisGenerationModalProps {
  personId: string
  personName: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function SynopsisGenerationModal({
  personId,
  personName,
  isOpen,
  onClose,
  onSuccess,
}: SynopsisGenerationModalProps) {
  const [daysBack, setDaysBack] = useState(14)
  const [includeFeedback, setIncludeFeedback] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)

    try {
      const to = new Date()
      const from = new Date()
      from.setDate(to.getDate() - daysBack)

      const fromDateIso = new Date(
        Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
      ).toISOString()

      const toDateIso = new Date(
        Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
      ).toISOString()

      const result = await generatePersonSynopsis({
        personId,
        fromDate: fromDateIso,
        toDate: toDateIso,
        includeFeedback,
      })

      if (result.success) {
        toast.success('Synopsis generated successfully!')
        onClose()
        onSuccess?.()
      } else {
        toast.error('Failed to generate synopsis')
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate synopsis'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-background border rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between mb-4'>
          <h4 className='font-medium text-lg'>
            Generate Synopsis for {personName}
          </h4>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleClose}
            className='h-8 w-8 p-0'
            disabled={loading}
          >
            <X className='h-4 w-4' />
          </Button>
        </div>

        <div className='space-y-4'>
          <div className='flex items-center gap-2'>
            <CalendarDays className='w-4 h-4' />
            <label className='text-sm font-medium'>Time Period:</label>
            <select
              className='bg-background border px-3 py-2 rounded-md text-sm'
              value={daysBack}
              onChange={e => setDaysBack(parseInt(e.target.value))}
              disabled={loading}
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>

          <div className='flex items-center gap-2'>
            <Checkbox
              checked={includeFeedback}
              onCheckedChange={v => setIncludeFeedback(Boolean(v))}
              disabled={loading}
            />
            <label className='text-sm'>
              Include feedback and campaign responses
            </label>
          </div>

          <div className='flex justify-end gap-2 pt-4'>
            <Button variant='outline' onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Generating...
                </>
              ) : (
                'Generate Synopsis'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
