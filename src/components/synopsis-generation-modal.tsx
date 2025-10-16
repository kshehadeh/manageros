'use client'

import { useState } from 'react'
import { generatePersonSynopsis } from '@/lib/actions/synopsis'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CalendarDays, Loader2 } from 'lucide-react'
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

  const handleOpenChange = (open: boolean) => {
    if (!open && !loading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Generate Synopsis for {personName}</DialogTitle>
        </DialogHeader>

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
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={loading}>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
