'use client'

import { useState, useEffect } from 'react'
import { JiraWorkActivityTable } from './jira-work-activity-table'
import { fetchJiraAssignedTickets } from '@/lib/actions/jira'
import { SectionHeader } from '@/components/ui/section-header'
import { Button } from '@/components/ui/button'
import { FaJira } from 'react-icons/fa'

interface JiraWorkActivitySectionProps {
  personId: string
  personName: string
  hasJiraAccount: boolean
}

export function JiraWorkActivitySection({
  personId,
  personName,
  hasJiraAccount,
}: JiraWorkActivitySectionProps) {
  const [hasWorkActivity, setHasWorkActivity] = useState<boolean | null>(null)
  const [daysBack, setDaysBack] = useState(30)
  const [isFetching, setIsFetching] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleRefresh = async () => {
    setIsFetching(true)
    try {
      const result = await fetchJiraAssignedTickets(personId, daysBack)
      if (result.success) {
        setHasWorkActivity(result.tickets.length > 0)
        setRefreshTrigger(prev => prev + 1)
      }
    } catch {
      // Error handling is done in the table component
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    const checkWorkActivity = async () => {
      if (!hasJiraAccount) {
        setHasWorkActivity(false)
        return
      }

      try {
        const result = await fetchJiraAssignedTickets(personId, 30)
        if (result.success) {
          setHasWorkActivity(result.tickets.length > 0)
        } else {
          setHasWorkActivity(false)
        }
      } catch {
        setHasWorkActivity(false)
      }
    }

    checkWorkActivity()
  }, [personId, hasJiraAccount])

  // Don't render anything while checking or if no work activity
  if (hasWorkActivity === null || !hasWorkActivity) {
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
        icon={FaJira}
        title='Jira Activity'
        action={headerActions}
      />
      <JiraWorkActivityTable
        personId={personId}
        personName={personName}
        hasJiraAccount={hasJiraAccount}
        daysBack={daysBack}
        refreshTrigger={refreshTrigger}
      />
    </section>
  )
}
