'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { submitFeedbackResponseByInviteLink } from '@/lib/actions/feedback-campaign'
import { CheckCircle, AlertCircle } from 'lucide-react'

interface FeedbackQuestion {
  id: string
  question: string
  type: string
  required: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: any
  sortOrder: number
}

interface FeedbackCampaign {
  id: string
  inviteLink: string | null
  targetPerson: {
    id: string
    name: string
    email: string | null
  }
  template: {
    id: string
    name: string
    description: string | null
    questions: FeedbackQuestion[]
  } | null
  startDate: Date
  endDate: Date
  inviteEmails: string[]
}

interface FeedbackSubmissionFormProps {
  campaign: FeedbackCampaign
}

export function FeedbackSubmissionForm({
  campaign,
}: FeedbackSubmissionFormProps) {
  const [responderEmail, setResponderEmail] = useState('')
  const [responses, setResponses] = useState<Record<string, string | number>>(
    {}
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await submitFeedbackResponseByInviteLink(
        campaign.inviteLink!,
        responderEmail,
        responses
      )
      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateResponse = (questionId: string, value: string | number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const renderQuestion = (question: FeedbackQuestion) => {
    const questionId = question.id
    const currentValue = responses[questionId]

    switch (question.type) {
      case 'text':
        return (
          <Textarea
            value={currentValue || ''}
            onChange={e => updateResponse(questionId, e.target.value)}
            placeholder='Enter your feedback...'
            className='min-h-[100px]'
            required={question.required}
          />
        )

      case 'rating':
        return (
          <RadioGroup
            value={currentValue ? String(currentValue) : ''}
            onValueChange={value => updateResponse(questionId, value)}
            required={question.required}
          >
            <div className='flex justify-between'>
              {[1, 2, 3, 4, 5].map(rating => (
                <div key={rating} className='flex items-center space-x-2'>
                  <RadioGroupItem
                    value={rating.toString()}
                    id={`${questionId}-${rating}`}
                  />
                  <Label
                    htmlFor={`${questionId}-${rating}`}
                    className='text-sm'
                  >
                    {rating}
                  </Label>
                </div>
              ))}
            </div>
            <div className='flex justify-between text-xs text-muted-foreground mt-1'>
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </RadioGroup>
        )

      case 'multiple_choice':
        return (
          <RadioGroup
            value={currentValue ? String(currentValue) : ''}
            onValueChange={value => updateResponse(questionId, value)}
            required={question.required}
          >
            {question.options &&
              Array.isArray(question.options) &&
              question.options.map((option, index) => (
                <div key={index} className='flex items-center space-x-2'>
                  <RadioGroupItem
                    value={option}
                    id={`${questionId}-${index}`}
                  />
                  <Label htmlFor={`${questionId}-${index}`} className='text-sm'>
                    {option}
                  </Label>
                </div>
              ))}
          </RadioGroup>
        )

      default:
        return (
          <Textarea
            value={currentValue || ''}
            onChange={e => updateResponse(questionId, e.target.value)}
            placeholder='Enter your feedback...'
            className='min-h-[100px]'
            required={question.required}
          />
        )
    }
  }

  if (isSubmitted) {
    return (
      <div className='text-center py-8'>
        <CheckCircle className='h-16 w-16 text-badge-success mx-auto mb-4' />
        <h2 className='text-2xl font-bold text-foreground mb-2'>Thank You!</h2>
        <p className='text-muted-foreground'>
          Your feedback has been successfully submitted.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {error && (
        <div className='p-4 bg-destructive/10 border border-destructive/20 rounded-md'>
          <div className='flex'>
            <AlertCircle className='h-5 w-5 text-destructive' />
            <div className='ml-3'>
              <p className='text-sm text-destructive'>{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className='space-y-2'>
        <Label htmlFor='responderEmail'>Your Email Address</Label>
        <Input
          id='responderEmail'
          type='email'
          value={responderEmail}
          onChange={e => setResponderEmail(e.target.value)}
          placeholder='Enter your email address'
          required
        />
        <p className='text-sm text-muted-foreground'>
          This must match one of the email addresses invited to provide
          feedback.
        </p>
      </div>

      {campaign.template &&
      campaign.template.questions &&
      campaign.template.questions.length > 0 ? (
        <div className='space-y-6'>
          {campaign.template.questions.map((question, index) => (
            <div key={question.id} className='space-y-3'>
              <Label className='text-base font-medium'>
                {index + 1}. {question.question}
                {question.required && (
                  <span className='text-destructive ml-1'>*</span>
                )}
              </Label>
              {renderQuestion(question)}
            </div>
          ))}
        </div>
      ) : (
        <div className='space-y-3'>
          <Label className='text-base font-medium'>
            General Feedback
            <span className='text-destructive ml-1'>*</span>
          </Label>
          <Textarea
            value={responses['general'] || ''}
            onChange={e => updateResponse('general', e.target.value)}
            placeholder='Please provide your feedback about this person...'
            className='min-h-[150px]'
            required
          />
        </div>
      )}

      <div className='pt-4'>
        <Button type='submit' disabled={isSubmitting} className='w-full'>
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </div>

      <div className='text-xs text-muted-foreground text-center'>
        <p>
          This feedback will be shared with the person&apos;s manager and used
          for professional development purposes.
        </p>
      </div>
    </form>
  )
}
