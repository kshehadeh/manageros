import { InitiativeDataTable } from '@/components/initiatives/data-table'
import { SectionHeader } from '@/components/ui/section-header'
import { Rocket } from 'lucide-react'

interface OwnedInitiativesSectionProps {
  personId: string
  organizationId: string
}

export async function OwnedInitiativesSection({
  personId,
  organizationId,
}: OwnedInitiativesSectionProps) {
  if (!organizationId) {
    return null
  }

  return (
    <section>
      <SectionHeader icon={Rocket} title='Owned Initiatives' />
      <InitiativeDataTable
        hideFilters={true}
        enablePagination={false}
        limit={100}
        immutableFilters={{
          ownerId: personId,
        }}
        settingsId={`person-${personId}-initiatives`}
      />
    </section>
  )
}
