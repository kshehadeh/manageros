'use client'

import { useState } from 'react'
import { SynopsisGenerationModal } from '@/components/synopsis-generation-modal'
import { Button } from '@/components/ui/button'
import { Eye, Plus } from 'lucide-react'
import Link from 'next/link'

interface SynopsisSectionClientProps {
  personId: string
  personName: string
  canGenerate: boolean
  children: React.ReactNode
}

export function SynopsisSectionClient({
  personId,
  personName,
  canGenerate,
  children,
}: SynopsisSectionClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const handleSuccess = () => {
    // Refresh the page to show the new synopsis
    window.location.reload()
  }

  return (
    <>
      <div className='flex items-center justify-between mb-3'>
        <h3 className='font-bold flex items-center gap-2'>
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
            />
          </svg>
          Synopses
        </h3>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' asChild title='View All Synopses'>
            <Link href={`/people/${personId}/synopses`}>
              <Eye className='w-4 h-4' />
            </Link>
          </Button>
          {canGenerate && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsModalOpen(true)}
              title='Add New Synopsis'
            >
              <Plus className='w-4 h-4' />
            </Button>
          )}
        </div>
      </div>

      {children}

      <SynopsisGenerationModal
        personId={personId}
        personName={personName}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />
    </>
  )
}
