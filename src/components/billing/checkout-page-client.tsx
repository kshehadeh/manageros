'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckoutProvider,
  useCheckout,
  PaymentElementProvider,
  PaymentElement,
  usePaymentElement,
  usePaymentMethods,
} from '@clerk/nextjs/experimental'
import { ClerkLoaded, SignedIn } from '@clerk/nextjs'
import {
  ArrowLeft,
  Loader2,
  CreditCard,
  Check,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

interface CheckoutPageClientProps {
  planId: string
  planPeriod: 'month' | 'annual'
  organizationId: string
  clerkOrganizationId: string
}

export function CheckoutPageClient({
  planId,
  planPeriod,
}: CheckoutPageClientProps) {
  return (
    <ClerkLoaded>
      <SignedIn>
        <CheckoutProvider
          for='organization'
          planId={planId}
          planPeriod={planPeriod}
        >
          <CheckoutContent />
        </CheckoutProvider>
      </SignedIn>
    </ClerkLoaded>
  )
}

function CheckoutContent() {
  const { checkout } = useCheckout()
  const {
    status,
    plan,
    totals,
    start,
    isStarting,
    error: checkoutError,
  } = checkout

  // Start checkout on mount if needed
  useEffect(() => {
    if (status === 'needs_initialization') {
      start()
    }
  }, [status, start])

  if (isStarting || status === 'needs_initialization') {
    return (
      <div className='max-w-2xl mx-auto'>
        <div className='flex flex-col items-center justify-center py-12 gap-4'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          <p className='text-muted-foreground'>Initializing checkout...</p>
        </div>
      </div>
    )
  }

  if (checkoutError) {
    return (
      <div className='max-w-2xl mx-auto'>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            {checkoutError.message ||
              'Failed to initialize checkout. Please try again.'}
          </AlertDescription>
        </Alert>
        <div className='mt-4'>
          <Button asChild variant='outline'>
            <Link href='/organization/plans'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Plans
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='mx-auto space-y-6'>
      {/* Back button */}
      <Button asChild variant='ghost' size='sm'>
        <Link href='/organization/plans' className='flex items-center gap-2'>
          <ArrowLeft className='h-4 w-4' />
          Back to Plans
        </Link>
      </Button>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>Review your subscription details</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex justify-between items-center'>
            <div>
              <p className='font-medium'>{plan?.name}</p>
              <p className='text-sm text-muted-foreground'>
                {checkout.planPeriod === 'annual' ? 'Annual' : 'Monthly'}{' '}
                billing
              </p>
            </div>
            <div className='text-right'>
              <p className='font-semibold text-lg'>
                {totals?.totalDueNow?.currencySymbol}
                {totals?.totalDueNow?.amountFormatted}
              </p>
              <p className='text-sm text-muted-foreground'>
                {checkout.planPeriod === 'annual' ? '/year' : '/month'}
              </p>
            </div>
          </div>

          {/* Free trial info */}
          {checkout.freeTrialEndsAt && (
            <div className='rounded-lg bg-primary/10 p-3'>
              <p className='text-sm'>
                Your free trial ends on{' '}
                <span className='font-medium'>
                  {new Date(checkout.freeTrialEndsAt).toLocaleDateString()}
                </span>
              </p>
            </div>
          )}

          {/* Plan features */}
          {plan?.features && plan.features.length > 0 && (
            <div className='border-t pt-4'>
              <p className='text-sm font-medium mb-2'>Included features:</p>
              <ul className='space-y-1'>
                {plan.features.slice(0, 5).map(feature => (
                  <li
                    key={feature.id}
                    className='text-sm text-muted-foreground flex items-center gap-2'
                  >
                    <Check className='h-4 w-4 text-primary' />
                    {feature.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Section */}
      {checkout.needsPaymentMethod && (
        <PaymentElementProvider checkout={checkout} for='organization'>
          <PaymentSection />
        </PaymentElementProvider>
      )}

      {/* If no payment method needed (e.g., free trial), show confirm button */}
      {!checkout.needsPaymentMethod && status === 'needs_confirmation' && (
        <ConfirmWithoutPaymentSection />
      )}
    </div>
  )
}

function PaymentSection() {
  const router = useRouter()
  const { checkout } = useCheckout()
  const { submit, isFormReady } = usePaymentElement()
  const { data: paymentMethods, isLoading: isLoadingPaymentMethods } =
    usePaymentMethods({ for: 'organization' })

  const [paymentMethod, setPaymentMethod] = useState<'new' | string>('new')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { confirm, finalize, isConfirming } = checkout

  const hasExistingPaymentMethods = paymentMethods && paymentMethods.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsProcessing(true)

    try {
      if (paymentMethod === 'new') {
        // Submit new payment method
        const { data, error: submitError } = await submit()

        if (submitError) {
          // Usually a validation error from Stripe
          setIsProcessing(false)
          return
        }

        if (data) {
          // Confirm checkout with new payment token
          const confirmResult = await confirm({
            paymentToken: data.paymentToken,
            gateway: data.gateway,
          })

          if (confirmResult.error) {
            setError(confirmResult.error.message || 'Payment failed')
            setIsProcessing(false)
            return
          }
        }
      } else {
        // Use existing payment method
        const confirmResult = await confirm({
          paymentMethodId: paymentMethod,
        })

        if (confirmResult.error) {
          setError(confirmResult.error.message || 'Payment failed')
          setIsProcessing(false)
          return
        }
      }

      // Finalize and redirect
      await finalize({
        navigate: () => router.push('/organization/plans'),
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      )
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <CreditCard className='h-5 w-5' />
          Payment Method
        </CardTitle>
        <CardDescription>
          Select a payment method or add a new one
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Existing payment methods */}
          {!isLoadingPaymentMethods && hasExistingPaymentMethods && (
            <div className='space-y-3'>
              <Label>Select payment method</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className='space-y-2'
              >
                {paymentMethods.map(method => (
                  <div
                    key={method.id}
                    className='flex items-center space-x-2 rounded-lg border p-3'
                  >
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label
                      htmlFor={method.id}
                      className='flex-1 cursor-pointer'
                    >
                      <div className='flex items-center gap-2'>
                        <CreditCard className='h-4 w-4' />
                        <span className='capitalize'>{method.cardType}</span>
                        <span>•••• {method.last4}</span>
                        <span className='text-muted-foreground text-sm'>
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </span>
                        {method.isDefault && (
                          <span className='text-xs bg-primary/10 text-primary px-2 py-0.5 rounded'>
                            Default
                          </span>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
                <div className='flex items-center space-x-2 rounded-lg border p-3'>
                  <RadioGroupItem value='new' id='new-payment' />
                  <Label
                    htmlFor='new-payment'
                    className='flex-1 cursor-pointer'
                  >
                    Add new payment method
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* New payment element */}
          {(paymentMethod === 'new' || !hasExistingPaymentMethods) && (
            <div className='space-y-3'>
              {hasExistingPaymentMethods && <Label>Enter card details</Label>}
              <div className='rounded-lg border p-4'>
                <PaymentElement
                  fallback={
                    <div className='flex items-center justify-center py-8'>
                      <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                    </div>
                  }
                />
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit button */}
          <Button
            type='submit'
            className='w-full'
            disabled={
              isProcessing ||
              isConfirming ||
              (paymentMethod === 'new' && !isFormReady)
            }
          >
            {isProcessing || isConfirming ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Processing...
              </>
            ) : (
              <>
                Complete Purchase
                {checkout.totals?.totalDueNow && (
                  <span className='ml-2'>
                    ({checkout.totals.totalDueNow.currencySymbol}
                    {checkout.totals.totalDueNow.amountFormatted})
                  </span>
                )}
              </>
            )}
          </Button>

          <p className='text-xs text-center text-muted-foreground'>
            Your payment is processed securely. By completing this purchase, you
            agree to our terms of service.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

function ConfirmWithoutPaymentSection() {
  const router = useRouter()
  const { checkout } = useCheckout()
  const { confirm, finalize, isConfirming } = checkout
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setError(null)
    setIsProcessing(true)

    try {
      const confirmResult = await confirm({})

      if (confirmResult.error) {
        setError(confirmResult.error.message || 'Confirmation failed')
        setIsProcessing(false)
        return
      }

      // Finalize and redirect
      await finalize({
        navigate: () => router.push('/organization/plans'),
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      )
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm Your Subscription</CardTitle>
        <CardDescription>
          Click below to complete your subscription change
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {error && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleConfirm}
          className='w-full'
          disabled={isProcessing || isConfirming}
        >
          {isProcessing || isConfirming ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Processing...
            </>
          ) : (
            'Confirm Subscription'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
