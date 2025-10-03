import { Target } from 'lucide-react'
import { CreateObjectiveModal } from './create-objective-modal'

interface InitiativeObjectivesProps {
  objectives: Array<{
    id: string
    title: string
    keyResult: string | null
    sortIndex: number
  }>
  initiativeId: string
}

export function InitiativeObjectives({
  objectives,
  initiativeId,
}: InitiativeObjectivesProps) {
  return (
    <div className='page-section'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='section-header font-bold flex items-center gap-2'>
          <Target className='w-4 h-4' />
          Objectives & Key Results
        </h3>
        <CreateObjectiveModal initiativeId={initiativeId} />
      </div>
      <div className='space-y-4'>
        {objectives.length === 0 ? (
          <div className='text-muted-foreground text-sm'>
            No objectives yet.
          </div>
        ) : (
          objectives
            .sort((a, b) => a.sortIndex - b.sortIndex)
            .map(objective => (
              <div
                key={objective.id}
                className='border border-border rounded-lg p-4'
              >
                <div className='space-y-2'>
                  <h4 className='font-medium text-sm'>{objective.title}</h4>
                  {objective.keyResult && (
                    <div className='text-sm text-muted-foreground'>
                      <span className='font-medium'>Key Result:</span>{' '}
                      {objective.keyResult}
                    </div>
                  )}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  )
}
