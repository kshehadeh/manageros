'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { getAllFeedback } from '@/lib/actions/feedback'
import { FeedbackTable } from './feedback-table'

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
  currentUserId,
}: FeedbackViewClientProps) {
  const [feedback, setFeedback] = useState(initialFeedback)
  const searchParams = useSearchParams()

  // Refetch data when URL params change
  useEffect(() => {
    const fetchFilteredFeedback = async () => {
      try {
        const urlFilters = {
          fromPersonId: searchParams.get('fromPersonId') || undefined,
          aboutPersonId: searchParams.get('aboutPersonId') || undefined,
          kind: searchParams.get('kind') || undefined,
          isPrivate:
            searchParams.get('isPrivate') === 'true'
              ? true
              : searchParams.get('isPrivate') === 'false'
                ? false
                : undefined,
          startDate: searchParams.get('startDate') || undefined,
          endDate: searchParams.get('endDate') || undefined,
        }

        const filteredFeedback = await getAllFeedback(urlFilters)
        setFeedback(filteredFeedback)
      } catch (error) {
        console.error('Failed to fetch filtered feedback:', error)
      }
    }
    fetchFilteredFeedback()
  }, [searchParams])

  const handleRefresh = async () => {
    try {
      const currentParams = {
        fromPersonId: searchParams.get('fromPersonId') || undefined,
        aboutPersonId: searchParams.get('aboutPersonId') || undefined,
        kind: searchParams.get('kind') || undefined,
        isPrivate:
          searchParams.get('isPrivate') === 'true'
            ? true
            : searchParams.get('isPrivate') === 'false'
              ? false
              : undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
      }

      const refreshedFeedback = await getAllFeedback(currentParams)
      setFeedback(refreshedFeedback)
    } catch (error) {
      console.error('Failed to refresh feedback:', error)
    }
  }

  return (
    <FeedbackTable
      feedback={feedback}
      people={people}
      currentUserId={currentUserId}
      onRefresh={handleRefresh}
    />
  )
}
