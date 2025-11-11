'use client'

import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { SimpleLinkList } from '@/components/links/link-list'
import { AddLinkModal } from '@/components/links/add-link-modal'
import { ChangeTeamModal } from './change-team-modal'
import { ManageOwnersModal } from './manage-owners-modal'
import { Users, Link as LinkIcon, User } from 'lucide-react'
import { SimplePeopleList } from '@/components/people/person-list'
import { TeamAvatar } from '@/components/teams/team-avatar'
import { Link } from '@/components/ui/link'
import type { Person } from '@/types/person'
import { useRouter } from 'next/navigation'
import type { Prisma } from '@prisma/client'

// Raw Prisma types with includes
type PersonWithRelations = Prisma.PersonGetPayload<{
  include: {
    team: true
    jobRole: {
      include: {
        level: true
        domain: true
      }
    }
    manager: {
      include: {
        reports: true
      }
    }
    reports: true
  }
}>

type OwnerWithRelations = {
  initiativeId: string
  personId: string
  role: string
  person: PersonWithRelations
}

type EntityLinkWithRelations = Prisma.EntityLinkGetPayload<{
  include: {
    createdBy: {
      select: {
        id: true
        name: true
        email: true
      }
    }
  }
}>

interface Team {
  id: string
  name: string
  avatar?: string | null
}

interface InitiativeSidebarProps {
  team: Team | null
  owners: OwnerWithRelations[]
  links: EntityLinkWithRelations[]
  entityType: string
  entityId: string
  teams: Team[]
  people: PersonWithRelations[]
  canEdit?: boolean
}

/**
 * Transforms a Prisma person with relations into the Person type expected by components
 */
function mapPersonToPersonType(person: PersonWithRelations): Person {
  return {
    ...person,
    level: 0, // Default level
    team: person.team
      ? {
          id: person.team.id,
          name: person.team.name,
        }
      : null,
    jobRole: person.jobRole
      ? {
          id: person.jobRole.id,
          title: person.jobRole.title,
          level: person.jobRole.level
            ? {
                id: person.jobRole.level.id,
                name: person.jobRole.level.name,
              }
            : { id: '', name: '' },
          domain: person.jobRole.domain
            ? {
                id: person.jobRole.domain.id,
                name: person.jobRole.domain.name,
              }
            : { id: '', name: '' },
        }
      : null,
    manager: person.manager
      ? {
          id: person.manager.id,
          name: person.manager.name,
          email: person.manager.email,
          role: person.manager.role,
          status: person.manager.status,
          birthday: person.manager.birthday,
          reports: person.manager.reports || [],
        }
      : null,
    reports: person.reports.map(report => ({
      id: report.id,
      name: report.name,
      email: report.email,
      role: report.role,
      status: report.status,
      birthday: report.birthday,
    })),
  }
}

/**
 * Transforms a Prisma entity link with relations into the EntityLink type expected by components
 */
function mapEntityLinkToLinkType(link: EntityLinkWithRelations): {
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
} {
  return {
    id: link.id,
    url: link.url,
    title: link.title,
    description: link.description,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
    createdBy: link.createdBy,
  }
}

export function InitiativeSidebar({
  team,
  owners,
  links,
  entityType,
  entityId,
  teams,
  people,
  canEdit = false,
}: InitiativeSidebarProps) {
  const router = useRouter()

  // Transform the data
  const mappedOwners: Array<{
    initiativeId: string
    personId: string
    role: string
    person: Person
  }> = owners.map(owner => ({
    ...owner,
    person: mapPersonToPersonType(owner.person),
  }))

  const mappedLinks = links.map(mapEntityLinkToLinkType)
  const mappedPeople = people.map(mapPersonToPersonType)

  return (
    <div className='w-full lg:w-80 space-y-6'>
      {/* Team Section */}
      <PageSection
        header={
          <SectionHeader
            icon={Users}
            title='Team'
            action={
              canEdit ? (
                <ChangeTeamModal
                  initiativeId={entityId}
                  currentTeam={team}
                  teams={teams}
                />
              ) : undefined
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
            icon={User}
            title='People'
            action={
              canEdit ? (
                <ManageOwnersModal
                  initiativeId={entityId}
                  owners={mappedOwners}
                  people={mappedPeople}
                />
              ) : undefined
            }
            className='mb-3'
          />
        }
      >
        <SimplePeopleList
          people={mappedOwners.map(owner => owner.person)}
          variant='compact'
          emptyStateText='No people associated with this initiative yet.'
          showEmail={false}
          showRole={false}
          showTeam={false}
          showJobRole={false}
          showManager={false}
          showReportsCount={false}
          customSubtextMap={mappedOwners.reduce(
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
      <PageSection
        header={
          <SectionHeader
            icon={LinkIcon}
            title='Links'
            action={
              canEdit ? (
                <AddLinkModal
                  entityType={entityType}
                  entityId={entityId}
                  onLinkAdded={() => router.refresh()}
                />
              ) : undefined
            }
          />
        }
      >
        <SimpleLinkList
          links={mappedLinks}
          entityType={entityType}
          entityId={entityId}
          variant='compact'
          emptyStateText='No links added yet.'
          onLinksUpdate={() => router.refresh()}
          className=''
        />
      </PageSection>
    </div>
  )
}
