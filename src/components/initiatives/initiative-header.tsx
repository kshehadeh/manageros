import { Rag } from '@/components/rag'
import { InitiativeActionsDropdown } from '@/components/initiatives/initiative-actions-dropdown'
import { Rocket } from 'lucide-react'

interface InitiativeHeaderProps {
  initiative: {
    id: string
    title: string
    rag: string
    completionRate: number
  }
}

export function InitiativeHeader({ initiative }: InitiativeHeaderProps) {
  return (
    <div className='page-header'>
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <div className='flex items-center gap-3 mb-2'>
            <Rocket className='h-6 w-6 text-muted-foreground' />
            <h1 className='page-title'>{initiative.title}</h1>
            <div className='flex items-center gap-2'>
              <Rag rag={initiative.rag} />
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary'>
                {initiative.completionRate}% complete
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <InitiativeActionsDropdown initiativeId={initiative.id} />
      </div>
    </div>
  )
}
