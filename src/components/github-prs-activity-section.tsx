'use client'

import { useState, useEffect } from 'react'
import { GithubPrsActivity } from './github-prs-activity'
import { fetchGithubPullRequests } from '@/lib/actions'

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
  }, [personId, hasGithubAccount])

  // Don't render anything while checking or if no PR activity
  if (hasPrActivity === null || !hasPrActivity) {
    return null
  }

  return (
    <section>
      <h3 className='font-semibold mb-4'>GitHub Activity</h3>
      <GithubPrsActivity
        personId={personId}
        personName={personName}
        hasGithubAccount={hasGithubAccount}
      />
    </section>
  )
}
