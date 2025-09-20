'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAllFeedback, deleteFeedback } from '@/lib/actions'
import { Eye } from 'lucide-react'
import { EditIconButton } from './edit-icon-button'

interface Person {
  id: string
  name: string
  email: string | null
  role: string | null
}

interface Feedback {
  id: string
  aboutId: string
  fromId: string
  kind: string
  isPrivate: boolean
  body: string
  createdAt: string
  about: Person
  from: Person
}

interface FeedbackViewClientProps {
  initialFeedback: Feedback[]
  people: Person[]
  currentFilters: {
    fromPersonId?: string
    aboutPersonId?: string
    kind?: string
    isPrivate?: boolean
    startDate?: string
    endDate?: string
  }
  currentUserId?: string
}

export default function FeedbackViewClient({
  initialFeedback,
  people,
  currentFilters,
  currentUserId,
}: FeedbackViewClientProps) {
  const [feedback, setFeedback] = useState(initialFeedback)
  const [filters, setFilters] = useState(currentFilters)
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Refetch data when filters change (but not on initial render)
  useEffect(() => {
    // Skip the initial render since we already have initialFeedback
    const isInitialRender =
      JSON.stringify(filters) === JSON.stringify(currentFilters)
    if (isInitialRender) return

    const fetchFilteredFeedback = async () => {
      setIsLoading(true)
      try {
        const filteredFeedback = await getAllFeedback(filters)
        setFeedback(filteredFeedback)
      } catch (error) {
        console.error('Failed to fetch filtered feedback:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFilteredFeedback()
  }, [filters, currentFilters])

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)

    // Update URL with new filters
    const params = new URLSearchParams(searchParams.toString())

    // Clear existing filter params
    params.delete('fromPersonId')
    params.delete('aboutPersonId')
    params.delete('kind')
    params.delete('isPrivate')
    params.delete('startDate')
    params.delete('endDate')

    // Add new filter params
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value.toString())
      }
    })

    startTransition(() => {
      router.push(`/feedback?${params.toString()}`)
    })
  }

  const clearFilters = () => {
    setFilters({})
    startTransition(() => {
      router.push('/feedback')
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return

    setDeletingId(id)
    try {
      await deleteFeedback(id)
      // Remove the deleted feedback from the local state
      setFeedback(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error('Failed to delete feedback:', error)
      alert('Failed to delete feedback. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getKindColor = (kind: string) => {
    switch (kind) {
      case 'praise':
        return 'bg-green-900/30 text-green-300 border-green-700'
      case 'concern':
        return 'bg-red-900/30 text-red-300 border-red-700'
      case 'note':
        return 'bg-blue-900/30 text-blue-300 border-blue-700'
      default:
        return 'bg-neutral-900/30 text-neutral-300 border-neutral-700'
    }
  }

  const hasActiveFilters = Object.values(filters).some(
    value => value !== undefined && value !== ''
  )

  return (
    <div className='space-y-6'>
      {/* Filters */}
      <div className='card'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold'>Filters</h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className='text-sm text-neutral-400 hover:text-neutral-300 underline'
            >
              Clear all filters
            </button>
          )}
        </div>

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {/* From Person Filter */}
          <div>
            <label
              htmlFor='fromPersonId'
              className='block text-sm font-medium text-neutral-300 mb-1'
            >
              Written by
            </label>
            <select
              id='fromPersonId'
              value={filters.fromPersonId || ''}
              onChange={e =>
                updateFilters({ fromPersonId: e.target.value || undefined })
              }
              className='input'
            >
              <option value=''>All people</option>
              {people.map(person => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>

          {/* About Person Filter */}
          <div>
            <label
              htmlFor='aboutPersonId'
              className='block text-sm font-medium text-neutral-300 mb-1'
            >
              About
            </label>
            <select
              id='aboutPersonId'
              value={filters.aboutPersonId || ''}
              onChange={e =>
                updateFilters({ aboutPersonId: e.target.value || undefined })
              }
              className='input'
            >
              <option value=''>All people</option>
              {people.map(person => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>

          {/* Kind Filter */}
          <div>
            <label
              htmlFor='kind'
              className='block text-sm font-medium text-neutral-300 mb-1'
            >
              Type
            </label>
            <select
              id='kind'
              value={filters.kind || ''}
              onChange={e =>
                updateFilters({ kind: e.target.value || undefined })
              }
              className='input'
            >
              <option value=''>All types</option>
              <option value='praise'>Praise</option>
              <option value='concern'>Concern</option>
              <option value='note'>Note</option>
            </select>
          </div>

          {/* Privacy Filter */}
          <div>
            <label
              htmlFor='isPrivate'
              className='block text-sm font-medium text-neutral-300 mb-1'
            >
              Visibility
            </label>
            <select
              id='isPrivate'
              value={
                filters.isPrivate === undefined
                  ? ''
                  : filters.isPrivate.toString()
              }
              onChange={e => {
                const value = e.target.value
                updateFilters({
                  isPrivate: value === '' ? undefined : value === 'true',
                })
              }}
              className='input'
            >
              <option value=''>All feedback</option>
              <option value='false'>Public only</option>
              <option value='true'>Private only</option>
            </select>
          </div>

          {/* Start Date Filter */}
          <div>
            <label
              htmlFor='startDate'
              className='block text-sm font-medium text-neutral-300 mb-1'
            >
              From date
            </label>
            <input
              id='startDate'
              type='date'
              value={filters.startDate || ''}
              onChange={e =>
                updateFilters({ startDate: e.target.value || undefined })
              }
              className='input'
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label
              htmlFor='endDate'
              className='block text-sm font-medium text-neutral-300 mb-1'
            >
              To date
            </label>
            <input
              id='endDate'
              type='date'
              value={filters.endDate || ''}
              onChange={e =>
                updateFilters({ endDate: e.target.value || undefined })
              }
              className='input'
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className='card'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold'>
            Feedback ({feedback.length})
          </h2>
          {(isPending || isLoading) && (
            <div className='text-sm text-neutral-400'>
              {isLoading ? 'Loading...' : 'Updating...'}
            </div>
          )}
        </div>

        {feedback.length === 0 ? (
          <div className='text-center py-8 text-neutral-400'>
            {hasActiveFilters
              ? 'No feedback matches your filters.'
              : 'No feedback found.'}
          </div>
        ) : (
          <div className='space-y-4'>
            {feedback.map(item => (
              <div
                key={item.id}
                className='p-4 border border-neutral-700 rounded-lg bg-neutral-800/50'
              >
                <div className='flex items-start justify-between mb-3'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-2'>
                      <span className={`badge ${getKindColor(item.kind)}`}>
                        {item.kind}
                      </span>
                      {item.isPrivate && (
                        <span className='badge bg-neutral-700 text-neutral-300'>
                          Private
                        </span>
                      )}
                    </div>

                    <div className='text-sm text-neutral-400 mb-2'>
                      <span className='text-neutral-300'>{item.from.name}</span>{' '}
                      wrote about{' '}
                      <Link
                        href={`/people/${item.about.id}`}
                        className='text-blue-400 hover:text-blue-300'
                      >
                        {item.about.name}
                      </Link>
                    </div>

                    <div className='text-xs text-neutral-500'>
                      {formatDate(item.createdAt)}
                    </div>
                  </div>

                  <div className='flex gap-2'>
                    <Button asChild variant='outline' size='sm'>
                      <Link
                        href={`/feedback/${item.id}`}
                        aria-label='View feedback 2'
                      >
                        <Eye className='w-4 h-4' />
                      </Link>
                    </Button>
                    <EditIconButton
                      href={`/people/${item.about.id}/feedback/${item.id}/edit`}
                      variant='outline'
                      size='sm'
                    />
                    {item.fromId === currentUserId && (
                      <Button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        variant='outline'
                        size='sm'
                        className='text-red-400 hover:text-red-300 border-red-400 hover:border-red-300'
                      >
                        <Trash2 className='w-4 h-4 mr-2' />
                        {deletingId === item.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    )}
                  </div>
                </div>

                <div className='prose prose-invert prose-sm max-w-none text-neutral-200'>
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className='mb-3'>{children}</p>,
                      strong: ({ children }) => (
                        <strong className='font-semibold text-white'>
                          {children}
                        </strong>
                      ),
                      em: ({ children }) => (
                        <em className='italic text-neutral-300'>{children}</em>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          className='text-blue-400 hover:text-blue-300 underline'
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          {children}
                        </a>
                      ),
                      ul: ({ children }) => (
                        <ul className='list-disc list-inside mb-3'>
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className='list-decimal list-inside mb-3'>
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className='mb-1'>{children}</li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className='border-l-4 border-neutral-600 pl-4 italic text-neutral-300 mb-3'>
                          {children}
                        </blockquote>
                      ),
                      code: ({ children }) => (
                        <code className='bg-neutral-700 px-1 py-0.5 rounded text-sm font-mono text-neutral-200'>
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className='bg-neutral-700 p-3 rounded overflow-x-auto mb-3'>
                          {children}
                        </pre>
                      ),
                    }}
                  >
                    {item.body}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
