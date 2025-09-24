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
        size='sm'
        onClick={() => setIsModalOpen(true)}
        className='flex items-center gap-2'
        title='Report a bug'
      >
        <Bug className='h-4 w-4' />
        <span className='hidden sm:inline'>Report Bug</span>
      </Button>

      <BugSubmissionModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  )
}
