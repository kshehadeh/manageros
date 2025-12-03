'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { RatingSelector } from '@/components/ui/rating-selector'
import { submitFeedbackResponseByInviteLink } from '@/lib/actions/feedback-campaign'
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { JsonValue } from '@prisma/client/runtime/library'
import { Geist_Mono as GeistMono } from 'next/font/google'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

const geistMono = GeistMono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

interface FeedbackQuestion {
  id: string
  question: string
  type: string
  required: boolean
  options: JsonValue
  sortOrder: number
}

interface FeedbackCampaign {
  id: string
  name?: string | null
  inviteLink: string | null
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
  const [emailValidationError, setEmailValidationError] = useState<
    string | null
  >(null)

  // Validate email against invite list
  const isEmailValid =
    responderEmail.trim() !== '' &&
    campaign.inviteEmails.some(
      email => email.toLowerCase() === responderEmail.toLowerCase().trim()
    )

  useEffect(() => {
    if (responderEmail.trim() === '') {
      setEmailValidationError(null)
      return
    }

    if (isEmailValid) {
      setEmailValidationError(null)
    } else {
      setEmailValidationError(
        'This email address is not authorized to provide feedback for this campaign.'
      )
    }
  }, [responderEmail, isEmailValid])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate email before submitting
    if (!isEmailValid) {
      setEmailValidationError(
        'Please enter an email address that was invited to provide feedback.'
      )
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await submitFeedbackResponseByInviteLink(
        campaign.inviteLink!,
        responderEmail.trim(),
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
          <RatingSelector
            value={currentValue ? Number(currentValue) : null}
            onChange={value => updateResponse(questionId, value)}
            min={1}
            max={5}
            labels={{
              min: 'Poor',
              max: 'Excellent',
            }}
            required={question.required}
          />
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
              question.options.map((option, index) => {
                const optionValue =
                  typeof option === 'string' ? option : String(option)
                return (
                  <div key={index} className='flex items-center gap-md'>
                    <RadioGroupItem
                      value={optionValue}
                      id={`${questionId}-${index}`}
                    />
                    <Label
                      htmlFor={`${questionId}-${index}`}
                      className='text-sm'
                    >
                      {optionValue}
                    </Label>
                  </div>
                )
              })}
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
      <div className='text-center py-2xl'>
        <CheckCircle className='h-16 w-16 text-badge-success mx-auto mb-xl' />
        <h2 className='text-2xl font-bold text-foreground mb-md'>Thank You!</h2>
        <p className='text-muted-foreground'>
          Your feedback has been successfully submitted.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-xl'>
      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className='space-y-md'>
        <Label htmlFor='responderEmail'>Your Email Address</Label>
        <div className='relative'>
          <Input
            id='responderEmail'
            type='email'
            value={responderEmail}
            onChange={e => setResponderEmail(e.target.value)}
            placeholder='Enter your email address'
            required
            className={cn(
              emailValidationError
                ? 'border-destructive pr-10'
                : isEmailValid
                  ? 'border-badge-success pr-10'
                  : 'pr-10'
            )}
          />
          {responderEmail.trim() !== '' && (
            <div className='absolute right-xl top-1/2 -translate-y-1/2'>
              {isEmailValid ? (
                <CheckCircle className='h-5 w-5 text-badge-success' />
              ) : (
                <XCircle className='h-5 w-5 text-destructive' />
              )}
            </div>
          )}
        </div>
        {emailValidationError ? (
          <p className='text-sm text-destructive'>{emailValidationError}</p>
        ) : (
          <p className='text-sm text-muted-foreground'>
            This must match one of the email addresses invited to provide
            feedback.
          </p>
        )}
      </div>

      {campaign.template &&
      campaign.template.questions &&
      campaign.template.questions.length > 0 ? (
        <div className='space-y-xl'>
          {campaign.template.questions.map(question => (
            <div key={question.id} className='space-y-2xl'>
              <Label className={`text-lg font-medium ${geistMono.className}`}>
                {question.question}
                {question.required && (
                  <span className='text-destructive ml-xs'>*</span>
                )}
              </Label>
              {renderQuestion(question)}
            </div>
          ))}
        </div>
      ) : (
        <div className='space-y-2xl'>
          <Label className={`text-lg font-medium ${geistMono.className}`}>
            General Feedback
            <span className='text-destructive ml-xs'>*</span>
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

      <Separator />

      <div className='pt-xl'>
        <Button
          type='submit'
          disabled={isSubmitting || !isEmailValid}
          className='w-full'
        >
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
