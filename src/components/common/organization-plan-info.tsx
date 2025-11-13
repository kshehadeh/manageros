'use client'

import { useSubscription } from '@clerk/nextjs/experimental'
import { Building2, Package } from 'lucide-react'

interface OrganizationPlanInfoProps {
  organizationName: string | null | undefined
  organizationId: string | null | undefined
  /**
   * Layout variant: 'horizontal' shows org and plan side-by-side with badge styling,
   * 'vertical' shows them stacked with text styling
   */
  variant?: 'horizontal' | 'vertical'
  /**
   * Custom className to apply to the container
   */
  className?: string
}

export function OrganizationPlanInfo({
  organizationName,
  organizationId,
  variant = 'vertical',
  className = '',
}: OrganizationPlanInfoProps) {
  const { data: subscription, isLoading: subscriptionLoading } =
    useSubscription()

  if (!organizationId) {
    return null
  }

  const planName = subscription?.subscriptionItems?.[0]?.plan?.name || null
  const hasSubscription = !subscriptionLoading && subscription && planName
  const showNoSubscription =
    !subscriptionLoading && !subscription && organizationId

  if (variant === 'horizontal') {
    return (
      <div className={`flex flex-row gap-sm ${className}`}>
        {organizationName && (
          <div className='text-xs text-muted-foreground truncate mt-xs flex items-center gap-sm'>
            <Building2 className='h-3 w-3' />
            {organizationName}
          </div>
        )}
        {/* Subscription info */}
        {hasSubscription && (
          <div className='text-xs truncate mt-xs bg-[var(--color-badge-info)] text-[var(--color-badge-info-foreground)] px-sm py-xs flex items-center gap-sm'>
            <Package className='h-3 w-3' />
            {planName}
          </div>
        )}
        {showNoSubscription && (
          <div className='text-xs text-muted-foreground truncate mt-xs'>
            No subscription
          </div>
        )}
      </div>
    )
  }

  // Vertical variant
  return (
    <div className={className}>
      {organizationName && (
        <div className='text-xs text-muted-foreground truncate mt-xs'>
          {organizationName}
        </div>
      )}
      {/* Subscription info */}
      {hasSubscription && (
        <div className='text-xs text-muted-foreground truncate mt-xs'>
          {planName}
        </div>
      )}
      {showNoSubscription && (
        <div className='text-xs text-muted-foreground truncate mt-xs'>
          Free Plan
        </div>
      )}
    </div>
  )
}
