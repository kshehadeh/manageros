'use client'

import { getJiraCredentials } from '@/lib/actions/jira'
import { getGithubCredentials } from '@/lib/actions/github'
import { JiraCredentialsForm } from '@/components/jira-credentials-form'
import { GithubCredentialsForm } from '@/components/github-credentials-form'
import { PersonLinkForm } from '@/components/people/person-link-form'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { User, Settings, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
  const [userId, setUserId] = useState<string | null>(null)

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

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/user/current')
        const data = await response.json()
        if (data.user?.id) {
          setUserId(data.user.id)
        }
      } catch (error) {
        console.error('Failed to load user:', error)
      }
    }
    loadUser()
  }, [])

  return (
    <PageContainer>
      <PageHeader
        title='Settings'
        subtitle='Manage your account settings and integrations.'
      />

      <PageContent>
        <div className='space-y-6'>
          {/* User Info */}
          <PageSection
            variant='bordered'
            header={
              <SectionHeader
                icon={User}
                title='User Info'
                description='Basic information about your account'
              />
            }
          >
            <div className='space-y-2'>
              {userId && (
                <div>
                  <p className='text-sm font-medium'>User ID</p>
                  <p className='text-sm text-muted-foreground'>{userId}</p>
                </div>
              )}
            </div>
          </PageSection>

          {/* Account Linking and Permissions - Side by side on larger screens */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Person Linking Section */}
            <PageSection
              variant='bordered'
              header={
                <SectionHeader
                  icon={User}
                  title='Account Linking'
                  action={accountLinkingButton}
                />
              }
            >
              <PersonLinkForm onButtonRender={setAccountLinkingButton} />
            </PageSection>

            {/* Permissions Section */}
            <PageSection
              variant='bordered'
              header={<SectionHeader icon={Shield} title='Permissions' />}
            >
              <p className='text-sm text-muted-foreground'>
                View your access permissions for all actions in the system
              </p>
              <Button asChild variant='outline' className='mt-4'>
                <Link
                  href='/settings/permissions'
                  className='flex items-center gap-2'
                >
                  <Shield className='w-4 h-4' />
                  View Permissions
                </Link>
              </Button>
            </PageSection>
          </div>

          {/* Integration Settings */}
          <PageSection
            variant='bordered'
            header={
              <SectionHeader icon={Settings} title='Integration Settings' />
            }
          >
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <JiraCredentialsForm initialCredentials={jiraCredentials} />
              <GithubCredentialsForm initialCredentials={githubCredentials} />
            </div>
          </PageSection>
        </div>
      </PageContent>
    </PageContainer>
  )
}
