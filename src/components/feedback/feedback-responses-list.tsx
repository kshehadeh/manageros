'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { FeedbackResponseDetail } from './feedback-response-detail'
import { Users } from 'lucide-react'

interface FeedbackQuestion {
  id: string
  question: string
  type: string
  required: boolean
  options: unknown
  sortOrder: number
}

interface FeedbackResponse {
  id: string
  responderEmail: string
  responses: unknown | null
  submittedAt: Date
}

interface FeedbackResponsesListProps {
  responses: FeedbackResponse[]
  questions: FeedbackQuestion[]
}

export function FeedbackResponsesList({
  responses,
  questions,
}: FeedbackResponsesListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredResponses = useMemo(() => {
    if (!searchQuery.trim()) return responses

    const query = searchQuery.toLowerCase().trim()
    if (!query) return responses

    return responses.filter(response => {
      // Search through response values (the actual answers)
      if (response.responses) {
        try {
          // Handle different JSON formats - could be object, array, or parsed JSON
          let responseValues: Record<string, unknown>

          if (typeof response.responses === 'string') {
            // If it's a string, try to parse it
            responseValues = JSON.parse(response.responses) as Record<
              string,
              unknown
            >
          } else if (
            typeof response.responses === 'object' &&
            response.responses !== null
          ) {
            responseValues = response.responses as Record<string, unknown>
          } else {
            return false
          }

          // Search through all response values
          const hasMatch = Object.entries(responseValues).some(
            ([questionId, value]) => {
              if (value === null || value === undefined) return false

              // Check the actual answer value
              const valueStr = String(value).toLowerCase()
              if (valueStr.includes(query)) return true

              // Also check if the question text matches
              const question = questions.find(q => q.id === questionId)
              if (question) {
                const questionText = question.question.toLowerCase()
                if (questionText.includes(query)) return true
              }

              return false
            }
          )

          if (hasMatch) return true
        } catch {
          // If parsing fails, try string search on the whole response object
          const responseStr = JSON.stringify(response.responses).toLowerCase()
          if (responseStr.includes(query)) return true
        }
      }

      // Search through question text for responses that have answers
      const matchingQuestions = questions.filter(q =>
        q.question.toLowerCase().includes(query)
      )
      if (matchingQuestions.length > 0) {
        try {
          let responseValues: Record<string, unknown> | null = null

          if (typeof response.responses === 'string') {
            responseValues = JSON.parse(response.responses) as Record<
              string,
              unknown
            >
          } else if (
            typeof response.responses === 'object' &&
            response.responses !== null
          ) {
            responseValues = response.responses as Record<string, unknown>
          }

          return matchingQuestions.some(q => {
            if (!responseValues) return false
            const value = responseValues[q.id]
            return value !== undefined && value !== null && value !== ''
          })
        } catch {
          return false
        }
      }

      return false
    })
  }, [responses, questions, searchQuery])

  if (responses.length === 0) {
    return (
      <div className='text-center py-12'>
        <Users className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
        <h3 className='text-lg font-medium text-foreground mb-2'>
          No responses yet
        </h3>
        <p className='text-muted-foreground'>
          Responses will appear here once people start submitting feedback.
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10' />
          <Input
            placeholder='Search responses...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='pl-9'
          />
        </div>
        {searchQuery && (
          <div className='text-sm text-muted-foreground whitespace-nowrap'>
            {filteredResponses.length} of {responses.length} responses
          </div>
        )}
      </div>

      {filteredResponses.length === 0 ? (
        <div className='text-center py-12'>
          <Search className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
          <h3 className='text-lg font-medium text-foreground mb-2'>
            No responses found
          </h3>
          <p className='text-muted-foreground'>
            Try adjusting your search query.
          </p>
        </div>
      ) : (
        <div className='space-y-6'>
          {filteredResponses.map(
            response =>
              response && (
                <FeedbackResponseDetail
                  key={response.id}
                  response={response}
                  questions={questions}
                />
              )
          )}
        </div>
      )}
    </div>
  )
}
