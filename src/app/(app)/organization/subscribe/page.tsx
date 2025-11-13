'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PricingTable } from '@clerk/nextjs'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@clerk/nextjs'

export default function SubscribePage() {
  const router = useRouter()
  const { isLoaded, userId } = useAuth()
  const [isChecking, setIsChecking] = useState(true)

  // Handle free tier selection
  const handleFreeTier = () => {
    router.push('/organization/create?plan=free')
  }

  // Check if user already has an organization (shouldn't be here if they do)
  useEffect(() => {
    if (!isLoaded || !userId) {
      setIsChecking(false)
      return
    }

    const checkUser = async () => {
      try {
        const response = await fetch('/api/user/current')
        if (response.ok) {
          const data = await response.json()
          if (data.user?.organizationId) {
            // User already has an organization, redirect to dashboard
            router.push('/dashboard')
            return
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
      <div className='space-y-6'>
        <div className='rounded-lg border bg-card p-6'>
          <p className='text-sm text-muted-foreground mb-6'>
            Before creating a new organization, please select a subscription
            plan. You can choose the free tier or start a trial with our paid
            plan.
          </p>

          {/* Free tier option */}
          <div className='mb-6 p-4 border rounded-lg bg-muted/50'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='font-semibold text-lg mb-1'>Solo Plan (Free)</h3>
                <p className='text-sm text-muted-foreground'>
                  Perfect for small teams. Up to 5 employees, 10 open
                  initiatives, 2 concurrent feedback campaigns, and 2 teams.
                </p>
              </div>
              <Button onClick={handleFreeTier} variant='outline'>
                Select Free Plan
              </Button>
            </div>
          </div>

          {/* Clerk PricingTable for paid plans */}
          <div className='mt-8'>
            <h3 className='font-semibold text-lg mb-4'>Paid Plans</h3>
            <p className='text-sm text-muted-foreground mb-4'>
              After subscribing to a paid plan, you&apos;ll be redirected to
              create your organization.
            </p>
            <PricingTable />
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
