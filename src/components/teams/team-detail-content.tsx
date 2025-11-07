'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TeamActionsDropdown } from './team-actions-dropdown'
import { ClickableTeamAvatar } from './clickable-team-avatar'
import { TeamAvatarEditDialog } from './team-avatar-edit-dialog'
import { SimplePeopleList } from '@/components/people/person-list'
import { SimpleInitiativeList } from '@/components/initiatives/initiative-list'
import { SimpleTeamList } from './team-list'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { Rocket, Plus, Users, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TeamWithDetailRelations } from '@/types/team'
import { useRouter } from 'next/navigation'

interface TeamDetailContentProps {
  team: TeamWithDetailRelations | null
  isAdmin: boolean
}

export function TeamDetailContent({ team, isAdmin }: TeamDetailContentProps) {
  const router = useRouter()
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(
    team?.avatar || null
  )

  if (!team) {
    return null
  }

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
      <PageContainer>
        <PageHeader
          title={team.name}
          iconComponent={
            <ClickableTeamAvatar
              name={team.name}
              avatar={currentAvatar}
              size='lg'
              isAdmin={isAdmin}
              onClick={handleAvatarClick}
            />
          }
          subtitle={
            <>
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
            </>
          }
          actions={<TeamActionsDropdown teamId={team.id} />}
        />

        <PageContent>
          <PageMain>
            <div className='space-y-6'>
              {/* Team Members */}
              <PageSection
                header={
                  <SectionHeader
                    icon={Users}
                    title={`Members`}
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
                  showTeam={false}
                  showJobRole={true}
                  showManager={false}
                  showReportsCount={false}
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
                    title={`Initiatives`}
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
              <PageSection
                header={
                  <SectionHeader
                    icon={Building2}
                    title={`Children`}
                    action={
                      <Button asChild variant='outline' size='sm'>
                        <Link
                          href={`/teams/new?parentId=${team.id}`}
                          className='flex items-center gap-2'
                        >
                          <Plus className='w-4 h-4' />
                          Add Team
                        </Link>
                      </Button>
                    }
                  />
                }
              >
                <SimpleTeamList
                  teams={team.children}
                  variant='compact'
                  immutableFilters={{}}
                  emptyStateText='No child teams yet.'
                  showInitiatives={false}
                  showMembers={true}
                  showUpdatedAt={false}
                  onTeamUpdate={() => {
                    router.refresh()
                  }}
                />
              </PageSection>
            </div>
          </PageMain>
        </PageContent>
      </PageContainer>

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
