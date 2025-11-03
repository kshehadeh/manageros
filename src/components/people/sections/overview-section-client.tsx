'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PersonOverviewModal } from '@/components/person-overview-modal'
import { PersonOverviewDisplayModal } from '@/components/person-overview-display-modal'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import { Plus, RefreshCw, Sparkles } from 'lucide-react'

interface OverviewSectionClientProps {
  personId: string
  personName: string
  canGenerate: boolean
  hasOverview: boolean
  overviewContent?: string
  overviewUpdatedAt?: string
  overviewFromDate?: string
  overviewToDate?: string
  overviewLookbackDays?: number
  children: React.ReactNode
}

export function OverviewSectionClient({
  personId,
  personName,
  canGenerate,
  hasOverview,
  overviewContent,
  overviewUpdatedAt,
  overviewFromDate,
  overviewToDate,
  overviewLookbackDays,
  children,
}: OverviewSectionClientProps) {
  const router = useRouter()
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [isDisplayModalOpen, setIsDisplayModalOpen] = useState(false)

  const handleGenerateModalClose = () => {
    setIsGenerateModalOpen(false)
  }

  const handleSuccess = () => {
    // Refresh the server component data to show the new overview
    router.refresh()
    handleGenerateModalClose()
  }

  return (
    <>
      <SectionHeader
        icon={Sparkles}
        title='AI Overview'
        action={
          canGenerate ? (
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsGenerateModalOpen(true)}
              title={hasOverview ? 'Refresh Overview' : 'Generate Overview'}
            >
              {hasOverview ? (
                <RefreshCw className='w-4 h-4' />
              ) : (
                <Plus className='w-4 h-4' />
              )}
            </Button>
          ) : undefined
        }
      />

      <div onClick={() => hasOverview && setIsDisplayModalOpen(true)}>
        {children}
      </div>

      <PersonOverviewModal
        personId={personId}
        personName={personName}
        isOpen={isGenerateModalOpen}
        onClose={handleGenerateModalClose}
        onSuccess={handleSuccess}
      />

      {hasOverview && overviewContent && overviewUpdatedAt && (
        <PersonOverviewDisplayModal
          personName={personName}
          content={overviewContent}
          updatedAt={overviewUpdatedAt}
          fromDate={overviewFromDate}
          toDate={overviewToDate}
          lookbackDays={overviewLookbackDays}
          isOpen={isDisplayModalOpen}
          onClose={() => setIsDisplayModalOpen(false)}
        />
      )}
    </>
  )
}
