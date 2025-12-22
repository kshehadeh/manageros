'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SimplePeopleList } from '@/components/people/person-list'
import type { PersonForList } from '@/components/people/person-list'

interface PeopleListModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  people: PersonForList[]
  emptyStateText?: string
}

/**
 * Modal component for displaying a list of people
 */
export function PeopleListModal({
  isOpen,
  onClose,
  title,
  people,
  emptyStateText = 'No people found.',
}: PeopleListModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent size='md'>
        <DialogHeader>
          <DialogTitle className='text-lg font-bold font-mono'>
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className='mt-4 max-h-[60vh] overflow-y-auto'>
          <SimplePeopleList
            people={people}
            variant='compact'
            emptyStateText={emptyStateText}
            showEmail={true}
            showRole={true}
            showTeam={true}
            showJobRole={true}
            showManager={true}
            showReportsCount={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
