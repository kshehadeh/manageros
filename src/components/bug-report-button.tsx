'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BugSubmissionModal } from '@/components/bug-submission-modal'
import { Bug } from 'lucide-react'

export function BugReportButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button
        variant='outline'
        size='icon'
        onClick={() => setIsModalOpen(true)}
        title='Report a bug'
        aria-label='Report a bug'
      >
        <Bug className='h-4 w-4' />
      </Button>

      <BugSubmissionModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  )
}
