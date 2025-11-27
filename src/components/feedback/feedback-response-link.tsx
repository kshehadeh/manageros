'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'

interface FeedbackResponseLinkProps {
  inviteLink: string
  startDate: Date
  endDate: Date
}

export function FeedbackResponseLink({
  inviteLink,
  startDate,
  endDate,
}: FeedbackResponseLinkProps) {
  const [origin, setOrigin] = useState<string>('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const copyToClipboard = () => {
    const fullUrl = `${origin}/feedback-form/${inviteLink}`
    // navigator.clipboard.writeText() returns a Promise, so we handle it without async/await
    navigator.clipboard.writeText(fullUrl).catch(error => {
      console.error('Failed to copy link:', error)
    })
  }

  if (!origin) {
    return null
  }

  return (
    <div className='space-y-4'>
      <div>
        <span className='text-sm font-medium text-muted-foreground'>
          Share this link with people to collect feedback:
        </span>
        <div className='mt-2 flex items-center gap-2'>
          <div className='flex-1 p-3 bg-muted rounded-md border'>
            <code className='text-sm break-all'>
              {`${origin}/feedback-form/${inviteLink}`}
            </code>
          </div>
          <Button variant='outline' size='sm' onClick={copyToClipboard}>
            <Copy className='h-4 w-4' />
          </Button>
        </div>
      </div>
      <div className='text-xs text-muted-foreground'>
        <div className='flex items-center gap-1'>
          <span>
            This link will be active from {startDate.toLocaleDateString()} to{' '}
            {endDate.toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  )
}
