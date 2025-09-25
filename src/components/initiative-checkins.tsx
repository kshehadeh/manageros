import { CheckInList } from '@/components/checkin-list'

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
    <div className='page-section'>
      <div className='card'>
        <CheckInList
          initiativeId={initiativeId}
          initiativeTitle={initiativeTitle}
          checkIns={checkIns.map(ci => ({
            ...ci,
            summary: ci.summary || '',
          }))}
        />
      </div>
    </div>
  )
}
