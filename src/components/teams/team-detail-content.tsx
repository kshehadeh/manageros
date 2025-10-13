'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TeamActionsDropdown } from './team-actions-dropdown'
import { ClickableTeamAvatar } from './clickable-team-avatar'
import { TeamAvatarEditDialog } from './team-avatar-edit-dialog'
import { User, Rocket, Building2 } from 'lucide-react'
import { PeopleDataTable } from '@/components/people/data-table'
import { InitiativeDataTable } from '@/components/initiatives/data-table'
import { TeamChildTeamsTable } from './team-child-teams-table'
import { Team } from '@prisma/client'
import { Person as PersonWithRelations } from '@/types/person'

// Type for child team with relations needed by TeamChildTeamsTable
type ChildTeamWithRelations = Team & {
  people: Array<{
    id: string
    name: string
  }>
  initiatives: Array<{
    id: string
    title: string
  }>
}

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
    children: ChildTeamWithRelations[]
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
          <div className='page-section'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='section-header font-bold flex items-center gap-2'>
                <User className='w-4 h-4' />
                Team Members ({team.people.length})
              </h3>
              <Button asChild variant='outline' size='sm'>
                <Link href={`/people/new?teamId=${team.id}`}>Add Member</Link>
              </Button>
            </div>
            <PeopleDataTable
              hideFilters={true}
              enablePagination={false}
              limit={100}
              immutableFilters={{
                teamId: team.id,
              }}
              settingsId={`team-${team.id}-members`}
            />
          </div>

          {/* Team Initiatives */}
          <div className='page-section'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='section-header font-bold flex items-center gap-2'>
                <Rocket className='w-4 h-4' />
                Team Initiatives
              </h3>
              <Button asChild variant='outline' size='sm'>
                <Link href={`/initiatives/new?teamId=${team.id}`}>
                  New Initiative
                </Link>
              </Button>
            </div>
            <InitiativeDataTable
              hideFilters={true}
              enablePagination={false}
              limit={100}
              immutableFilters={{
                teamId: team.id,
              }}
              settingsId={`team-${team.id}-initiatives`}
            />
          </div>

          {/* Child Teams */}
          <div className='page-section'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='section-header font-bold flex items-center gap-2'>
                <Building2 className='w-4 h-4' />
                Child Teams ({team.children.length})
              </h3>
              <Button asChild variant='outline' size='sm'>
                <Link href={`/teams/new?parentId=${team.id}`}>
                  Add Child Team
                </Link>
              </Button>
            </div>
            <TeamChildTeamsTable childTeams={team.children} />
          </div>
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
