'use client'

import { Link } from '@/components/ui/link'
import { useState } from 'react'
import { FeedbackForm } from '@/components/feedback/feedback-form'
import {
  type Person,
  type Team,
  type PersonJiraAccount,
  type PersonGithubAccount,
} from '@prisma/client'
import {
  Plus,
  Rocket,
  ListTodo,
  MessageCircle,
  Handshake,
  Eye,
  Edit,
  Link as LinkIcon,
} from 'lucide-react'
import { ActionDropdown } from '@/components/common/action-dropdown'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AccountLinkingModal } from './account-linking-modal'

interface LinkedUser {
  id: string
  name: string
  email: string
  role?: string | null
}

interface PersonActionsDropdownProps {
  person: Person & {
    team?: Team | null
    reports?: Person[]
    manager?: Person | null
  }
  currentPersonId?: string | null
  isAdmin: boolean
  onFeedbackAdded?: () => void
  size?: 'sm' | 'default'
  linkedUser?: LinkedUser | null
  jiraAccount?: PersonJiraAccount | null
  githubAccount?: PersonGithubAccount | null
}

export function PersonActionsDropdown({
  person,
  currentPersonId,
  isAdmin,
  onFeedbackAdded,
  size = 'default',
  linkedUser,
  jiraAccount,
  githubAccount,
}: PersonActionsDropdownProps) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [showAccountLinking, setShowAccountLinking] = useState(false)

  const handleFeedbackSuccess = () => {
    setShowFeedbackForm(false)
    onFeedbackAdded?.()
  }

  const handleFeedbackCancel = () => {
    setShowFeedbackForm(false)
  }

  const canCreateOneOnOne = currentPersonId && currentPersonId !== person.id

  const canCreateFeedbackCampaign =
    person.managerId === currentPersonId ||
    (currentPersonId === person.id && (person.reports?.length ?? 0) > 0)

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
                href={`/oneonones/new?participant1Id=${currentPersonId || ''}&participant2Id=${person.id}`}
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
                Feedback 360
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

            {isAdmin && (
              <button
                className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left'
                onClick={() => {
                  setShowAccountLinking(true)
                  close()
                }}
              >
                <LinkIcon className='w-4 h-4' />
                Link Accounts
              </button>
            )}
          </div>
        )}
      </ActionDropdown>

      <Dialog open={showFeedbackForm} onOpenChange={setShowFeedbackForm}>
        <DialogContent>
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

      <AccountLinkingModal
        open={showAccountLinking}
        onOpenChange={setShowAccountLinking}
        personId={person.id}
        personName={person.name}
        personEmail={person.email}
        linkedUser={linkedUser}
        jiraAccount={jiraAccount}
        githubAccount={githubAccount}
      />
    </>
  )
}
