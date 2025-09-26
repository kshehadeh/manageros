'use client'

import { useState, useEffect } from 'react'
import { JiraWorkActivity } from './jira-work-activity'
import { fetchJiraAssignedTickets } from '@/lib/actions'

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

  return (
    <section>
      <h3 className='font-semibold mb-4'>Work Activity</h3>
      <JiraWorkActivity
        personId={personId}
        personName={personName}
        hasJiraAccount={hasJiraAccount}
      />
    </section>
  )
}
