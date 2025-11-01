import { prisma } from '@/lib/db'
import {
  SimpleInitiativeList,
  type Initiative,
} from '@/components/initiatives/initiative-list'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Rocket, Eye } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface OwnedInitiativesSectionProps {
  personId: string
  organizationId: string
}

export async function OwnedInitiativesSection({
  personId,
  organizationId,
}: OwnedInitiativesSectionProps) {
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

  // Only show if person has initiatives
  if (initiatives.length === 0) {
    return null
  }

  // Transform the data to match the Initiative interface
  const transformedInitiatives: Initiative[] = initiatives.map(initiative => ({
    id: initiative.id,
    title: initiative.title,
    description: initiative.summary, // Map summary to description
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
          title='Owned Initiatives'
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
        emptyStateText='No initiatives found.'
      />
    </PageSection>
  )
}
