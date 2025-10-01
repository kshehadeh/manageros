'use client'

import { useState, useEffect } from 'react'
import { GithubPrsActivityTable } from './github-prs-activity-table'
import { fetchGithubPullRequests } from '@/lib/actions'
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
      <h3 className='font-semibold mb-4 flex items-center gap-2'>
        <FaGithub className='w-4 h-4' />
        GitHub Activity
      </h3>
      <GithubPrsActivityTable
        personId={personId}
        personName={personName}
        hasGithubAccount={hasGithubAccount}
      />
    </section>
  )
}
