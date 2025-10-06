'use client'

import { useState, useEffect } from 'react'
import { GithubPrsActivityTable } from './github-prs-activity-table'
import { fetchGithubPullRequests } from '@/lib/actions/github'
import { SectionHeader } from '@/components/ui/section-header'
import { Button } from '@/components/ui/button'
import { FaGithub } from 'react-icons/fa'

interface GithubPrsActivitySectionProps {
  personId: string
  personName: string
  hasGithubAccount: boolean
}

export function GithubPrsActivitySection({
  personId,
  personName,
  hasGithubAccount,
}: GithubPrsActivitySectionProps) {
  const [hasPrActivity, setHasPrActivity] = useState<boolean | null>(null)
  const [daysBack, setDaysBack] = useState(30)
  const [isFetching, setIsFetching] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleRefresh = async () => {
    setIsFetching(true)
    try {
      const result = await fetchGithubPullRequests(personId, daysBack)
      if (result.success && result.pullRequests) {
        setHasPrActivity(result.pullRequests.length > 0)
        setRefreshTrigger(prev => prev + 1)
      }
    } catch {
      // Error handling is done in the table component
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    const checkPrActivity = async () => {
      if (!hasGithubAccount) {
        setHasPrActivity(false)
        return
      }

      try {
        const result = await fetchGithubPullRequests(personId, 30)
        if (result.success && result.pullRequests) {
          setHasPrActivity(result.pullRequests.length > 0)
        } else {
          setHasPrActivity(false)
        }
      } catch {
        setHasPrActivity(false)
      }
    }

    checkPrActivity()
  }, [personId, hasGithubAccount, daysBack])

  // Don't render anything while checking or if no PR activity
  if (hasPrActivity === null || !hasPrActivity) {
    return null
  }

  const headerActions = [
    <select
      key='days-back'
      value={daysBack}
      onChange={e => setDaysBack(Number(e.target.value))}
      className='input'
    >
      <option value={7}>Last 7 days</option>
      <option value={30}>Last 30 days</option>
      <option value={90}>Last 90 days</option>
    </select>,
    <Button
      key='refresh'
      type='button'
      onClick={handleRefresh}
      disabled={isFetching}
      variant='outline'
    >
      {isFetching ? 'Fetching...' : 'Refresh'}
    </Button>,
  ]

  return (
    <section>
      <SectionHeader
        icon={FaGithub}
        title='GitHub Activity'
        action={headerActions}
      />
      <GithubPrsActivityTable
        personId={personId}
        personName={personName}
        hasGithubAccount={hasGithubAccount}
        daysBack={daysBack}
        refreshTrigger={refreshTrigger}
      />
    </section>
  )
}
