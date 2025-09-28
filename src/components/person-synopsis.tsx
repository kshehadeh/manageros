'use client'

import { useEffect, useMemo, useState } from 'react'
import { generatePersonSynopsis } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CalendarDays, Plus, X, Eye } from 'lucide-react'
import Link from 'next/link'
import { PersonSynopsisList } from '@/components/person-synopsis-list'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'

interface PersonSynopsisProps {
  personId: string
  canGenerate?: boolean
}

function toISODate(date: Date) {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  ).toISOString()
}

export function PersonSynopsis({
  personId,
  canGenerate = false,
}: PersonSynopsisProps) {
  const [showModal, setShowModal] = useState(false)
  const [includeFeedback, setIncludeFeedback] = useState(false)
  const [daysBack, setDaysBack] = useState(14)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedSynopsis, setGeneratedSynopsis] = useState<{
    id: string
    content: string
    createdAt: string
    sources: string[]
  } | null>(null)
  const { fromDateIso, toDateIso } = useMemo(() => {
    const to = new Date()
    const from = new Date()
    from.setDate(to.getDate() - daysBack)
    return { fromDateIso: toISODate(from), toDateIso: toISODate(to) }
  }, [daysBack])

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setGeneratedSynopsis(null)
    try {
      const res = await generatePersonSynopsis({
        personId,
        fromDate: fromDateIso,
        toDate: toDateIso,
        includeFeedback,
      })
      if (res.success) {
        setGeneratedSynopsis(res.synopsis)
        // The PersonSynopsisList will handle refreshing the list
      } else {
        setError('Failed to generate synopsis')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate synopsis')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setGeneratedSynopsis(null)
    setError(null)
    setLoading(false)
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        handleCloseModal()
      }
    }
    if (showModal) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [showModal])

  return (
    <section>
      <div className='flex items-center justify-between mb-3'>
        <h3 className='font-semibold'>Synopsis</h3>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' asChild>
            <Link href={`/people/${personId}/synopses`}>
              <Eye className='w-4 h-4 mr-2' />
              View All
            </Link>
          </Button>
          {canGenerate && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowModal(true)}
            >
              <Plus className='w-4 h-4 mr-2' />
              Add New
            </Button>
          )}
        </div>
      </div>

      <PersonSynopsisList
        personId={personId}
        compact={true}
        canGenerate={canGenerate}
      />

      {/* Modal */}
      {showModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-background border rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between mb-4'>
              <h4 className='font-medium text-lg'>Generate Synopsis</h4>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleCloseModal}
                className='h-8 w-8 p-0'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>

            {!generatedSynopsis && !loading && (
              <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <CalendarDays className='w-4 h-4' />
                  <label className='text-sm font-medium'>Time Period:</label>
                  <select
                    className='bg-background border px-3 py-2 rounded-md text-sm'
                    value={daysBack}
                    onChange={e => setDaysBack(parseInt(e.target.value))}
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
                  />
                  <label className='text-sm'>
                    Include feedback and campaign responses
                  </label>
                </div>

                <div className='flex justify-end gap-2 pt-4'>
                  <Button variant='outline' onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button onClick={handleGenerate}>Generate Synopsis</Button>
                </div>
              </div>
            )}

            {loading && (
              <div className='text-center py-8'>
                <div className='text-lg font-medium mb-2'>
                  Generating synopsis...
                </div>
                <div className='text-sm text-muted-foreground'>
                  This may take a few moments
                </div>
              </div>
            )}

            {error && (
              <div className='text-center py-8'>
                <div className='text-red-500 mb-4'>{error}</div>
                <div className='flex justify-center gap-2'>
                  <Button variant='outline' onClick={handleCloseModal}>
                    Close
                  </Button>
                  <Button onClick={handleGenerate}>Try Again</Button>
                </div>
              </div>
            )}

            {generatedSynopsis && (
              <div className='space-y-4'>
                <div className='text-xs text-muted-foreground'>
                  Generated on{' '}
                  {new Date(generatedSynopsis.createdAt).toLocaleString()} •
                  Sources: {generatedSynopsis.sources.join(', ')}
                </div>
                <div className='border rounded-lg p-4 bg-muted/20'>
                  <ReadonlyNotesField
                    content={generatedSynopsis.content}
                    variant='detailed'
                    emptyStateText='No synopsis content available'
                  />
                </div>
                <div className='flex justify-end'>
                  <Button onClick={handleCloseModal}>Close</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
