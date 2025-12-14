'use client'

import { Link } from '@/components/ui/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import {
  ClipboardList,
  CheckCircle,
  Clock,
  ArrowRight,
  Users,
} from 'lucide-react'
import type {
  OnboardingInstance,
  OnboardingTemplate,
  OnboardingItemProgress,
  OnboardingItem,
  OnboardingPhase,
  Person,
} from '@/generated/prisma'

type OnboardingWithProgress = OnboardingInstance & {
  template: Pick<OnboardingTemplate, 'id' | 'name' | 'description'>
  manager: Pick<Person, 'id' | 'name' | 'avatar'> | null
  mentor: Pick<Person, 'id' | 'name' | 'avatar'> | null
  phases: {
    id: string
    name: string
    sortOrder: number
    items: (OnboardingItemProgress & {
      item: OnboardingItem & {
        phase: Pick<OnboardingPhase, 'id' | 'name' | 'sortOrder'>
      }
    })[]
  }[]
  progress: {
    total: number
    completed: number
    percentComplete: number
  }
}

interface OnboardingDashboardWidgetProps {
  instance: OnboardingWithProgress | null
}

export function OnboardingDashboardWidget({
  instance,
}: OnboardingDashboardWidgetProps) {
  if (!instance) {
    return null
  }

  // Find current phase (first phase with incomplete items)
  const currentPhase =
    instance.phases.find(phase =>
      phase.items.some(
        item => item.status === 'PENDING' || item.status === 'IN_PROGRESS'
      )
    ) || instance.phases[instance.phases.length - 1]

  // Get next uncompleted item
  const nextItem = currentPhase?.items.find(
    item => item.status === 'PENDING' || item.status === 'IN_PROGRESS'
  )

  const isComplete = instance.status === 'COMPLETED'

  return (
    <PageSection
      header={
        <SectionHeader
          icon={ClipboardList}
          title='Your Onboarding'
          action={
            isComplete ? (
              <Badge variant='default' className='bg-green-500'>
                <CheckCircle className='w-3 h-3 mr-1' />
                Complete
              </Badge>
            ) : (
              <Badge variant='secondary'>
                <Clock className='w-3 h-3 mr-1' />
                In Progress
              </Badge>
            )
          }
        />
      }
    >
      <div className='flex flex-col gap-lg'>
        <Card className='p-lg rounded-md shadow-none bg-muted/20 border-0'>
          <div className='space-y-4'>
            <div>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium'>
                  {instance.template.name}
                </span>
                <span className='text-sm text-muted-foreground'>
                  {instance.progress.completed}/{instance.progress.total} items
                </span>
              </div>
              <Progress
                value={instance.progress.percentComplete}
                className='h-2'
              />
            </div>

            {!isComplete && currentPhase && (
              <div className='space-y-2'>
                <div className='text-sm'>
                  <span className='text-muted-foreground'>Current phase: </span>
                  <span className='font-medium'>{currentPhase.name}</span>
                </div>

                {nextItem && (
                  <div className='p-3 bg-background rounded-lg border'>
                    <p className='text-sm font-medium'>Next up:</p>
                    <p className='text-sm text-muted-foreground'>
                      {nextItem.item.title}
                    </p>
                  </div>
                )}
              </div>
            )}

            {(instance.manager || instance.mentor) && (
              <div className='flex flex-wrap gap-4 text-sm'>
                {instance.manager && (
                  <div className='flex items-center gap-1'>
                    <Users className='w-3 h-3 text-muted-foreground' />
                    <span className='text-muted-foreground'>Manager:</span>
                    <span>{instance.manager.name}</span>
                  </div>
                )}
                {instance.mentor && (
                  <div className='flex items-center gap-1'>
                    <Users className='w-3 h-3 text-muted-foreground' />
                    <span className='text-muted-foreground'>Mentor:</span>
                    <span>{instance.mentor.name}</span>
                  </div>
                )}
              </div>
            )}

            <Button asChild variant='outline' size='sm' className='w-full'>
              <Link href='/onboarding'>
                {isComplete
                  ? 'View Completed Onboarding'
                  : 'Continue Onboarding'}
                <ArrowRight className='w-4 h-4 ml-2' />
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </PageSection>
  )
}
