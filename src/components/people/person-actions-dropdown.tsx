'use client'

import { Link } from '@/components/ui/link'
import { useState } from 'react'
import { FeedbackForm } from '@/components/feedback/feedback-form'
import {
  type Person,
  type Team,
  type PersonJiraAccount,
  type PersonGithubAccount,
} from '@/generated/prisma'
import {
  Plus,
  Rocket,
  ListTodo,
  MessageCircle,
  Handshake,
  Edit,
  Link as LinkIcon,
  ClipboardList,
} from 'lucide-react'
import { ActionDropdown } from '@/components/common/action-dropdown'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AccountLinkingModal } from './account-linking-modal'
import { StartOnboardingModal } from '@/components/onboarding/start-onboarding-modal'
import { AssociateInitiativeModal } from './sections/associate-initiative-modal'

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
  people?: Pick<Person, 'id' | 'name'>[]
  organizationId?: string
}

export function PersonActionsDropdown({
  person,
  currentPersonId,
  isAdmin,
  onFeedbackAdded,
  size = 'sm',
  linkedUser,
  jiraAccount,
  githubAccount,
  people = [],
  organizationId,
}: PersonActionsDropdownProps) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [showAccountLinking, setShowAccountLinking] = useState(false)
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  const [showAssociateInitiativeModal, setShowAssociateInitiativeModal] =
    useState(false)
  const [existingInitiativeIds, setExistingInitiativeIds] = useState<string[]>(
    []
  )

  const handleFeedbackSuccess = () => {
    setShowFeedbackForm(false)
    onFeedbackAdded?.()
  }

  const handleFeedbackCancel = () => {
    setShowFeedbackForm(false)
  }

  const canCreateOneOnOne = currentPersonId && currentPersonId !== person.id

  // Helper component for separators
  const Separator = () => <div className='h-px bg-border my-1' />

  return (
    <>
      <ActionDropdown size={size}>
        {({ close }) => (
          <div className='py-1'>
            {/* Edit Person */}
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

            {/* Other Actions */}
            {(isAdmin || !showFeedbackForm || canCreateOneOnOne) && (
              <>
                {isAdmin && <Separator />}
                {isAdmin && (
                  <>
                    <Link
                      href={`/people/new?managerId=${person.id}`}
                      className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                      onClick={close}
                    >
                      <Plus className='w-4 h-4' />
                      Add Report
                    </Link>
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
                    {organizationId && (
                      <button
                        className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left'
                        onClick={async () => {
                          close()
                          // Fetch existing initiative IDs before opening modal
                          try {
                            const response = await fetch(
                              `/api/initiatives?ownerId=${person.id}&limit=100`
                            )
                            if (response.ok) {
                              const data = await response.json()
                              const ids =
                                data.initiatives?.map(
                                  (init: { id: string }) => init.id
                                ) || []
                              setExistingInitiativeIds(ids)
                            }
                          } catch (error) {
                            console.error(
                              'Error fetching existing initiatives:',
                              error
                            )
                            setExistingInitiativeIds([])
                          }
                          setShowAssociateInitiativeModal(true)
                        }}
                      >
                        <LinkIcon className='w-4 h-4' />
                        Associate Initiative
                      </button>
                    )}
                    <Link
                      href={`/tasks/new?assigneeId=${person.id}`}
                      className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                      onClick={close}
                    >
                      <ListTodo className='w-4 h-4' />
                      New Task
                    </Link>
                  </>
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
                {isAdmin && (
                  <button
                    className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left'
                    onClick={() => {
                      setShowOnboardingModal(true)
                      close()
                    }}
                  >
                    <ClipboardList className='w-4 h-4' />
                    Start Onboarding
                  </button>
                )}
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
              </>
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

      <StartOnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        person={{
          id: person.id,
          name: person.name,
          teamId: person.teamId,
          jobRoleId: person.jobRoleId,
          managerId: person.managerId,
        }}
        people={people}
      />

      {organizationId && (
        <AssociateInitiativeModal
          isOpen={showAssociateInitiativeModal}
          onClose={() => setShowAssociateInitiativeModal(false)}
          personId={person.id}
          organizationId={organizationId}
          existingInitiativeIds={existingInitiativeIds}
        />
      )}
    </>
  )
}
