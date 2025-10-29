'use client'

import { Badge } from '@/components/ui/badge'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { JsonValue } from '@prisma/client/runtime/library'
import { formatDistanceToNow } from 'date-fns'

interface FeedbackQuestion {
  id: string
  question: string
  type: string
  required: boolean
  options: JsonValue
  sortOrder: number
}

interface FeedbackResponse {
  id: string
  responderEmail: string
  responses: JsonValue | null
  submittedAt: Date
}

interface FeedbackResponseDetailProps {
  response: FeedbackResponse
  questions: FeedbackQuestion[]
}

export function FeedbackResponseDetail({
  response,
  questions,
}: FeedbackResponseDetailProps) {
  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'success'
    if (rating >= 3) return 'warning'
    return 'error'
  }

  const renderResponse = (questionId: string, value: string | number) => {
    const question = questions.find(q => q.id === questionId)
    if (!question) return null

    switch (question.type) {
      case 'rating': {
        const rating = Number(value)
        return (
          <div className='flex items-center gap-2'>
            <Badge variant={getRatingColor(rating)}>{rating}/5</Badge>
            <span className='text-sm text-muted-foreground'>
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Below Average'}
              {rating === 3 && 'Average'}
              {rating === 4 && 'Good'}
              {rating === 5 && 'Excellent'}
            </span>
          </div>
        )
      }
      case 'multiple_choice':
        return <Badge variant='outline'>{String(value)}</Badge>

      case 'text':
        return (
          <ReadonlyNotesField
            content={String(value)}
            variant='compact'
            emptyStateText='No response provided'
          />
        )

      default:
        return <span>{String(value)}</span>
    }
  }

  return (
    <div className='border rounded-lg p-6 space-y-4'>
      <div className='flex items-center justify-between pb-3 border-b'>
        <h3 className='text-lg font-semibold'>Anonymous Response</h3>
        <Badge variant='outline' className='text-xs'>
          {formatDistanceToNow(response.submittedAt, { addSuffix: true })}
        </Badge>
      </div>
      <div className='space-y-4'>
        {questions.map((question, index) => {
          const responses = response.responses as Record<
            string,
            string | number
          > | null
          const responseValue = responses?.[question.id]
          if (responseValue === undefined || responseValue === '') return null

          return (
            <div key={question.id} className='space-y-2'>
              <div className='flex items-start gap-2'>
                <span className='text-sm font-medium text-muted-foreground min-w-[20px]'>
                  {index + 1}.
                </span>
                <div className='flex-1 space-y-2'>
                  <h4 className='font-medium text-foreground'>
                    {question.question}
                    {question.required && (
                      <span className='text-destructive ml-1'>*</span>
                    )}
                  </h4>
                  <div className='pl-4'>
                    {renderResponse(question.id, responseValue)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
