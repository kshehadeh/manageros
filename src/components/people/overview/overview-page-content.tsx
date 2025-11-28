'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { ArrowLeft, Sparkles, RefreshCw, Copy, Check } from 'lucide-react'
import { PersonOverviewModal } from '@/components/person-overview-modal'
import Markdown from 'react-markdown'
import { toast } from 'sonner'

interface OverviewPageContentProps {
  personId: string
  personName: string
  canGenerate: boolean
  hasOverview: boolean
  overviewContent?: string
  overviewUpdatedAt?: string
  overviewFromDate?: string
  overviewToDate?: string
  overviewLookbackDays?: number
}

export function OverviewPageContent({
  personId,
  personName,
  canGenerate,
  hasOverview,
  overviewContent,
  overviewUpdatedAt,
  overviewFromDate,
  overviewToDate,
  overviewLookbackDays = 30,
}: OverviewPageContentProps) {
  const router = useRouter()
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const handleGenerateModalClose = () => {
    setIsGenerateModalOpen(false)
  }

  const handleSuccess = () => {
    router.refresh()
    handleGenerateModalClose()
  }

  const handleCopy = async () => {
    if (!overviewContent) return
    try {
      await navigator.clipboard.writeText(overviewContent)
      setIsCopied(true)
      toast.success('Overview copied to clipboard')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy overview:', error)
      toast.error('Failed to copy overview')
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title='AI Overview'
        titleIcon={Sparkles}
        subtitle={`AI-generated professional overview for ${personName}`}
        actions={
          <div className='flex items-center gap-2'>
            {canGenerate && (
              <Button
                variant='outline'
                onClick={() => setIsGenerateModalOpen(true)}
              >
                {hasOverview ? (
                  <>
                    <RefreshCw className='w-4 h-4 mr-2' />
                    Regenerate
                  </>
                ) : (
                  <>
                    <Sparkles className='w-4 h-4 mr-2' />
                    Generate
                  </>
                )}
              </Button>
            )}
            <Button asChild variant='outline'>
              <Link
                href={`/people/${personId}`}
                className='flex items-center gap-2'
              >
                <ArrowLeft className='w-4 h-4' />
                Back to Profile
              </Link>
            </Button>
          </div>
        }
      />

      <PageContent>
        <PageMain>
          {!hasOverview ? (
            <div className='text-center py-12 text-muted-foreground'>
              <Sparkles className='w-12 h-12 mx-auto mb-4 opacity-50' />
              <p className='text-lg font-medium mb-2'>
                No AI overview generated yet
              </p>
              <p className='text-sm mb-6'>
                Generate a comprehensive professional overview that includes
                role, initiatives, tasks, and feedback highlights.
              </p>
              {canGenerate && (
                <Button onClick={() => setIsGenerateModalOpen(true)}>
                  <Sparkles className='w-4 h-4 mr-2' />
                  Generate Overview
                </Button>
              )}
            </div>
          ) : (
            <div className='space-y-6'>
              {/* Overview content */}
              <div className='bg-card border rounded-lg p-6'>
                <div className='prose prose-sm dark:prose-invert max-w-none'>
                  <div className='text-sm whitespace-pre-wrap leading-relaxed'>
                    <Markdown>{overviewContent}</Markdown>
                  </div>
                </div>
              </div>

              {/* Metadata and actions */}
              <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-xs text-muted-foreground'>
                <div className='space-y-1'>
                  {overviewUpdatedAt && (
                    <div>
                      Last updated:{' '}
                      {new Date(overviewUpdatedAt).toLocaleDateString()} at{' '}
                      {new Date(overviewUpdatedAt).toLocaleTimeString()}
                    </div>
                  )}
                  {overviewFromDate && overviewToDate ? (
                    <div>
                      Period: {new Date(overviewFromDate).toLocaleDateString()}{' '}
                      - {new Date(overviewToDate).toLocaleDateString()} (
                      {overviewLookbackDays} day
                      {overviewLookbackDays !== 1 ? 's' : ''})
                    </div>
                  ) : (
                    <div>
                      Lookback period: Last {overviewLookbackDays} day
                      {overviewLookbackDays !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleCopy}
                  className='flex items-center gap-2'
                >
                  {isCopied ? (
                    <>
                      <Check className='w-4 h-4' />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className='w-4 h-4' />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </PageMain>
      </PageContent>

      <PersonOverviewModal
        personId={personId}
        personName={personName}
        isOpen={isGenerateModalOpen}
        onClose={handleGenerateModalClose}
        onSuccess={handleSuccess}
      />
    </PageContainer>
  )
}
