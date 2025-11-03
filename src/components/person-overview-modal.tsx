'use client'

import { useState, useEffect } from 'react'
import { generatePersonOverview } from '@/lib/actions/person-overview'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface PersonOverviewModalProps {
  personId: string
  personName: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function PersonOverviewModal({
  personId,
  personName,
  isOpen,
  onClose,
  onSuccess,
}: PersonOverviewModalProps) {
  const [loading, setLoading] = useState(false)
  const [lookbackDays, setLookbackDays] = useState(30)

  // Reset lookback days when modal opens
  useEffect(() => {
    if (isOpen) {
      setLookbackDays(30)
    }
  }, [isOpen])

  const handleGenerate = async () => {
    setLoading(true)

    try {
      const result = await generatePersonOverview(personId, {
        lookbackDays: lookbackDays,
      })

      if (result.success) {
        toast.success('Overview generated successfully!')
        onClose()
        onSuccess?.()
      } else {
        toast.error('Failed to generate overview')
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate overview'
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
      <DialogContent className='max-w-full sm:max-w-[50vh]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Sparkles className='w-5 h-5' />
            Generate AI Overview for {personName}
          </DialogTitle>
          <DialogDescription>
            This will create a comprehensive professional overview that includes
            their role, team structure, current initiatives, tasks, feedback,
            and team leadership responsibilities.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='lookbackDays'>Lookback Period (days)</Label>
            <Input
              id='lookbackDays'
              type='number'
              min='1'
              max='365'
              value={lookbackDays}
              onChange={e => {
                const value = parseInt(e.target.value, 10)
                if (!isNaN(value) && value > 0) {
                  setLookbackDays(value)
                }
              }}
              disabled={loading}
              className='w-full'
            />
            <p className='text-xs text-muted-foreground'>
              How far back to include feedback and completed tasks (default: 30
              days)
            </p>
          </div>

          <div className='bg-muted/50 rounded-lg p-4 space-y-2'>
            <h4 className='font-medium text-sm'>Overview will include:</h4>
            <ul className='text-sm text-muted-foreground space-y-1 list-disc list-inside'>
              <li>Role, team, and reporting structure</li>
              <li>Current initiatives and ownership</li>
              <li>
                Active and recent tasks (completed in last {lookbackDays} days)
              </li>
              <li>Team leadership (if applicable)</li>
              <li>
                Recent feedback highlights (from last {lookbackDays} days)
              </li>
            </ul>
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
              <>
                <Sparkles className='w-4 h-4 mr-2' />
                Generate Overview
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
