'use client'

import { SignedIn } from '@clerk/nextjs'
import { SubscriptionDetailsButton } from '@clerk/nextjs/experimental'
import { Button } from '@/components/ui/button'
import { dark } from '@clerk/themes'

export function OrganizationSubscriptionButton() {
  return (
    <SignedIn>
      <SubscriptionDetailsButton
        subscriptionDetailsProps={{
          appearance: dark,
        }}
      >
        <Button variant='outline' size='sm'>
          Manage Subscription
        </Button>
      </SubscriptionDetailsButton>
    </SignedIn>
  )
}
