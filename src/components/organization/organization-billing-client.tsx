'use client'

import {
  useSubscription,
  useStatements,
  usePaymentAttempts,
} from '@clerk/nextjs/experimental'
import { ClerkLoaded, SignedIn } from '@clerk/nextjs'
import {
  Loader2,
  AlertCircle,
  Calendar,
  CreditCard,
  FileText,
  DollarSign,
  Sparkles,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export function OrganizationBillingClient() {
  return (
    <ClerkLoaded>
      <SignedIn>
        <BillingContent />
      </SignedIn>
    </ClerkLoaded>
  )
}

function BillingContent() {
  const {
    data: subscription,
    isLoading: isSubscriptionLoading,
    error: subscriptionError,
  } = useSubscription({
    for: 'organization',
  })

  const {
    data: statements,
    isLoading: isStatementsLoading,
    error: statementsError,
  } = useStatements({
    for: 'organization',
    pageSize: 10,
  })

  const {
    data: paymentAttempts,
    isLoading: isPaymentAttemptsLoading,
    error: paymentAttemptsError,
  } = usePaymentAttempts({
    for: 'organization',
    pageSize: 10,
  })

  const isLoading =
    isSubscriptionLoading || isStatementsLoading || isPaymentAttemptsLoading

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-3xl'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    )
  }

  return (
    <div className='space-y-xl'>
      {/* Current Plan Section */}
      <PageSection
        header={<SectionHeader icon={CreditCard} title='Current Plan' />}
      >
        {subscriptionError ? (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              Failed to load subscription information. Please try again later.
            </AlertDescription>
          </Alert>
        ) : subscription ? (
          <div className='flex items-start justify-between gap-md'>
            <div className='flex flex-col gap-sm flex-1'>
              {(() => {
                const planName =
                  subscription.subscriptionItems?.[0]?.plan?.name || 'No Plan'
                const isFreePlan =
                  !planName ||
                  planName.toLowerCase() === 'solo' ||
                  planName.toLowerCase() === 'free'

                return (
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
                      {planName}
                    </span>{' '}
                    plan.
                  </p>
                )
              })()}

              {/* Billing details */}
              {(subscription.subscriptionItems?.[0]?.planPeriod ||
                subscription.nextPayment) && (
                <div className='flex flex-wrap gap-md text-xs text-muted-foreground'>
                  {subscription.subscriptionItems?.[0]?.planPeriod && (
                    <div className='flex items-center gap-1'>
                      <Calendar className='h-3.5 w-3.5' />
                      <span>
                        Billed{' '}
                        <span className='font-medium text-foreground'>
                          {subscription.subscriptionItems[0].planPeriod ===
                          'annual'
                            ? 'annually'
                            : 'monthly'}
                        </span>
                      </span>
                    </div>
                  )}
                  {subscription.nextPayment &&
                    subscription.nextPayment.date && (
                      <div className='flex items-center gap-1'>
                        <CreditCard className='h-3.5 w-3.5' />
                        <span>
                          Next payment{' '}
                          <span className='font-medium text-foreground'>
                            {new Date(
                              subscription.nextPayment.date
                            ).toLocaleDateString()}
                          </span>
                          {typeof subscription.nextPayment.amount ===
                            'object' &&
                            subscription.nextPayment.amount.amountFormatted && (
                              <>
                                {' '}
                                (
                                <span className='font-medium text-foreground'>
                                  {
                                    subscription.nextPayment.amount
                                      .amountFormatted
                                  }
                                </span>
                                )
                              </>
                            )}
                        </span>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Status badge */}
            <Badge
              variant={
                subscription.status === 'active'
                  ? 'default'
                  : subscription.status === 'past_due'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {subscription.status || 'Unknown'}
            </Badge>
          </div>
        ) : (
          <p className='text-muted-foreground'>No active subscription found.</p>
        )}
      </PageSection>

      {/* Statements Section */}
      <PageSection
        header={<SectionHeader icon={FileText} title='Recent Statements' />}
      >
        {statementsError ? (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              Failed to load statements. Please try again later.
            </AlertDescription>
          </Alert>
        ) : statements && statements.length > 0 ? (
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Period</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statements.map(statement => (
                  <TableRow key={statement.id}>
                    <TableCell className='text-foreground'>
                      {statement.timestamp
                        ? new Date(statement.timestamp).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell className='font-medium text-foreground'>
                      {statement.totals?.grandTotal?.amountFormatted || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          statement.status === 'closed'
                            ? 'default'
                            : statement.status === 'open'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {statement.status || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {statement.groups?.[0]?.items?.[0]?.subscriptionItem
                        ?.periodStart &&
                      statement.groups?.[0]?.items?.[0]?.subscriptionItem
                        ?.periodEnd
                        ? `${new Date(statement.groups[0].items[0].subscriptionItem.periodStart).toLocaleDateString()} - ${new Date(statement.groups[0].items[0].subscriptionItem.periodEnd).toLocaleDateString()}`
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className='text-muted-foreground'>No statements found.</p>
        )}
      </PageSection>

      {/* Payment Attempts Section */}
      <PageSection
        header={<SectionHeader icon={DollarSign} title='Recent Payments' />}
      >
        {paymentAttemptsError ? (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              Failed to load payment attempts. Please try again later.
            </AlertDescription>
          </Alert>
        ) : paymentAttempts && paymentAttempts.length > 0 ? (
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentAttempts.map(attempt => (
                  <TableRow key={attempt.id}>
                    <TableCell className='text-foreground'>
                      {attempt.paidAt
                        ? new Date(attempt.paidAt).toLocaleDateString()
                        : attempt.updatedAt
                          ? new Date(attempt.updatedAt).toLocaleDateString()
                          : 'N/A'}
                    </TableCell>
                    <TableCell className='font-medium text-foreground'>
                      {attempt.amount?.amountFormatted || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          attempt.status === 'paid'
                            ? 'default'
                            : attempt.status === 'failed'
                              ? 'destructive'
                              : attempt.status === 'pending'
                                ? 'secondary'
                                : 'outline'
                        }
                      >
                        {attempt.status || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {attempt.paymentMethod?.cardType &&
                      attempt.paymentMethod?.last4
                        ? `${attempt.paymentMethod.cardType} ****${attempt.paymentMethod.last4}`
                        : attempt.paymentMethod
                          ? 'Payment method on file'
                          : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className='text-muted-foreground'>No payment attempts found.</p>
        )}
      </PageSection>
    </div>
  )
}
