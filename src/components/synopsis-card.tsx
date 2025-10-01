'use client'

import { Calendar, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useState } from 'react'
import { SynopsisDialog } from './synopsis-dialog'

type SynopsisWithRelations = {
  id: string
  content: string
  createdAt: string
  fromDate: string
  toDate: string
  includeFeedback: boolean
  sources: string[]
}

interface SynopsisCardProps {
  synopsis: SynopsisWithRelations
  onRefresh?: () => void
}

export function SynopsisCard({ synopsis, onRefresh }: SynopsisCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const formatDate = (date: string) => {
    const dateObj = new Date(date)
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateRange = (fromDate: string, toDate: string) => {
    const from = new Date(fromDate)
    const to = new Date(toDate)
    return `${from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${to.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }

  const getExcerpt = (content: string, maxLength: number = 120) => {
    if (!content) return 'No content available'
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + '...'
  }

  const getSourcesText = (sources: string[]) => {
    if (sources.length === 0) return 'No sources'
    if (sources.length === 1) return sources[0]
    if (sources.length === 2) return sources.join(' & ')
    return `${sources[0]} & ${sources.length - 1} others`
  }

  return (
    <>
      <Card
        className='cursor-pointer hover:shadow-md transition-shadow duration-200 w-full min-w-[280px] max-w-[400px]'
        onClick={() => setIsDialogOpen(true)}
      >
        <CardContent className='p-4 flex flex-col h-full'>
          <div className='flex flex-col h-full space-y-3'>
            {/* Header with badges */}
            <div className='flex items-center gap-2 flex-wrap'>
              {synopsis.includeFeedback && (
                <Badge variant='secondary'>Includes Feedback</Badge>
              )}
            </div>

            {/* Period */}
            <div className='flex items-center gap-1 text-sm text-muted-foreground'>
              <Clock className='w-3 h-3' />
              <span>{formatDateRange(synopsis.fromDate, synopsis.toDate)}</span>
            </div>

            {/* Content excerpt - flex-grow to take available space */}
            <div className='text-sm text-foreground leading-relaxed flex-grow'>
              {getExcerpt(synopsis.content)}
            </div>

            {/* Sources and date at bottom */}
            <div className='space-y-2 mt-auto'>
              <div className='text-xs text-muted-foreground'>
                Sources: {getSourcesText(synopsis.sources)}
              </div>
              <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                <Calendar className='w-3 h-3' />
                {formatDate(synopsis.createdAt)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <SynopsisDialog
        synopsis={synopsis}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onRefresh={onRefresh}
      />
    </>
  )
}
