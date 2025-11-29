'use client'

import { useState, useEffect } from 'react'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, RefreshCw, Github, Copy, Check } from 'lucide-react'
import {
  generateGithubActivitySummary,
  getLatestGithubActivitySummary,
} from '@/lib/actions/person-overview'
import { toast } from 'sonner'
import Markdown from 'react-markdown'

interface GithubActivityAISectionProps {
  personId: string
  lookbackDays?: number
}

interface Summary {
  id: string
  content: string
  createdAt: string
}

export function GithubActivityAISection({
  personId,
  lookbackDays = 30,
}: GithubActivityAISectionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingExisting, setIsLoadingExisting] = useState(true)
  const [isCopied, setIsCopied] = useState(false)
  const [summary, setSummary] = useState<Summary | null>(null)

  // Load existing summary on mount
  useEffect(() => {
    async function loadExisting() {
      try {
        const existing = await getLatestGithubActivitySummary(personId)
        if (existing) {
          setSummary({
            id: existing.id,
            content: existing.content,
            createdAt: existing.createdAt,
          })
        }
      } catch (error) {
        console.error('Error loading existing GitHub summary:', error)
      } finally {
        setIsLoadingExisting(false)
      }
    }
    loadExisting()
  }, [personId])

  const handleGenerate = async () => {
    setIsLoading(true)
    try {
      const result = await generateGithubActivitySummary(personId, {
        lookbackDays,
      })
      if (result.success) {
        setSummary(result.summary)
        toast.success('GitHub activity summary generated')
      } else {
        toast.info(result.error)
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to generate GitHub summary'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!summary?.content) return
    try {
      await navigator.clipboard.writeText(summary.content)
      setIsCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy')
    }
  }

  if (isLoadingExisting) {
    return (
      <PageSection
        className='flex-1 min-w-[300px]'
        header={
          <SectionHeader icon={Github} title='GitHub Activity Analysis' />
        }
      >
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Loader2 className='w-4 h-4 animate-spin' />
          Loading...
        </div>
      </PageSection>
    )
  }

  return (
    <PageSection
      className='flex-1 min-w-[300px]'
      header={
        <SectionHeader
          icon={Github}
          title='GitHub Activity Analysis'
          description={
            summary
              ? `Generated: ${new Date(summary.createdAt).toLocaleString()}`
              : undefined
          }
          action={
            <div className='flex items-center gap-1'>
              {summary && (
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
              <Button
                variant='outline'
                size='sm'
                onClick={handleGenerate}
                disabled={isLoading}
                title={summary ? 'Regenerate Analysis' : 'Generate Analysis'}
              >
                {isLoading ? (
                  <Loader2 className='w-4 h-4 animate-spin' />
                ) : summary ? (
                  <RefreshCw className='w-4 h-4' />
                ) : (
                  <Sparkles className='w-4 h-4' />
                )}
              </Button>
            </div>
          }
        />
      }
    >
      {!summary ? (
        <div className='text-sm text-muted-foreground'>
          Click the button to generate an AI analysis of GitHub activity from
          the last {lookbackDays} days.
        </div>
      ) : (
        <div className='prose prose-sm dark:prose-invert max-w-none'>
          <div className='text-sm whitespace-pre-wrap leading-relaxed'>
            <Markdown>{summary.content}</Markdown>
          </div>
        </div>
      )}
    </PageSection>
  )
}
