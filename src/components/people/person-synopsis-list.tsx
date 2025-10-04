'use client'

import { useEffect, useState } from 'react'
import { listPersonSynopses, generatePersonSynopsis } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CalendarDays, Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import { DeleteSynopsisButton } from '@/components/delete-synopsis-button'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { SynopsisCard } from '@/components/synopsis-card'
import type {
  ListSynopsesResponse,
  GenerateSynopsisResponse,
} from '@/lib/actions/synopsis'

interface PersonSynopsisListProps {
  personId: string
  compact?: boolean
  canGenerate?: boolean
}

function toISODate(date: Date) {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  ).toISOString()
}

export function PersonSynopsisList({
  personId,
  compact = false,
  canGenerate = false,
}: PersonSynopsisListProps) {
  const [showModal, setShowModal] = useState(false)
  const [includeFeedback, setIncludeFeedback] = useState(false)
  const [daysBack, setDaysBack] = useState(14)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedSynopsis, setGeneratedSynopsis] = useState<
    GenerateSynopsisResponse['synopsis'] | null
  >(null)
  const [synopses, setSynopses] = useState<ListSynopsesResponse['synopses']>([])
  const [loadingList, setLoadingList] = useState(true)
  const [expandedSynopses, setExpandedSynopses] = useState<Set<string>>(
    new Set()
  )

  const { fromDateIso, toDateIso } = (() => {
    const to = new Date()
    const from = new Date()
    from.setDate(to.getDate() - daysBack)
    return { fromDateIso: toISODate(from), toDateIso: toISODate(to) }
  })()

  useEffect(() => {
    const load = async () => {
      try {
        const res = await listPersonSynopses(personId, 100) // Get all synopses
        if (res.success) {
          setSynopses(res.synopses)
        }
      } catch {}
      setLoadingList(false)
    }
    load()
  }, [personId])

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
        setSynopses(prev => [res.synopsis, ...prev])
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

  const handleSynopsisDeleted = () => {
    // Reload the synopses list after deletion
    const load = async () => {
      try {
        const res = await listPersonSynopses(personId, 100)
        if (res.success) {
          setSynopses(res.synopses)
        }
      } catch {}
    }
    load()
  }

  const toggleSynopsisExpansion = (synopsisId: string) => {
    setExpandedSynopses(prev => {
      const newSet = new Set(prev)
      if (newSet.has(synopsisId)) {
        newSet.delete(synopsisId)
      } else {
        newSet.add(synopsisId)
      }
      return newSet
    })
  }

  const getTruncatedContent = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + '...'
  }

  // Allow expansion in both compact and full modes
  const getDisplayContent = (content: string, synopsisId: string) => {
    const isExpanded = expandedSynopses.has(synopsisId)
    if (isExpanded) return content

    // Use shorter truncation for compact mode when not expanded
    const maxLength = compact ? 100 : 150
    return getTruncatedContent(content, maxLength)
  }

  const shouldShowToggle = (content: string) => {
    // Show toggle if content is longer than the truncation limit
    const maxLength = compact ? 100 : 150
    return content.length > maxLength
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

  if (loadingList) {
    return (
      <div className='text-center py-8'>
        <div className='text-lg font-medium mb-2'>Loading synopses...</div>
      </div>
    )
  }

  return (
    <div>
      {!compact && (
        <div className='flex items-center justify-between mb-6'>
          <div className='text-sm text-muted-foreground'>
            {synopses.length} synopsis{synopses.length !== 1 ? 'es' : ''} found
          </div>
          {canGenerate && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowModal(true)}
            >
              <Plus className='w-4 h-4 mr-2' />
              Generate New
            </Button>
          )}
        </div>
      )}

      {synopses.length === 0 ? (
        compact ? (
          <div className='text-sm text-muted-foreground'>No synopses yet.</div>
        ) : (
          <div className='text-center py-12'>
            <div className='text-lg font-medium mb-2'>No synopses yet</div>
            <div className='text-sm text-muted-foreground mb-4'>
              {canGenerate
                ? 'Generate your first synopsis to get started'
                : 'No synopses have been generated yet'}
            </div>
            {canGenerate && (
              <Button onClick={() => setShowModal(true)}>
                <Plus className='w-4 h-4 mr-2' />
                Generate Synopsis
              </Button>
            )}
          </div>
        )
      ) : (
        <div className={compact ? 'flex flex-wrap gap-4' : 'space-y-4'}>
          {synopses.slice(0, compact ? 1 : synopses.length).map(s => {
            if (compact) {
              return (
                <SynopsisCard
                  key={s.id}
                  synopsis={s}
                  personId={personId}
                  onRefresh={handleSynopsisDeleted}
                />
              )
            }

            // Full mode - keep existing layout for now
            const isExpanded = expandedSynopses.has(s.id)
            const displayContent = getDisplayContent(s.content, s.id)
            const showToggle = shouldShowToggle(s.content)

            return (
              <div key={s.id} className='border rounded-xl p-4'>
                <div className='flex items-start justify-between mb-3'>
                  <div className='text-xs text-muted-foreground space-y-1'>
                    <div>
                      Generated on {new Date(s.createdAt).toLocaleString()} •
                      Sources: {s.sources.join(', ')}
                    </div>
                    <div>
                      Period: {new Date(s.fromDate).toLocaleDateString()} -{' '}
                      {new Date(s.toDate).toLocaleDateString()}
                      {s.includeFeedback && ' • Includes feedback'}
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {showToggle && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => toggleSynopsisExpansion(s.id)}
                        className='h-8 px-2 text-xs'
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className='w-3 h-3 mr-1' />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className='w-3 h-3 mr-1' />
                            Show More
                          </>
                        )}
                      </Button>
                    )}
                    <DeleteSynopsisButton
                      synopsisId={s.id}
                      onSuccess={handleSynopsisDeleted}
                    />
                  </div>
                </div>
                <ReadonlyNotesField
                  content={displayContent}
                  variant='default'
                  emptyStateText='No synopsis content available'
                />
              </div>
            )
          })}
        </div>
      )}

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
    </div>
  )
}
