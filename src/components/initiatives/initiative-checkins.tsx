import { CheckInList } from '@/components/checkin-list'
import { PageSection } from '@/components/ui/page-section'

interface InitiativeCheckInsProps {
  initiativeId: string
  initiativeTitle: string
  checkIns: Array<{
    id: string
    weekOf: string
    rag: string
    confidence: number
    summary: string | null
    blockers: string | null
    nextSteps: string | null
    createdAt: string
    createdBy: {
      id: string
      name: string
    }
  }>
}

export function InitiativeCheckIns({
  initiativeId,
  initiativeTitle,
  checkIns,
}: InitiativeCheckInsProps) {
  return (
    <PageSection>
      <CheckInList
        initiativeId={initiativeId}
        initiativeTitle={initiativeTitle}
        checkIns={checkIns.map(ci => ({
          ...ci,
          summary: ci.summary || '',
        }))}
      />
    </PageSection>
  )
}
