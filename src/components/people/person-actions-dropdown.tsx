'use client'

import Link from 'next/link'
import { useState } from 'react'
import { FeedbackForm } from '@/components/feedback/feedback-form'
import { type Person, type Team } from '@prisma/client'
import {
  Plus,
  Rocket,
  ListTodo,
  MessageCircle,
  Handshake,
  Eye,
  Edit,
} from 'lucide-react'
import { ActionDropdown } from '@/components/common/action-dropdown'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PersonActionsDropdownProps {
  person: Person & {
    team?: Team | null
    reports?: Person[]
    manager?: Person | null
  }
  currentPerson?: Person | null
  isAdmin: boolean
  onFeedbackAdded?: () => void
  size?: 'sm' | 'default'
}

export function PersonActionsDropdown({
  person,
  currentPerson,
  isAdmin,
  onFeedbackAdded,
  size = 'default',
}: PersonActionsDropdownProps) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)

  const handleFeedbackSuccess = () => {
    setShowFeedbackForm(false)
    onFeedbackAdded?.()
  }

  const handleFeedbackCancel = () => {
    setShowFeedbackForm(false)
  }

  const canCreateOneOnOne = currentPerson && currentPerson.id !== person.id

  const canCreateFeedbackCampaign =
    person.managerId === currentPerson?.id ||
    (currentPerson?.id === person.id && (person.reports?.length ?? 0) > 0)

  return (
    <>
      <ActionDropdown size={size}>
        {({ close }) => (
          <div className='py-1'>
            {isAdmin && (
              <Link
                href={`/people/${person.id}/edit`}
                className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                onClick={close}
              >
                <Edit className='w-4 h-4' />
                Edit
              </Link>
            )}

            {isAdmin && (
              <Link
                href={`/people/new?managerId=${person.id}`}
                className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                onClick={close}
              >
                <Plus className='w-4 h-4' />
                Add Report
              </Link>
            )}

            {isAdmin && (
              <Link
                href={`/initiatives/new?ownerId=${person.id}${
                  person.team ? `&teamId=${person.team.id}` : ''
                }`}
                className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                onClick={close}
              >
                <Rocket className='w-4 h-4' />
                New Initiative
              </Link>
            )}

            {isAdmin && (
              <Link
                href='/initiatives/new'
                className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                onClick={close}
              >
                <ListTodo className='w-4 h-4' />
                New Task
              </Link>
            )}

            {!showFeedbackForm && (
              <button
                className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left'
                onClick={() => {
                  setShowFeedbackForm(true)
                  close()
                }}
              >
                <MessageCircle className='w-4 h-4' />
                Add Feedback
              </button>
            )}

            {canCreateOneOnOne && (
              <Link
                href={`/oneonones/new?participant1Id=${currentPerson?.id || ''}&participant2Id=${person.id}`}
                className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                onClick={close}
              >
                <Handshake className='w-4 h-4' />
                Add a 1:1
              </Link>
            )}

            {canCreateFeedbackCampaign && (
              <Link
                href={`/people/${person.id}/feedback-campaigns`}
                className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                onClick={close}
              >
                <MessageCircle className='w-4 h-4' />
                Feedback Campaigns
              </Link>
            )}

            <Link
              href='/initiatives'
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={close}
            >
              <Eye className='w-4 h-4' />
              View All Initiatives
            </Link>
          </div>
        )}
      </ActionDropdown>

      <Dialog open={showFeedbackForm} onOpenChange={setShowFeedbackForm}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Add New Feedback</DialogTitle>
          </DialogHeader>
          <FeedbackForm
            person={person}
            onSuccess={handleFeedbackSuccess}
            onCancel={handleFeedbackCancel}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
