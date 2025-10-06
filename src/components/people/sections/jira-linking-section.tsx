import { JiraAccountLinker } from '@/components/jira-account-linker'
import { SectionHeader } from '@/components/ui/section-header'
import { FaJira } from 'react-icons/fa'

interface JiraLinkingSectionProps {
  personId: string
  personName: string
  personEmail: string | null
  jiraAccount: {
    id: string
    personId: string
    jiraAccountId: string
    jiraEmail: string
    jiraDisplayName: string | null
    createdAt: Date
    updatedAt: Date
  } | null
}

export function JiraLinkingSection({
  personId,
  personName,
  personEmail,
  jiraAccount,
}: JiraLinkingSectionProps) {
  return (
    <section>
      <SectionHeader icon={FaJira} title='Jira Linking' />
      <JiraAccountLinker
        personId={personId}
        personName={personName}
        personEmail={personEmail}
        jiraAccount={jiraAccount}
      />
    </section>
  )
}
