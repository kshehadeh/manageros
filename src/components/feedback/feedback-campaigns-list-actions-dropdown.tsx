'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ActionDropdown } from '@/components/common/action-dropdown'
import { Plus, ChevronDown, Pickaxe } from 'lucide-react'
import { FeedbackCampaignPersonSelectorModal } from './feedback-campaign-person-selector-modal'

interface FeedbackCampaignsListActionsDropdownProps {
  canCreateCampaign?: boolean
}

export function FeedbackCampaignsListActionsDropdown({
  canCreateCampaign = true,
}: FeedbackCampaignsListActionsDropdownProps) {
  const [showPersonSelector, setShowPersonSelector] = useState(false)

  if (!canCreateCampaign) {
    return null
  }

  return (
    <>
      <ActionDropdown
        trigger={({ toggle }) => (
          <Button
            variant='outline'
            size='sm'
            className='flex items-center gap-2'
            onClick={toggle}
          >
            <Pickaxe className='w-4 h-4' />
            <span className='hidden sm:inline'>Actions</span>
            <ChevronDown className='w-4 h-4' />
          </Button>
        )}
      >
        {({ close }) => (
          <div className='py-1'>
            {canCreateCampaign && (
              <button
                className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left'
                onClick={() => {
                  setShowPersonSelector(true)
                  close()
                }}
              >
                <Plus className='w-4 h-4' />
                Create Campaign
              </button>
            )}
          </div>
        )}
      </ActionDropdown>

      <FeedbackCampaignPersonSelectorModal
        open={showPersonSelector}
        onOpenChange={setShowPersonSelector}
      />
    </>
  )
}
