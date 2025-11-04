import { UserLinkForm } from '@/components/user-link-form'
import { JiraAccountLinker } from '@/components/jira-account-linker'
import { GithubAccountLinker } from '@/components/github-account-linker'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { Link as LinkIcon, User as UserIcon } from 'lucide-react'
import { FaJira, FaGithub } from 'react-icons/fa'
import type {
  User,
  PersonJiraAccount,
  PersonGithubAccount,
} from '@prisma/client'

interface AccountLinkingSectionProps {
  personId: string
  personName: string
  personEmail: string | null
  linkedUser: User | null
  jiraAccount: PersonJiraAccount | null
  githubAccount: PersonGithubAccount | null
}

export function AccountLinkingSection({
  personId,
  personName,
  personEmail,
  linkedUser,
  jiraAccount,
  githubAccount,
}: AccountLinkingSectionProps) {
  return (
    <PageSection
      header={<SectionHeader icon={LinkIcon} title='Account Linking' />}
    >
      <div className='space-y-6'>
        {/* User Account Linking Subsection */}
        <div className='space-y-3'>
          <div className='flex items-center gap-2 pb-2 border-b border-muted'>
            <UserIcon className='w-4 h-4 text-muted-foreground' />
            <h4 className='text-sm font-semibold'>User Account</h4>
          </div>
          <UserLinkForm personId={personId} linkedUser={linkedUser} />
        </div>

        {/* Jira Account Linking Subsection */}
        <div className='space-y-3'>
          <div className='flex items-center gap-2 pb-2 border-b border-muted'>
            <FaJira className='w-4 h-4 text-muted-foreground' />
            <h4 className='text-sm font-semibold'>Jira Account</h4>
          </div>
          <JiraAccountLinker
            personId={personId}
            personName={personName}
            personEmail={personEmail}
            jiraAccount={jiraAccount}
          />
        </div>

        {/* GitHub Account Linking Subsection */}
        <div className='space-y-3'>
          <div className='flex items-center gap-2 pb-2 border-b border-muted'>
            <FaGithub className='w-4 h-4 text-muted-foreground' />
            <h4 className='text-sm font-semibold'>GitHub Account</h4>
          </div>
          <GithubAccountLinker
            personId={personId}
            personName={personName}
            githubAccount={githubAccount}
          />
        </div>
      </div>
    </PageSection>
  )
}
