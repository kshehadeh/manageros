'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PricingTable } from '@clerk/nextjs'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { CreditCard, Building, CheckCircle2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@clerk/nextjs'

export default function SubscribePage() {
  const router = useRouter()
  const { isLoaded, userId } = useAuth()
  const [isChecking, setIsChecking] = useState(true)
  const [subscription, setSubscription] = useState<{
    planId: string
    status: string
    planName: string | null
  } | null>(null)

  // Handle free tier selection - user explicitly chooses free plan
  const handleFreeTier = () => {
    router.push('/organization/create?plan=free')
  }

  // Handle create organization for users who have subscribed
  const handleCreateOrganization = () => {
    if (subscription?.planId) {
      router.push(`/organization/create?planId=${subscription.planId}`)
    }
  }

  // Check if user already has an organization or subscription
  useEffect(() => {
    if (!isLoaded || !userId) {
      setIsChecking(false)
      return
    }

    const checkUser = async () => {
      try {
        const [userResponse, subscriptionResponse] = await Promise.all([
          fetch('/api/user/current'),
          fetch('/api/user/subscription'),
        ])

        if (userResponse.ok) {
          const userData = await userResponse.json()
          if (userData.user?.organizationId) {
            // User already has an organization, redirect to dashboard
            router.push('/dashboard')
            return
          }
        }

        // Check for subscription (but don't auto-redirect)
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json()
          const sub = subscriptionData.subscription

          if (sub?.planId && sub?.status === 'active') {
            // User has active subscription - store it so we can show create button
            setSubscription({
              planId: sub.planId,
              status: sub.status,
              planName: sub.planName || null,
            })
          }
        }
      } catch (error) {
        // Error checking user - continue to show subscription page
        console.error('Error checking user:', error)
      } finally {
        setIsChecking(false)
      }
    }
    checkUser()
  }, [isLoaded, userId, router])

  if (isChecking) {
    return (
      <PageContainer>
        <div className='flex items-center justify-center py-12'>
          <div className='text-muted-foreground'>Loading...</div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title='Choose Your Plan'
        titleIcon={CreditCard}
        subtitle='Select a subscription plan before creating your organization'
      />
      <PageContent>
        <div className='space-y-6'>
          {subscription ? (
            <>
              {/* Show subscription active card if user has a paid subscription */}
              <PageSection
                variant='bordered'
                header={
                  <SectionHeader
                    icon={CheckCircle2}
                    title='Subscription Active'
                    action={
                      <Button
                        onClick={handleCreateOrganization}
                        variant='default'
                      >
                        <Building className='w-4 h-4 mr-2' />
                        Create Organization
                      </Button>
                    }
                  />
                }
              >
                <p className='text-sm text-muted-foreground'>
                  You&apos;re subscribed to{' '}
                  <span className='font-medium'>{subscription.planName}</span>.
                  Create your organization to get started.
                </p>
              </PageSection>

              {/* Clerk PricingTable for changing subscription */}
              <PageSection
                variant='bordered'
                header={
                  <SectionHeader
                    icon={Package}
                    title='Change Subscription'
                    description='Manage your subscription or switch to a different plan.'
                  />
                }
              >
                <PricingTable />
              </PageSection>
            </>
          ) : (
            <>
              <PageSection
                variant='bordered'
                header={
                  <SectionHeader
                    icon={Package}
                    title='Choose Your Plan'
                    description='Before creating a new organization, please choose a subscription plan. You can continue with the free plan or upgrade to a paid plan with additional features.'
                  />
                }
              >
                {/* Free tier option - default choice */}
                <div className='p-4 border rounded-lg bg-muted/50'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h3 className='font-semibold text-lg mb-1'>
                        Solo Plan (Free)
                      </h3>
                      <p className='text-sm text-muted-foreground'>
                        Perfect for small teams. Up to 5 employees, 10 open
                        initiatives, 2 concurrent feedback campaigns, and 2
                        teams.
                      </p>
                    </div>
                    <Button onClick={handleFreeTier} variant='default'>
                      Continue with Free Plan
                    </Button>
                  </div>
                </div>
              </PageSection>

              {/* Clerk PricingTable for paid plans */}
              <PageSection
                variant='bordered'
                header={
                  <SectionHeader
                    icon={CreditCard}
                    title='Upgrade to Paid Plan'
                    description='Upgrade to unlock unlimited features. After subscribing, click "Create Organization" above to get started.'
                  />
                }
              >
                <PricingTable />
              </PageSection>
            </>
          )}
        </div>
      </PageContent>
    </PageContainer>
  )
}
