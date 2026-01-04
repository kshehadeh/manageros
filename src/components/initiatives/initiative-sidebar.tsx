import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { LinksSection } from './links-section'
import { User } from 'lucide-react'
import { SimplePeopleList } from '@/components/people/person-list'
import { getEntityLinks } from '@/lib/actions/entity-links'
import { prisma } from '@/lib/db'
import { ManagePeopleHeaderAction } from './manage-people-header-action'

interface InitiativeSidebarProps {
  initiativeId: string
}

export async function InitiativeSidebar({
  initiativeId,
}: InitiativeSidebarProps) {
  // Fetch all necessary data
  const [initiative, entityLinks] = await Promise.all([
    prisma.initiative.findUnique({
      where: { id: initiativeId },
      include: {
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
      {/* Associated People Section - only show if there are people */}
      {ownerPeople.length > 0 && (
        <PageSection
          header={
            <SectionHeader
              icon={User}
              title='People'
              className='mb-3'
              action={<ManagePeopleHeaderAction initiativeId={initiativeId} />}
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
      )}

      {/* Links Section - only show if there are links */}
      {entityLinks.length > 0 && (
        <LinksSection
          links={entityLinks}
          entityType='Initiative'
          entityId={initiativeId}
        />
      )}
    </div>
  )
}
