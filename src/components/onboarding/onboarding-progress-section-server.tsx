import { getMyOnboardingInstance } from '@/lib/actions/onboarding-instance'
import { OnboardingDashboardWidget } from './onboarding-dashboard-widget'

export async function OnboardingProgressSectionServer() {
  const instance = await getMyOnboardingInstance()

  // Don't render anything if the user doesn't have an active onboarding
  if (!instance) {
    return null
  }

  return <OnboardingDashboardWidget instance={instance} />
}
