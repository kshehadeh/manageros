import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { GithubAccountLinker } from '@/components/github-account-linker'
import { SectionHeader } from '@/components/ui/section-header'
import { FaGithub } from 'react-icons/fa'

interface GithubLinkingSectionProps {
  personId: string
  personName: string
  githubAccount: {
    id: string
    personId: string
    githubUsername: string
    githubDisplayName: string | null
    githubEmail: string | null
    createdAt: Date
    updatedAt: Date
  } | null
}

export async function GithubLinkingSection({
  personId,
  personName,
  githubAccount,
}: GithubLinkingSectionProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.organizationId || !isAdmin(session.user)) {
    return null
  }

  return (
    <section>
      <SectionHeader icon={FaGithub} title='GitHub Linking' />
      <GithubAccountLinker
        personId={personId}
        personName={personName}
        githubAccount={githubAccount}
      />
    </section>
  )
}
