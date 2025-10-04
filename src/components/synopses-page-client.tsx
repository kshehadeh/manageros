'use client'

import { useState } from 'react'
import { SynopsisGenerationModal } from '@/components/synopsis-generation-modal'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface SynopsesPageClientProps {
  personId: string
  personName: string
  canGenerate: boolean
  children: React.ReactNode
}

export function SynopsesPageClient({
  personId,
  personName,
  canGenerate,
  children,
}: SynopsesPageClientProps) {
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
      <div className='flex items-center justify-between mb-6'>
        <div className='text-sm text-muted-foreground'>{children}</div>
        {canGenerate && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className='w-4 h-4 mr-2' />
            Generate New Synopsis
          </Button>
        )}
      </div>

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
