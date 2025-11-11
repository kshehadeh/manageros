'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Link } from '@/components/ui/link'
import { formatDistanceToNow } from 'date-fns'
import { Rocket } from 'lucide-react'
import type { Initiative } from '@/components/initiatives/initiative-list'
import { initiativeStatusUtils } from '@/lib/initiative-status'
import type { InitiativeStatus } from '@/lib/initiative-status'

interface ActiveInitiativesSectionProps {
  initiatives: Initiative[]
}

export function ActiveInitiativesSection({
  initiatives,
}: ActiveInitiativesSectionProps) {
  if (initiatives.length === 0) {
    return null
  }

  // Filter to only show active initiatives (in_progress, planned)
  const activeInitiatives = initiatives.filter(
    init => init.status === 'in_progress' || init.status === 'planned'
  )

  if (activeInitiatives.length === 0) {
    return null
  }

  return (
    <PageSection
      header={
        <SectionHeader
          icon={Rocket}
          title='Active Initiatives'
          description={
            <div className='hidden md:flex items-center gap-md text-xs text-muted-foreground'>
              <Link href='/initiatives' className='hover:underline'>
                View Initiatives
              </Link>
            </div>
          }
        />
      }
    >
      <div className='flex flex-col gap-md'>
        {activeInitiatives.slice(0, 5).map(initiative => (
          <Link
            key={initiative.id}
            href={`/initiatives/${initiative.id}`}
            className='block'
          >
            <Card className='p-lg bg-muted/20 border-0 rounded-md shadow-none hover:bg-muted/30 transition-colors cursor-pointer'>
              <div className='flex items-center justify-between gap-lg'>
                <div className='flex items-center gap-lg flex-1 min-w-0'>
                  <Rocket className='h-4 w-4 text-purple-500 shrink-0' />
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-md flex-wrap'>
                      <span className='text-sm font-medium truncate'>
                        {initiative.title}
                      </span>
                    </div>
                    <div className='flex items-center gap-md text-xs text-muted-foreground mt-sm'>
                      {initiative.team && (
                        <>
                          <span className='truncate'>
                            {initiative.team.name}
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <span>
                        Updated{' '}
                        {formatDistanceToNow(initiative.updatedAt, {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge
                  variant={initiativeStatusUtils.getVariant(
                    initiative.status as InitiativeStatus
                  )}
                  className='text-xs'
                >
                  {initiativeStatusUtils.getLabel(
                    initiative.status as InitiativeStatus
                  )}
                </Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </PageSection>
  )
}
