import { prisma } from '@/lib/db'
import {
  SimpleInitiativeList,
  type Initiative,
} from '@/components/initiatives/initiative-list'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Rocket, Eye } from 'lucide-react'
import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'

interface DashboardOpenInitiativesServerSectionProps {
  organizationId: string
  personId: string | null
}

export async function DashboardOpenInitiativesServerSection({
  organizationId,
  personId,
}: DashboardOpenInitiativesServerSectionProps) {
  // If user doesn't have a linked person record, return empty state
  if (!personId) {
    return (
      <PageSection
        header={
          <SectionHeader
            icon={Rocket}
            title='Your Initiatives'
            action={
              <Button asChild variant='outline' size='sm'>
                <Link href='/initiatives' className='flex items-center gap-2'>
                  <Eye className='w-4 h-4' />
                  View All
                </Link>
              </Button>
            }
          />
        }
      >
        <SimpleInitiativeList
          initiatives={[]}
          variant='compact'
          emptyStateText='Please link your account to a person record to see your initiatives.'
        />
      </PageSection>
    )
  }

  // Fetch initiatives where current user is an owner
  const initiatives = await prisma.initiative.findMany({
    where: {
      organizationId,
      owners: {
        some: { personId },
      },
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          tasks: true,
          checkIns: true,
          objectives: true,
        },
      },
    },
  })

  // Transform the data to match the Initiative interface
  const transformedInitiatives: Initiative[] = initiatives.map(initiative => ({
    id: initiative.id,
    title: initiative.title,
    status: initiative.status,
    rag: initiative.rag,
    team: initiative.team,
    updatedAt: initiative.updatedAt,
    createdAt: initiative.createdAt,
    _count: initiative._count,
  }))

  return (
    <PageSection
      header={
        <SectionHeader
          icon={Rocket}
          title='Your Initiatives'
          action={
            <Button asChild variant='outline' size='sm'>
              <Link href='/initiatives' className='flex items-center gap-2'>
                <Eye className='w-4 h-4' />
                View All
              </Link>
            </Button>
          }
        />
      }
    >
      <SimpleInitiativeList
        initiatives={transformedInitiatives}
        variant='compact'
        emptyStateText='No initiatives assigned to you.'
      />
    </PageSection>
  )
}
