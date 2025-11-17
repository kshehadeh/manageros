import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { LinksSection } from './links-section'
import { ChangeTeamModal } from './change-team-modal'
import { ManageOwnersModal } from './manage-owners-modal'
import { Users, User } from 'lucide-react'
import { SimplePeopleList } from '@/components/people/person-list'
import { TeamAvatar } from '@/components/teams/team-avatar'
import { Link } from '@/components/ui/link'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'
import { getEntityLinks } from '@/lib/actions/entity-links'
import { prisma } from '@/lib/db'

interface InitiativeSidebarProps {
  initiativeId: string
}

export async function InitiativeSidebar({
  initiativeId,
}: InitiativeSidebarProps) {
  const user = await getCurrentUser()
  const canEdit = await getActionPermission(
    user,
    'initiative.edit',
    initiativeId
  )

  // Fetch all necessary data
  const [initiative, entityLinks] = await Promise.all([
    prisma.initiative.findUnique({
      where: { id: initiativeId },
      include: {
        team: { select: { id: true, name: true, avatar: true } },
        owners: {
          include: {
            person: {
              include: {
                team: true,
                jobRole: {
                  include: {
                    level: true,
                    domain: true,
                  },
                },
                manager: {
                  include: {
                    reports: true,
                  },
                },
                reports: true,
              },
            },
          },
        },
      },
    }),
    getEntityLinks('Initiative', initiativeId),
  ])

  if (!initiative) {
    return null
  }

  const team = initiative.team
  const owners = initiative.owners

  // Transform owners for SimplePeopleList
  const ownerPeople = owners.map(owner => owner.person)
  const customSubtextMap = owners.reduce(
    (acc, owner) => {
      if (owner.role) {
        acc[owner.personId] =
          owner.role.charAt(0).toUpperCase() + owner.role.slice(1)
      }
      return acc
    },
    {} as Record<string, string>
  )

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
                  initiativeId={initiativeId}
                  currentTeam={team}
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
                <ManageOwnersModal initiativeId={initiativeId} />
              ) : undefined
            }
            className='mb-3'
          />
        }
      >
        <SimplePeopleList
          people={ownerPeople}
          variant='compact'
          emptyStateText='No people associated with this initiative yet.'
          showEmail={false}
          showRole={false}
          showTeam={false}
          showJobRole={false}
          showManager={false}
          showReportsCount={false}
          customSubtextMap={customSubtextMap}
          className=''
        />
      </PageSection>

      {/* Links Section */}
      <LinksSection
        links={entityLinks}
        entityType='Initiative'
        entityId={initiativeId}
        canEdit={canEdit}
      />
    </div>
  )
}
