'use client'

import { SectionHeader } from '@/components/ui/section-header'
import { LinkManager } from '@/components/entity-links'
import { ChangeTeamModal } from './change-team-modal'
import { ManageOwnersModal } from './manage-owners-modal'
import { Users } from 'lucide-react'
import { PersonListItem } from '@/components/people/person-list-item'
import Link from 'next/link'

interface Person {
  id: string
  name: string
  email?: string | null
  avatar?: string | null
  role?: string | null
}

interface InitiativeOwner {
  initiativeId: string
  personId: string
  role: string
  person: Person
}

interface Team {
  id: string
  name: string
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
  return (
    <div className='w-full lg:w-80 space-y-6'>
      {/* Team Section */}
      <div className='page-section'>
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
        {team ? (
          <div className='flex items-center gap-2'>
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
      </div>

      {/* Associated People Section */}
      <div className='page-section'>
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
        <div className='space-y-3'>
          {owners.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              No people associated with this initiative yet.
            </p>
          ) : (
            owners.map(owner => (
              <PersonListItem
                key={`${owner.initiativeId}-${owner.personId}`}
                person={owner.person}
                roleBadge={
                  owner.role && owner.role !== 'owner' ? owner.role : undefined
                }
              />
            ))
          )}
        </div>
      </div>

      {/* Links Section */}
      <div className='page-section'>
        <LinkManager
          entityType={entityType}
          entityId={entityId}
          links={links}
        />
      </div>
    </div>
  )
}
