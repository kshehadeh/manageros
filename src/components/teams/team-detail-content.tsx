'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TeamActionsDropdown } from './team-actions-dropdown'
import { ClickableTeamAvatar } from './clickable-team-avatar'
import { TeamAvatarEditDialog } from './team-avatar-edit-dialog'
import { SimplePeopleList } from '@/components/people/person-list'
import { SimpleInitiativeList } from '@/components/initiatives/initiative-list'
import { SimpleTeamList } from './team-list'
import { Person as PersonWithRelations } from '@/types/person'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Rocket, Plus, Eye, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TeamDetailContentProps {
  team: {
    id: string
    name: string
    description?: string | null
    avatar?: string | null
    parent?: {
      id: string
      name: string
    } | null
    people: PersonWithRelations[]
    children: Array<{
      id: string
      name: string
      description?: string | null
      avatar?: string | null
      updatedAt: Date
      people?: Array<{
        id: string
        name: string
      }>
      initiatives?: Array<{
        id: string
        title: string
      }>
    }>
    initiatives: Array<{
      id: string
      title: string
      description?: string | null
      status: string
      rag: string
      team?: {
        id: string
        name: string
      } | null
      updatedAt: Date
      createdAt: Date
      _count?: {
        tasks: number
        checkIns: number
        objectives: number
      }
    }>
  }
  isAdmin: boolean
}

export function TeamDetailContent({ team, isAdmin }: TeamDetailContentProps) {
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(
    team.avatar || null
  )

  const handleAvatarClick = () => {
    if (isAdmin) {
      setIsAvatarDialogOpen(true)
    }
  }

  const handleAvatarChange = (avatarUrl: string | null) => {
    setCurrentAvatar(avatarUrl)
  }

  return (
    <>
      <div className='px-4 lg:px-6'>
        <div className='page-header'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='flex items-center gap-3 mb-2'>
                <ClickableTeamAvatar
                  name={team.name}
                  avatar={currentAvatar}
                  size='lg'
                  isAdmin={isAdmin}
                  onClick={handleAvatarClick}
                />
                <h1 className='page-title'>{team.name}</h1>
              </div>
              {team.description && (
                <p className='page-section-subtitle'>{team.description}</p>
              )}
              {team.parent && (
                <div className='text-sm text-muted-foreground mt-1'>
                  Parent team:{' '}
                  <Link
                    href={`/teams/${team.parent.id}`}
                    className='link-hover'
                  >
                    {team.parent.name}
                  </Link>
                </div>
              )}
            </div>
            <div className='flex items-center gap-2'>
              <TeamActionsDropdown teamId={team.id} />
            </div>
          </div>
        </div>

        <div className='space-y-6'>
          {/* Team Members */}
          <PageSection
            header={
              <SectionHeader
                icon={Users}
                title={`Team Members (${team.people.length})`}
                action={
                  <Button asChild variant='outline' size='sm'>
                    <Link
                      href={`/people/new?teamId=${team.id}`}
                      className='flex items-center gap-2'
                    >
                      <Plus className='w-4 h-4' />
                      Add Member
                    </Link>
                  </Button>
                }
              />
            }
          >
            <SimplePeopleList
              people={team.people}
              variant='compact'
              immutableFilters={{
                teamId: team.id,
              }}
              emptyStateText='No team members yet.'
              onPersonUpdate={() => {
                window.location.reload()
              }}
            />
          </PageSection>

          {/* Team Initiatives */}
          <PageSection
            header={
              <SectionHeader
                icon={Rocket}
                title={`Team Initiatives (${team.initiatives.length})`}
                action={
                  <div className='flex items-center gap-2'>
                    <Button asChild variant='outline' size='sm'>
                      <Link
                        href={`/initiatives/new?teamId=${team.id}`}
                        className='flex items-center gap-2'
                      >
                        <Plus className='w-4 h-4' />
                        Add Initiative
                      </Link>
                    </Button>
                    <Button asChild variant='outline' size='sm'>
                      <Link
                        href='/initiatives'
                        className='flex items-center gap-2'
                      >
                        <Eye className='w-4 h-4' />
                        View All
                      </Link>
                    </Button>
                  </div>
                }
              />
            }
          >
            <SimpleInitiativeList
              initiatives={team.initiatives}
              variant='compact'
              immutableFilters={{
                teamId: team.id,
              }}
              emptyStateText='No initiatives found.'
              onInitiativeUpdate={() => {
                window.location.reload()
              }}
            />
          </PageSection>

          {/* Child Teams */}
          <SimpleTeamList
            teams={team.children}
            title={`Child Teams (${team.children.length})`}
            variant='compact'
            showAddButton={true}
            addButtonHref={`/teams/new?parentId=${team.id}`}
            immutableFilters={{}}
            emptyStateText='No child teams yet.'
            onTeamUpdate={() => {
              window.location.reload()
            }}
          />
        </div>
      </div>

      <TeamAvatarEditDialog
        teamId={team.id}
        teamName={team.name}
        currentAvatar={currentAvatar}
        isOpen={isAvatarDialogOpen}
        onOpenChange={setIsAvatarDialogOpen}
        onAvatarChange={handleAvatarChange}
      />
    </>
  )
}
