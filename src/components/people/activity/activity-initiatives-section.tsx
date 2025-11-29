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

interface ActivityInitiativesSectionProps {
  personId: string
  organizationId: string
  dateRangeFrom: string
  dateRangeTo: string
}

export async function ActivityInitiativesSection({
  personId,
  organizationId,
  dateRangeFrom,
  dateRangeTo,
}: ActivityInitiativesSectionProps) {
  const dateRange = {
    from: new Date(dateRangeFrom),
    to: new Date(dateRangeTo),
  }
  if (!organizationId) {
    return null
  }

  // Get initiatives owned by this person
  const initiatives = await prisma.initiative.findMany({
    where: {
      organizationId,
      owners: {
        some: { personId },
      },
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          objectives: true,
          tasks: true,
          checkIns: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Filter initiatives by date range (initiatives updated or created within the range)
  const filteredInitiatives = initiatives.filter(initiative => {
    const updatedAt = initiative.updatedAt
      ? new Date(initiative.updatedAt)
      : null
    const createdAt = initiative.createdAt
      ? new Date(initiative.createdAt)
      : null

    if (!updatedAt && !createdAt) return false

    const relevantDate = updatedAt || createdAt
    if (!relevantDate) return false

    return relevantDate >= dateRange.from && relevantDate <= dateRange.to
  })

  // Transform the data to match the Initiative interface
  const transformedInitiatives: Initiative[] = filteredInitiatives.map(
    initiative => ({
      id: initiative.id,
      title: initiative.title,
      description: initiative.summary, // Map summary to description
      status: initiative.status,
      rag: initiative.rag,
      team: initiative.team,
      updatedAt: initiative.updatedAt,
      createdAt: initiative.createdAt,
      _count: initiative._count,
    })
  )

  return (
    <div className='flex-1 min-w-[400px]'>
      <PageSection
        header={
          <SectionHeader
            icon={Rocket}
            title='Initiatives'
            action={
              <Button asChild variant='outline' size='sm' title='View All'>
                <Link href='/initiatives'>
                  <Eye className='w-4 h-4' />
                </Link>
              </Button>
            }
          />
        }
      >
        <SimpleInitiativeList
          initiatives={transformedInitiatives}
          variant='compact'
          emptyStateText='No initiatives found in this period.'
        />
      </PageSection>
    </div>
  )
}
