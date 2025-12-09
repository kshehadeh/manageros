import { Rag } from '@/components/rag'
import { InitiativeActionsDropdown } from '@/components/initiatives/initiative-actions-dropdown'
import { PageTitle } from '@/components/ui/page-title'
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
          <PageTitle icon={Rocket} className='mb-2 min-w-0'>
            <span className='truncate'>{initiative.title}</span>
          </PageTitle>
          {/* Subheader with RAG and % complete */}
          <div className='flex items-center gap-2 ml-0 md:ml-9'>
            <Rag rag={initiative.rag} />
            <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary'>
              {initiative.completionRate}% complete
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <InitiativeActionsDropdown
          initiativeId={initiative.id}
          initiativeTitle={initiative.title}
        />
      </div>
    </div>
  )
}
