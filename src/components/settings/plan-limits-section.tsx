import {
  getOrganizationLimits,
  getOrganizationCounts,
  getOrganizationSubscription,
} from '@/lib/subscription-utils'
import type { EntityName } from '@/lib/subscriptions'
import { EntityNameValues } from '@/lib/subscriptions'
import { Users, Target, Building2, MessageSquare, Sparkles } from 'lucide-react'

interface PlanLimitsSectionProps {
  organizationId: string
}

const entityLabels: Record<EntityName, { label: string; icon: typeof Users }> =
  {
    people: { label: 'People', icon: Users },
    initiatives: { label: 'Initiatives', icon: Target },
    teams: { label: 'Teams', icon: Building2 },
    feedbackcampaigns: { label: 'Feedback 360', icon: MessageSquare },
  }

export async function PlanLimitsSection({
  organizationId,
}: PlanLimitsSectionProps) {
  const [limits, counts, subscription] = await Promise.all([
    getOrganizationLimits(organizationId),
    getOrganizationCounts(organizationId),
    getOrganizationSubscription(organizationId),
  ])

  if (!subscription) {
    return (
      <div className='text-sm text-muted-foreground'>
        No subscription information available
      </div>
    )
  }

  const isFreePlan =
    subscription.subscriptionPlanName?.toLowerCase() === 'solo' ||
    !subscription.subscriptionPlanName

  return (
    <div className='space-y-4'>
      {subscription.subscriptionPlanName && (
        <div>
          <p className='text-sm font-medium'>Current Plan</p>
          <div className='flex items-center gap-2 mt-1'>
            {!isFreePlan && <Sparkles className='h-4 w-4 text-primary' />}
            <p
              className={`text-sm ${
                isFreePlan
                  ? 'text-muted-foreground'
                  : 'font-semibold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent'
              }`}
            >
              {subscription.subscriptionPlanName}
            </p>
          </div>
        </div>
      )}
      <div className='space-y-4'>
        {EntityNameValues.map(entity => {
          const limit = limits?.[entity] ?? 0
          const count = counts?.[entity] ?? 0
          const { label, icon: Icon } = entityLabels?.[entity] ?? {
            label: '',
            icon: Users,
          }
          const isUnlimited =
            limit === null || limit === undefined || limit === 0
          const limitValue = limit ?? 0
          const percentage = isUnlimited
            ? 0
            : limitValue > 0
              ? Math.min((count / limitValue) * 100, 100)
              : 0
          const isAtLimit =
            !isUnlimited && limitValue > 0 && count >= limitValue
          const isNearLimit = !isUnlimited && limitValue > 0 && percentage >= 80

          return (
            <div key={entity} className='space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Icon className='h-4 w-4 text-muted-foreground' />
                  <span className='text-sm font-medium'>{label}</span>
                </div>
                <div className='flex items-center gap-2 text-sm'>
                  <span
                    className={
                      isAtLimit
                        ? 'font-semibold text-destructive'
                        : isNearLimit
                          ? 'font-semibold text-warning'
                          : 'text-muted-foreground'
                    }
                  >
                    {count}
                  </span>
                  <span className='text-muted-foreground'>/</span>
                  <span className='text-muted-foreground'>
                    {isUnlimited ? 'Unlimited' : limit}
                  </span>
                </div>
              </div>
              {!isUnlimited && (
                <div className='relative h-2 w-full overflow-hidden rounded-full bg-muted'>
                  <div
                    className={`h-full transition-all ${
                      isAtLimit
                        ? 'bg-destructive'
                        : isNearLimit
                          ? 'bg-warning'
                          : 'bg-primary'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
