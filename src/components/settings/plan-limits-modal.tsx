'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getPlanLimitsAndCountsAction } from '@/lib/actions/subscription'
import type { PlanLimitsAndCounts } from '@/lib/actions/subscription'
import type { EntityName } from '@/lib/subscriptions'
import {
  BarChart3,
  Users,
  Target,
  Building2,
  MessageSquare,
} from 'lucide-react'
import { EntityNameValues } from '@/lib/subscriptions'

interface PlanLimitsModalProps {
  organizationId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const entityLabels: Record<EntityName, { label: string; icon: typeof Users }> =
  {
    people: { label: 'People', icon: Users },
    initiatives: { label: 'Initiatives', icon: Target },
    teams: { label: 'Teams', icon: Building2 },
    feedbackcampaigns: { label: 'Feedback Campaigns', icon: MessageSquare },
  }

export function PlanLimitsModal({
  organizationId,
  open,
  onOpenChange,
}: PlanLimitsModalProps) {
  const [data, setData] = useState<PlanLimitsAndCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    async function fetchData() {
      if (!organizationId) {
        setError('Organization ID is required')
        return
      }

      setLoading(true)
      setError(null)
      try {
        const result = await getPlanLimitsAndCountsAction(organizationId)
        setData(result)
      } catch (err) {
        console.error('Error fetching plan limits and counts:', err)
        setError(
          err instanceof Error ? err.message : 'Failed to load plan information'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [open, organizationId])

  if (!organizationId) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size='md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <BarChart3 className='h-5 w-5' />
            Plan Limits & Usage
          </DialogTitle>
          <DialogDescription>
            {data?.subscription?.subscriptionPlanName
              ? `Current plan: ${data.subscription.subscriptionPlanName}`
              : 'View your current plan limits and usage'}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className='flex items-center justify-center py-8'>
            <div className='text-sm text-muted-foreground'>Loading...</div>
          </div>
        )}

        {error && (
          <div className='rounded-md bg-destructive/10 p-4 text-sm text-destructive'>
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <div className='space-y-4'>
            {EntityNameValues.map(entity => {
              const limit = data.limits?.[entity] ?? 0
              const count = data.counts?.[entity] ?? 0
              const { label, icon: Icon } = entityLabels?.[entity] ?? {
                label: '',
                icon: Users,
              }
              const isUnlimited = limit === null || limit === undefined
              const limitValue = limit ?? 0
              const percentage = isUnlimited
                ? 0
                : limitValue > 0
                  ? Math.min((count / limitValue) * 100, 100)
                  : 0
              const isAtLimit =
                !isUnlimited && limitValue > 0 && count >= limitValue
              const isNearLimit =
                !isUnlimited && limitValue > 0 && percentage >= 80

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
        )}
      </DialogContent>
    </Dialog>
  )
}
