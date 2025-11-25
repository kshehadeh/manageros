import { getOrganizationSubscription } from '@/lib/subscription-utils'
import { OrganizationSection } from './organization-section'

interface OrganizationSectionServerProps {
  organizationId: string
  organizationName: string
  organizationSlug: string | null
  isAdmin: boolean
}

export async function OrganizationSectionServer({
  organizationId,
  organizationName,
  organizationSlug,
  isAdmin,
}: OrganizationSectionServerProps) {
  const subscription = await getOrganizationSubscription(organizationId)
  const billingPlanName = subscription?.subscriptionPlanName || null

  return (
    <OrganizationSection
      organizationId={organizationId}
      organizationName={organizationName}
      organizationSlug={organizationSlug}
      billingPlanName={billingPlanName}
      isAdmin={isAdmin}
    />
  )
}
