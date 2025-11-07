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
      <div className='flex items-start justify-between gap-4'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-3 mb-2 min-w-0'>
            <Rocket className='hidden md:block h-6 w-6 text-muted-foreground shrink-0' />
            <h1 className='page-title truncate'>{initiative.title}</h1>
          </div>
          {/* Subheader with RAG and % complete */}
          <div className='flex items-center gap-2 ml-0 md:ml-9'>
            <Rag rag={initiative.rag} />
            <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary'>
              {initiative.completionRate}% complete
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <InitiativeActionsDropdown initiativeId={initiative.id} />
      </div>
    </div>
  )
}
