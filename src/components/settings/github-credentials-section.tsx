'use client'

import { GithubCredentialsForm } from '@/components/github-credentials-form'

interface GithubCredentialsSectionProps {
  initialCredentials?: {
    githubUsername: string
  } | null
}

export function GithubCredentialsSection({
  initialCredentials,
}: GithubCredentialsSectionProps) {
  return <GithubCredentialsForm initialCredentials={initialCredentials} />
}
