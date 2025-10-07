'use client'

import { useState } from 'react'
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
  currentUserId?: string
}

export default function FeedbackViewClient({
  initialFeedback,
  people,
  currentUserId,
}: FeedbackViewClientProps) {
  const [feedback, setFeedback] = useState(initialFeedback)

  const handleRefresh = async () => {
    try {
      const refreshedFeedback = await getAllFeedback()
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
