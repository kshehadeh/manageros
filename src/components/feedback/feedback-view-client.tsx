'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getAllFeedback, deleteFeedback } from '@/lib/actions'
import { FeedbackListItem } from './feedback-list-item'

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
              className='text-sm text-muted-foreground hover:text-foreground underline'
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
              className='block text-sm font-medium text-foreground mb-1'
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
              className='block text-sm font-medium text-foreground mb-1'
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
              className='block text-sm font-medium text-foreground mb-1'
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
              className='block text-sm font-medium text-foreground mb-1'
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
              className='block text-sm font-medium text-foreground mb-1'
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
              className='block text-sm font-medium text-foreground mb-1'
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
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-foreground'>
            Feedback ({feedback.length})
          </h2>
          {(isPending || isLoading) && (
            <div className='text-sm text-muted-foreground'>
              {isLoading ? 'Loading...' : 'Updating...'}
            </div>
          )}
        </div>

        {feedback.length === 0 ? (
          <div className='text-center py-8 text-muted-foreground'>
            {hasActiveFilters
              ? 'No feedback matches your filters.'
              : 'No feedback found.'}
          </div>
        ) : (
          <div className='space-y-4'>
            {feedback.map(item => (
              <FeedbackListItem
                key={item.id}
                feedback={item}
                currentUserId={currentUserId}
                onDelete={handleDelete}
                isDeleting={deletingId === item.id}
                showAboutPerson={true}
                variant='default'
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
