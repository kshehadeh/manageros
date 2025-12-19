'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePlans, useCheckout } from '@clerk/nextjs/experimental'
import { ClerkLoaded, SignedIn } from '@clerk/nextjs'
import {
  Loader2,
  Sparkles,
  AlertCircle,
  Calendar,
  CreditCard,
} from 'lucide-react'
import { PlanCard, type PlanFeature } from './plan-card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface PlansPageClientProps {
  currentPlanId: string | null
  currentPlanName: string | null
  clerkOrganizationId: string | null
  billingPeriod: 'month' | 'annual' | null
  periodStart: number | null
  periodEnd: number | null
  nextPaymentDate: number | null
}

export function PlansPageClient({
  currentPlanId,
  currentPlanName,
  clerkOrganizationId,
  billingPeriod,
  periodStart,
  periodEnd,
  nextPaymentDate,
}: PlansPageClientProps) {
  if (!clerkOrganizationId) {
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          Organization not found. Please ensure you are part of an organization.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <ClerkLoaded>
      <SignedIn>
        <PlansContent
          currentPlanId={currentPlanId}
          currentPlanName={currentPlanName}
          billingPeriod={billingPeriod}
          periodStart={periodStart}
          periodEnd={periodEnd}
          nextPaymentDate={nextPaymentDate}
        />
      </SignedIn>
    </ClerkLoaded>
  )
}

interface PlansContentProps {
  currentPlanId: string | null
  currentPlanName: string | null
  billingPeriod: 'month' | 'annual' | null
  periodStart: number | null
  periodEnd: number | null
  nextPaymentDate: number | null
}

