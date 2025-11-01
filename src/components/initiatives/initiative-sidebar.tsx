'use client'

import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { SimpleLinkList } from '@/components/links/link-list'
import { ChangeTeamModal } from './change-team-modal'
import { ManageOwnersModal } from './manage-owners-modal'
import { Users } from 'lucide-react'
import { SimplePeopleList } from '@/components/people/person-list'
import { TeamAvatar } from '@/components/teams/team-avatar'
import Link from 'next/link'
import type { Person } from '@/types/person'
import { useRouter } from 'next/navigation'

interface Team {
  id: string
  name: string
  avatar?: string | null
}

interface EntityLink {
  id: string
  url: string
  title: string | null
  description: string | null
  createdAt: Date
  updatedAt: Date
  createdBy: {
    id: string
    name: string
    email: string
  }
}

interface InitiativeOwner {
  initiativeId: string
  personId: string
  role: string
  person: Person
}

interface InitiativeSidebarProps {
  team: Team | null
  owners: InitiativeOwner[]
  links: EntityLink[]
  entityType: string
  entityId: string
  teams: Team[]
  people: Person[]
}

export function InitiativeSidebar({
  team,
  owners,
  links,
  entityType,
  entityId,
  teams,
  people,
}: InitiativeSidebarProps) {
  const router = useRouter()

  return (
    <div className='w-full lg:w-80 space-y-6'>
      {/* Team Section */}
      <PageSection
        header={
          <SectionHeader
            icon={Users}
            title='Team'
            action={
              <ChangeTeamModal
                initiativeId={entityId}
                currentTeam={team}
                teams={teams}
              />
            }
            className='mb-3'
          />
        }
      >
        {team ? (
          <div className='flex items-center gap-3'>
            <TeamAvatar name={team.name} avatar={team.avatar} size='sm' />
            <Link
              href={`/teams/${team.id}`}
              className='text-sm font-medium text-primary hover:underline'
            >
              {team.name}
            </Link>
          </div>
        ) : (
          <p className='text-sm text-muted-foreground'>No team assigned</p>
        )}
      </PageSection>

      {/* Associated People Section */}
      <PageSection
        header={
          <SectionHeader
            icon={Users}
            title='Associated People'
            action={
              <ManageOwnersModal
                initiativeId={entityId}
                owners={owners}
                people={people}
              />
            }
            className='mb-3'
          />
        }
      >
        <SimplePeopleList
          people={owners.map(owner => ({
            ...owner.person,
            level: 0, // Default level since it's not in the query
          }))}
          title=''
          variant='compact'
          emptyStateText='No people associated with this initiative yet.'
          showEmail={false}
          showRole={false}
          showTeam={false}
          showJobRole={false}
          showManager={false}
          showReportsCount={false}
          customSubtextMap={owners.reduce(
            (acc, owner) => {
              if (owner.role) {
                acc[owner.personId] =
                  owner.role.charAt(0).toUpperCase() + owner.role.slice(1)
              }
              return acc
            },
            {} as Record<string, string>
          )}
          className=''
        />
      </PageSection>

      {/* Links Section */}
      <PageSection>
        <SimpleLinkList
          links={links}
          entityType={entityType}
          entityId={entityId}
          title='Links'
          variant='compact'
          showAddButton={true}
          emptyStateText='No links added yet.'
          onLinksUpdate={() => router.refresh()}
          className=''
        />
      </PageSection>
    </div>
  )
}
