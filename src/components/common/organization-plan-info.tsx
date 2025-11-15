'use client'

import { useEffect, useState } from 'react'
import { Building2, Package } from 'lucide-react'
import { getOrganizationSubscription } from '@/lib/subscription-utils'

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
  const [planName, setPlanName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!organizationId) {
      setIsLoading(false)
      return
    }

    async function fetchSubscription() {
      try {
        const subscription = await getOrganizationSubscription(organizationId!)
        setPlanName(subscription?.subscriptionPlanName || null)
      } catch (error) {
        console.error('Error fetching organization subscription:', error)
        setPlanName(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscription()
  }, [organizationId])

  if (!organizationId) {
    return null
  }

  const hasPlan = !isLoading && planName
  const showNoPlan = !isLoading && !planName

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
        {hasPlan && (
          <div className='text-xs truncate mt-xs bg-[var(--color-badge-info)] text-[var(--color-badge-info-foreground)] px-sm py-xs flex items-center gap-sm'>
            <Package className='h-3 w-3' />
            {planName}
          </div>
        )}
        {showNoPlan && (
          <div className='text-xs text-muted-foreground truncate mt-xs'>
            No subscription
          </div>
        )}
      </div>
    )
  }

  // Vertical variant - displays items side-by-side when they fit
  return (
    <div className={`flex flex-wrap items-center gap-xs mt-xs ${className}`}>
      {organizationName && (
        <div className='text-xs text-muted-foreground truncate flex items-center gap-xs'>
          <Building2 className='h-3 w-3 shrink-0' />
          {organizationName}
        </div>
      )}
      {/* Subscription info */}
      {hasPlan && (
        <>
          {organizationName && (
            <span className='text-xs text-muted-foreground'>•</span>
          )}
          <div className='text-xs text-muted-foreground truncate flex items-center gap-xs'>
            <Package className='h-3 w-3 shrink-0' />
            {planName}
          </div>
        </>
      )}
      {showNoPlan && (
        <>
          {organizationName && (
            <span className='text-xs text-muted-foreground'>•</span>
          )}
          <div className='text-xs text-muted-foreground truncate flex items-center gap-xs'>
            <Package className='h-3 w-3 shrink-0' />
            Free Plan
          </div>
        </>
      )}
    </div>
  )
}
