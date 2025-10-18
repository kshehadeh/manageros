'use client'

import { getJiraCredentials } from '@/lib/actions/jira'
import { getGithubCredentials } from '@/lib/actions/github'
import { JiraCredentialsForm } from '@/components/jira-credentials-form'
import { GithubCredentialsForm } from '@/components/github-credentials-form'
import { PersonLinkForm } from '@/components/people/person-link-form'
import { SectionHeader } from '@/components/ui/section-header'
import { User, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function SettingsPage() {
  const [jiraCredentials, setJiraCredentials] = useState<{
    jiraUsername: string
    jiraBaseUrl: string
  } | null>(null)
  const [githubCredentials, setGithubCredentials] = useState<{
    githubUsername: string
  } | null>(null)
  const [accountLinkingButton, setAccountLinkingButton] =
    useState<React.ReactNode>(null)

  useEffect(() => {
    const loadCredentials = async () => {
      const [jira, github] = await Promise.all([
        getJiraCredentials(),
        getGithubCredentials(),
      ])
      setJiraCredentials(jira)
      setGithubCredentials(github)
    }
    loadCredentials()
  }, [])

  return (
    <div className='page-container'>
      <div className='page-header'>
        <h1 className='page-title'>Settings</h1>
        <p className='page-subtitle'>
          Manage your account settings and integrations.
        </p>
      </div>

      <div className='page-section space-y-12'>
        {/* Person Linking Section */}
        <div className='space-y-4'>
          <SectionHeader
            icon={User}
            title='Account Linking'
            action={accountLinkingButton}
          />
          <PersonLinkForm onButtonRender={setAccountLinkingButton} />
        </div>

        {/* Integration Settings */}
        <div className='space-y-4'>
          <SectionHeader icon={Settings} title='Integration Settings' />
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <JiraCredentialsForm initialCredentials={jiraCredentials} />
            <GithubCredentialsForm initialCredentials={githubCredentials} />
          </div>
        </div>
      </div>
    </div>
  )
}
