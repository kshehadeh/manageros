'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  FileText,
} from 'lucide-react'
import { PersonOverviewModal } from '@/components/person-overview-modal'
import { JiraActivityAISection } from '@/components/people/sections/jira-activity-ai-section'
import { GithubActivityAISection } from '@/components/people/sections/github-activity-ai-section'
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
  hasJiraAccount?: boolean
  hasGithubAccount?: boolean
}

export function OverviewPageContent({
  personId,
  personName,
  canGenerate,
  hasOverview,
  overviewContent,
  overviewUpdatedAt,
  overviewLookbackDays = 30,
  hasJiraAccount = false,
  hasGithubAccount = false,
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
        title='AI Insights'
        titleIcon={Sparkles}
        subtitle={`AI-generated insights for ${personName}`}
        actions={
          <Button asChild variant='outline'>
            <Link
              href={`/people/${personId}`}
              className='flex items-center gap-2'
            >
              <ArrowLeft className='w-4 h-4' />
              Back to Profile
            </Link>
          </Button>
        }
      />

      <PageContent>
        <PageMain>
          <div className='flex gap-lg flex-wrap space-y-6'>
            {/* Person Overview Section */}
            <PageSection
              className='flex-1 min-w-[300px] gap-lg'
              header={
                <SectionHeader
                  icon={FileText}
                  title='Person Overview'
                  description={
                    overviewUpdatedAt
                      ? `Generated: ${new Date(overviewUpdatedAt).toLocaleString()}`
                      : undefined
                  }
                  action={
                    <div className='flex items-center gap-1'>
                      {hasOverview && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={handleCopy}
                          title='Copy to clipboard'
                        >
                          {isCopied ? (
                            <Check className='w-4 h-4' />
                          ) : (
                            <Copy className='w-4 h-4' />
                          )}
                        </Button>
                      )}
                      {canGenerate && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => setIsGenerateModalOpen(true)}
                          title={
                            hasOverview
                              ? 'Regenerate Overview'
                              : 'Generate Overview'
                          }
                        >
                          {hasOverview ? (
                            <RefreshCw className='w-4 h-4' />
                          ) : (
                            <Sparkles className='w-4 h-4' />
                          )}
                        </Button>
                      )}
                    </div>
                  }
                />
              }
            >
              {!hasOverview ? (
                <div className='text-sm text-muted-foreground'>
                  Click the button to generate a factual overview of this
                  person&apos;s role, initiatives, tasks, and feedback.
                </div>
              ) : (
                <div className='prose prose-sm dark:prose-invert max-w-none'>
                  <div className='text-sm whitespace-pre-wrap leading-relaxed'>
                    <Markdown>{overviewContent}</Markdown>
                  </div>
                </div>
              )}
            </PageSection>

            {/* Integration Activity AI Sections */}
            {hasJiraAccount && (
              <JiraActivityAISection
                personId={personId}
                lookbackDays={overviewLookbackDays}
              />
            )}
            {hasGithubAccount && (
              <GithubActivityAISection
                personId={personId}
                lookbackDays={overviewLookbackDays}
              />
            )}
          </div>
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