function formatDate(timestamp: number | null): string | null {
  if (!timestamp) return null
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function PlansContent({
  currentPlanId,
  currentPlanName,
  billingPeriod: currentBillingPeriod,
  nextPaymentDate,
}: PlansContentProps) {
  const router = useRouter()
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'annual'>(
    'month'
  )
  const [isNavigating, setIsNavigating] = useState(false)
  const [isDowngrading, setIsDowngrading] = useState(false)
  const [downgradeError, setDowngradeError] = useState<string | null>(null)
  const [downgradeModalOpen, setDowngradeModalOpen] = useState(false)
  const [selectedPlanForDowngrade, setSelectedPlanForDowngrade] = useState<{
    planId: string
    planName: string
    period: 'month' | 'annual'
  } | null>(null)

  // Reset navigation state when component mounts or currentPlanId changes
  // This handles the case when returning from checkout
  useEffect(() => {
    setIsNavigating(false)
  }, [currentPlanId])

  const {
    data: plans,
    isLoading,
    error,
    revalidate,
  } = usePlans({
    for: 'organization',
  })

  // Checkout hook for handling downgrades inline
  const { checkout } = useCheckout(
    selectedPlanForDowngrade
      ? {
          for: 'organization',
          planId: selectedPlanForDowngrade.planId,
          planPeriod: selectedPlanForDowngrade.period,
        }
      : undefined
  )

  const handlePlanSelect = (
    planId: string,
    period: 'month' | 'annual',
    isFree: boolean,
    planName: string
  ) => {
    // If selecting a free plan (downgrade), show confirmation modal
    if (isFree && currentPlanId && currentPlanId !== planId) {
      setSelectedPlanForDowngrade({ planId, planName, period })
      setDowngradeError(null)
      setDowngradeModalOpen(true)
      return
    }

    // For upgrades, navigate directly to checkout
    setIsNavigating(true)
    router.push(`/organization/checkout?planId=${planId}&period=${period}`)
  }

  const handleConfirmDowngrade = async () => {
    if (!selectedPlanForDowngrade) return

    setIsDowngrading(true)
    setDowngradeError(null)

    try {
      // Start the checkout
      const startResult = await checkout.start()
      if (startResult.error) {
        setDowngradeError(
          startResult.error.message || 'Failed to start downgrade'
        )
        setIsDowngrading(false)
        return
      }

      // Confirm the checkout (no payment needed for free plans)
      const confirmResult = await checkout.confirm({})
      if (confirmResult.error) {
        setDowngradeError(
          confirmResult.error.message || 'Failed to confirm downgrade'
        )
        setIsDowngrading(false)
        return
      }

      // Finalize the checkout
      await checkout.finalize({})

      // Success - close modal and refresh
      setDowngradeModalOpen(false)
      toast.success(
        `Successfully downgraded to ${selectedPlanForDowngrade.planName}`
      )

      // Refresh the page to show updated plan
      router.refresh()
      revalidate()
    } catch (err) {
      setDowngradeError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      )
    } finally {
      setIsDowngrading(false)
    }
  }

  // Determine if current plan is a paid plan (not free/solo)
  const isFreePlan =
    !currentPlanName ||
    currentPlanName.toLowerCase() === 'solo' ||
    currentPlanName.toLowerCase() === 'free'

  return (
    <div className='space-y-lg'>
      {/* Current plan info */}
      {currentPlanName && (
        <div className='rounded-2xl border bg-card p-lg'>
          <div className='flex flex-col gap-sm'>
            <p className='text-sm text-muted-foreground'>
              You are currently on the{' '}
              {!isFreePlan && (
                <Sparkles className='inline h-4 w-4 text-primary mr-1' />
              )}
              <span
                className={
                  isFreePlan
                    ? 'font-semibold text-foreground'
                    : 'font-semibold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent'
                }
              >
                {currentPlanName}
              </span>{' '}
              plan.
            </p>

            {/* Billing details for paid plans */}
            {!isFreePlan && (currentBillingPeriod || nextPaymentDate) && (
              <div className='flex flex-wrap gap-md pt-sm text-xs text-muted-foreground'>
                {currentBillingPeriod && (
                  <div className='flex items-center gap-1'>
                    <Calendar className='h-3.5 w-3.5' />
                    <span>
                      Billed{' '}
                      <span className='font-medium text-foreground'>
                        {currentBillingPeriod === 'annual'
                          ? 'annually'
                          : 'monthly'}
                      </span>
                    </span>
                  </div>
                )}
                {nextPaymentDate && (
                  <div className='flex items-center gap-1'>
                    <CreditCard className='h-3.5 w-3.5' />
                    <span>
                      Next payment{' '}
                      <span className='font-medium text-foreground'>
                        {formatDate(nextPaymentDate)}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Billing period toggle */}
      <div className='flex items-center justify-center gap-md'>
        <Label
          htmlFor='billing-period'
          className={billingPeriod === 'month' ? 'font-semibold' : ''}
        >
          Monthly
        </Label>
        <Switch
          id='billing-period'
          checked={billingPeriod === 'annual'}
          onCheckedChange={checked =>
            setBillingPeriod(checked ? 'annual' : 'month')
          }
        />
        <Label
          htmlFor='billing-period'
          className={billingPeriod === 'annual' ? 'font-semibold' : ''}
        >
          Annual <span className='text-xs text-primary'>(Save up to 20%)</span>
        </Label>
      </div>

      {/* Error state */}
      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Failed to load plans. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className='flex items-center justify-center py-3xl'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      )}

      {/* Plans grid */}
      {!isLoading && plans && plans.length > 0 && (
        <div className='grid gap-lg md:grid-cols-2 lg:grid-cols-3'>
          {plans.map(plan => {
            // Extract features from plan
            const features: PlanFeature[] =
              plan.features?.map(f => ({
                id: f.id,
                name: f.name,
                description: f.description,
              })) ?? []

            // Determine if this is the current plan
            const isCurrentPlan = plan.id === currentPlanId

            // Determine if this is a free plan
            const isFree = !plan.hasBaseFee

            // Get pricing info from fee object
            const monthlyPrice = plan.fee?.amountFormatted ?? '0'
            const annualMonthlyPrice = plan.annualMonthlyFee?.amountFormatted
            const currencySymbol = plan.fee?.currencySymbol ?? '$'

            return (
              <PlanCard
                key={plan.id}
                id={plan.id}
                name={plan.name}
                description={plan.description}
                price={isFree ? 'Free' : `${currencySymbol}${monthlyPrice}`}
                priceSubtext={isFree ? '' : '/month'}
                annualPrice={
                  isFree || !annualMonthlyPrice
                    ? undefined
                    : `${currencySymbol}${annualMonthlyPrice}`
                }
                annualPriceSubtext={isFree ? undefined : '/month'}
                features={features}
                isCurrentPlan={isCurrentPlan}
                isFree={isFree}
                billingPeriod={billingPeriod}
                onSelect={(planId, period) =>
                  handlePlanSelect(planId, period, isFree, plan.name)
                }
                isLoading={isNavigating}
                disabled={isNavigating}
              />
            )
          })}
        </div>
      )}

      {/* No plans available */}
      {!isLoading && plans && plans.length === 0 && (
        <div className='text-center py-3xl'>
          <p className='text-muted-foreground'>
            No subscription plans are currently available.
          </p>
        </div>
      )}

      {/* Downgrade Confirmation Modal */}
      <AlertDialog
        open={downgradeModalOpen}
        onOpenChange={open => {
          if (!isDowngrading) {
            setDowngradeModalOpen(open)
            if (!open) {
              setDowngradeError(null)
            }
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Downgrade Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to downgrade to the{' '}
              <span className='font-semibold'>
                {selectedPlanForDowngrade?.planName}
              </span>{' '}
              plan? You may lose access to some features at the end of your
              current billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {downgradeError && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{downgradeError}</AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDowngrading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDowngrade}
              disabled={isDowngrading}
            >
              {isDowngrading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Processing...
                </>
              ) : (
                'Confirm Downgrade'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
