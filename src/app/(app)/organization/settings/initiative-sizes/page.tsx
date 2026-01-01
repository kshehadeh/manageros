import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { requireAdmin } from '@/lib/auth-utils'
import { getInitiativeSizeDefinitions } from '@/lib/actions/organization'
import { InitiativeSizeDefinitionsForm } from '@/components/organization/initiative-size-definitions-form'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'

export default async function InitiativeSizesPage() {
  await requireAdmin()

  const definitions = await getInitiativeSizeDefinitions()

  const pathname = '/organization/settings/initiative-sizes'
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Organization Settings', href: '/organization/settings' },
    { name: 'Initiative Sizes', href: pathname },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PageContainer>
        <PageHeader
          title='Initiative Size Definitions'
          subtitle='Define what each initiative size (XS, S, M, L, XL) means for your organization. These definitions help team members consistently estimate effort.'
        />

        <PageContent>
          <InitiativeSizeDefinitionsForm initialDefinitions={definitions} />
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
