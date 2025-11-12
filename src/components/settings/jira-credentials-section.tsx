'use client'

import { JiraCredentialsForm } from '@/components/jira-credentials-form'

interface JiraCredentialsSectionProps {
  initialCredentials?: {
    jiraUsername: string
    jiraBaseUrl: string
  } | null
}

export function JiraCredentialsSection({
  initialCredentials,
}: JiraCredentialsSectionProps) {
  return <JiraCredentialsForm initialCredentials={initialCredentials} />
}
