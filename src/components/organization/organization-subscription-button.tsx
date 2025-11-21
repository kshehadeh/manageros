'use client'

import { OrganizationProfile, SignedIn } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export function OrganizationSubscriptionButton() {
  return (
    <SignedIn>
      <OrganizationProfile appearance={dark} />
    </SignedIn>
  )
}
