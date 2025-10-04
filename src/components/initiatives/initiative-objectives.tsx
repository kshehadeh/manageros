import { Target, TargetIcon } from 'lucide-react'
import { SectionHeader } from '@/components/ui/section-header'
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
      <SectionHeader
        icon={Target}
        title='Objectives & Key Results'
        action={<CreateObjectiveModal initiativeId={initiativeId} />}
        className='mb-4'
      />
      <div className='space-y-4'>
        {objectives.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <TargetIcon className='h-8 w-8 text-muted-foreground mb-2' />
            <p className='text-muted-foreground text-sm mb-4'>
              No objectives yet
            </p>
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
