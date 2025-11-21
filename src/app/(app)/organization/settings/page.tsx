import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { OrganizationSettingsBreadcrumbClient } from '@/components/organization/organization-settings-breadcrumb-client'
import { OrganizationProfile } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export default async function OrganizationSettingsPage() {
  const user = await getCurrentUser()

  // Check if user is admin
  if (!isAdminOrOwner(user)) {
    redirect('/dashboard')
  }

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    redirect('/dashboard')
  }

  return (
    <OrganizationSettingsBreadcrumbClient>
      <PageContainer>
        <PageHeader
          title='Organization Settings'
          subtitle="Manage your organization's settings and configuration"
        />

        <PageContent>
          <OrganizationProfile appearance={dark} routing='hash' />
        </PageContent>
      </PageContainer>
    </OrganizationSettingsBreadcrumbClient>
  )
}
