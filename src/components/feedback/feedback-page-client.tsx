'use client'

import { MessageCircle } from 'lucide-react'
import { FeedbackDataTable } from './data-table'

export function FeedbackPageClient() {
  return (
    <div className='page-container'>
      <div className='page-header'>
        <div className='flex items-center gap-3 mb-2'>
          <MessageCircle className='h-6 w-6 text-muted-foreground' />
          <h1 className='page-title'>Feedback</h1>
        </div>
        <p className='page-subtitle'>
          View and filter feedback across your organization. You can see all
          public feedback and any private feedback you&apos;ve written.
        </p>
      </div>

      <FeedbackDataTable />
    </div>
  )
}
