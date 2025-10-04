'use client'

import { Calendar, Eye, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useState } from 'react'
import { SynopsisDialog } from './synopsis-dialog'
import { DeleteModal } from '@/components/common/delete-modal'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { deleteSynopsis } from '@/lib/actions/synopsis'
import Link from 'next/link'

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
  personId: string
  onRefresh?: () => void
}

export function SynopsisCard({
  synopsis,
  personId,
  onRefresh,
}: SynopsisCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

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

  const getExcerpt = (content: string, maxLength: number = 150) => {
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

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      await deleteSynopsis(synopsis.id)
      onRefresh?.()
      setShowDeleteModal(false)
    } catch (error) {
      console.error('Failed to delete synopsis:', error)
      throw error // Let DeleteModal handle the error display
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card className='w-full hover:shadow-md transition-shadow duration-200 group'>
        <CardHeader className='pb-3'>
          <div className='flex items-start justify-between'>
            <div className='space-y-2 flex-1'>
              <h3 className='font-semibold text-base'>
                {formatDateRange(synopsis.fromDate, synopsis.toDate)}
              </h3>
              <div className='flex items-center gap-2 flex-wrap'>
                {synopsis.includeFeedback && (
                  <Badge variant='secondary' className='text-xs'>
                    Includes Feedback
                  </Badge>
                )}
              </div>
            </div>

            <ActionDropdown size='sm'>
              {({ close }) => (
                <div className='py-1'>
                  <Link
                    href={`/people/${personId}/synopses/${synopsis.id}`}
                    className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                    onClick={close}
                  >
                    <Eye className='w-4 h-4' />
                    View Details
                  </Link>
                  <div
                    className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-destructive cursor-pointer'
                    onClick={() => {
                      setShowDeleteModal(true)
                      close()
                    }}
                  >
                    <Trash2 className='w-4 h-4' />
                    Delete
                  </div>
                </div>
              )}
            </ActionDropdown>
          </div>
        </CardHeader>

        <CardContent className='pt-0'>
          <div className='space-y-3'>
            {/* Content excerpt */}
            <div className='text-sm text-foreground leading-relaxed'>
              {getExcerpt(synopsis.content)}
            </div>

            {/* Footer with sources and date */}
            <div className='space-y-2 pt-2 border-t'>
              <div className='text-xs text-muted-foreground'>
                <span className='font-medium'>Sources:</span>{' '}
                {getSourcesText(synopsis.sources)}
              </div>
              <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                <Calendar className='w-3 h-3' />
                Generated {formatDate(synopsis.createdAt)}
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

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title='Delete Synopsis'
        entityName='synopsis'
        isLoading={isDeleting}
      />
    </>
  )
}
