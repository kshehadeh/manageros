'use client'

import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import {
  Sparkles,
  Users,
  UserPlus,
  Settings,
  CheckCircle2,
  ArrowRight,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserSettings } from '@/lib/hooks/use-user-settings'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
  href: string
  completed: boolean
}

interface OnboardingSectionProps {
  hasAddedPeople: boolean
  hasLinkedSelf: boolean
  isAdmin: boolean
  isOrganizationConfigured: boolean
  className?: string
}

export function OnboardingSection({
  hasAddedPeople,
  hasLinkedSelf,
  isAdmin,
  isOrganizationConfigured,
  className,
}: OnboardingSectionProps) {
  const { settings, isLoaded, updateSetting } = useUserSettings()

  // Only show for admins and if user hasn't disabled it
  if (!isAdmin || !isLoaded || !settings.showOnboarding) {
    return null
  }

  const steps: OnboardingStep[] = [
    {
      id: 'add-people',
      title: 'Add your team members',
      description:
        'Import or manually add people to start managing your organization.',
      icon: UserPlus,
      href: '/people',
      completed: hasAddedPeople,
    },
    {
      id: 'link-self',
      title: 'Link your account',
      description:
        'Connect your user account to your person profile for full functionality.',
      icon: Users,
      href: '/settings',
      completed: hasLinkedSelf,
    },
    {
      id: 'configure-org',
      title: 'Configure your organization',
      description: 'Set up job roles, teams, and other organization settings.',
      icon: Settings,
      href: '/organization/settings',
      completed: isOrganizationConfigured,
    },
  ]

  const completedCount = steps.filter(s => s.completed).length
  const allCompleted = completedCount === steps.length

  return (
    <PageSection
      className={cn(
        'relative bg-gradient-to-br from-highlight/5 to-transparent',
        className
      )}
      header={
        <SectionHeader
          icon={Sparkles}
          title={
            allCompleted
              ? 'Onboarding Complete!'
              : 'Welcome to Your Organization!'
          }
          description={
            allCompleted
              ? 'You have completed all onboarding steps.'
              : `Complete these steps to get started (${completedCount}/${steps.length} done)`
          }
        />
      }
    >
      <button
        onClick={() => updateSetting('showOnboarding', false)}
        className='absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors'
        aria-label='Dismiss onboarding'
      >
        <X className='h-4 w-4' />
      </button>

      {allCompleted ? (
        <div className='py-6 text-center'>
          <div className='flex justify-center mb-4'>
            <div className='w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center'>
              <CheckCircle2 className='h-8 w-8 text-green-500' />
            </div>
          </div>
          <p className='text-sm text-muted-foreground'>
            All onboarding steps have been completed. You're all set!
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-lg border transition-colors',
                  step.completed
                    ? 'bg-muted/50 border-muted'
                    : 'bg-card border-border hover:border-highlight/50'
                )}
              >
                <div
                  className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                    step.completed
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-highlight/20 text-highlight'
                  )}
                >
                  {step.completed ? (
                    <CheckCircle2 className='h-4 w-4' />
                  ) : (
                    <span className='text-sm font-medium'>{index + 1}</span>
                  )}
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2'>
                    <Icon className='h-4 w-4 text-muted-foreground' />
                    <h4
                      className={cn(
                        'font-medium',
                        step.completed && 'text-muted-foreground line-through'
                      )}
                    >
                      {step.title}
                    </h4>
                  </div>
                  <p className='text-sm text-muted-foreground mt-1'>
                    {step.description}
                  </p>
                </div>

                {!step.completed && (
                  <Button asChild variant='outline' size='sm'>
                    <Link href={step.href} className='flex items-center gap-1'>
                      Start
                      <ArrowRight className='h-3 w-3' />
                    </Link>
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className='mt-4 pt-4 border-t'>
        <p className='text-xs text-muted-foreground'>
          You can dismiss this guide at any time. You can re-enable it from your
          settings page.
        </p>
      </div>
    </PageSection>
  )
}
