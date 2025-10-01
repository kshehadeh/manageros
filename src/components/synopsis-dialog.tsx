'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { Trash2, Calendar, Clock, Eye } from 'lucide-react'
import { deleteSynopsis } from '@/lib/actions/synopsis'

type SynopsisWithRelations = {
  id: string
  content: string
  createdAt: string
  fromDate: string
  toDate: string
  includeFeedback: boolean
  sources: string[]
}

interface SynopsisDialogProps {
  synopsis: SynopsisWithRelations
  isOpen: boolean
  onClose: () => void
  onRefresh?: () => void
}

export function SynopsisDialog({
  synopsis,
  isOpen,
  onClose,
  onRefresh,
}: SynopsisDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const formatDate = (date: string) => {
    const dateObj = new Date(date)
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateRange = (fromDate: string, toDate: string) => {
    const from = new Date(fromDate)
    const to = new Date(toDate)
    return `${from.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })} - ${to.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`
  }

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this synopsis? This action cannot be undone.'
      )
    ) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteSynopsis(synopsis.id)
      onRefresh?.()
      onClose()
    } catch (error) {
      console.error('Failed to delete synopsis:', error)
      alert('Failed to delete synopsis. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] flex flex-col p-0'>
        <DialogHeader className='sticky top-0 z-0 bg-background border-b px-6 py-4 rounded-t-lg pr-12'>
          <DialogTitle className='flex items-center gap-2'>
            <Eye className='w-5 h-5' />
            Synopsis Details
          </DialogTitle>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto px-6 py-4'>
          <div className='space-y-6'>
            {/* Header Information */}
            <div className='space-y-4'>
              <div className='flex items-center gap-2 flex-wrap'>
                {synopsis.includeFeedback && (
                  <Badge variant='secondary'>Includes Feedback</Badge>
                )}
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                <div className='flex items-center gap-2 text-muted-foreground'>
                  <Clock className='w-4 h-4' />
                  <span>
                    <span className='font-medium'>Period:</span>{' '}
                    {formatDateRange(synopsis.fromDate, synopsis.toDate)}
                  </span>
                </div>
                <div className='flex items-center gap-2 text-muted-foreground'>
                  <Calendar className='w-4 h-4' />
                  <span>
                    <span className='font-medium'>Generated:</span>{' '}
                    {formatDate(synopsis.createdAt)}
                  </span>
                </div>
              </div>

              <div className='text-sm text-muted-foreground'>
                <span className='font-medium'>Sources:</span>{' '}
                {synopsis.sources.length > 0
                  ? synopsis.sources.join(', ')
                  : 'No sources'}
              </div>
            </div>

            {/* Content */}
            <div className='space-y-2'>
              <h4 className='font-medium text-foreground'>Synopsis Content</h4>
              <div className='border border-border rounded-lg p-4 bg-muted/30'>
                <ReadonlyNotesField
                  content={synopsis.content}
                  variant='default'
                  emptyStateText='No synopsis content available'
                />
              </div>
            </div>

            {/* Actions */}
            <div className='flex justify-end gap-2 pt-4 border-t'>
              <Button
                variant='destructive'
                onClick={handleDelete}
                disabled={isDeleting}
                className='flex items-center gap-2'
              >
                <Trash2 className='w-4 h-4' />
                {isDeleting ? 'Deleting...' : 'Delete Synopsis'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
