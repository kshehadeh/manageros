'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PersonAvatarWrapper } from './person-avatar-wrapper'
import { PersonStatusBadge } from './person-status-badge'
import {
  SimpleInitiativeList,
  type Initiative,
} from '@/components/initiatives/initiative-list'
import { SimpleTaskList, type Task } from '@/components/tasks/task-list'
import { SimpleFeedbackList } from '@/components/feedback/feedback-list'
import { getPersonSummaryForModal } from '@/lib/actions/person'
import {
  Loader2,
  ExternalLink,
  Mail,
  Briefcase,
  User,
  MessageCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface PersonDetailModalProps {
  personId: string
  isOpen: boolean
  onClose: () => void
}

interface PersonSummaryData {
  id: string
  name: string
  email: string | null
  role: string | null
  title: string | null
  status: string
  avatar: string | null
  jiraAvatar?: string
  githubAvatar?: string
  initiatives: Initiative[]
  tasks: Task[]
  feedback: Array<{
    id: string
    kind: string
    isPrivate: boolean
    body: string
    createdAt: Date
    about: { id: string; name: string }
    from: { id: string; name: string }
    fromId?: string
  }>
}

export function PersonDetailModal({
  personId,
  isOpen,
  onClose,
}: PersonDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [personData, setPersonData] = useState<PersonSummaryData | null>(null)

  useEffect(() => {
    if (isOpen && personId) {
      const loadPersonData = async () => {
        setLoading(true)
        try {
          const data = await getPersonSummaryForModal(personId)

          if (!data) {
            toast.error('Failed to load person data')
            onClose()
            return
          }

          setPersonData(data)
        } catch (error) {
          console.error('Error loading person data:', error)
          toast.error('Failed to load person data')
          onClose()
        } finally {
          setLoading(false)
        }
      }

      loadPersonData()
    } else {
      // Reset data when modal closes
      setPersonData(null)
    }
  }, [isOpen, personId, onClose])

  const handleOpenChange = (open: boolean) => {
    if (!open && !loading) {
      onClose()
    }
  }

  if (!personData && !loading) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent size='md' className='overflow-y-auto'>
        <DialogHeader>
          {loading ? (
            <>
              <DialogTitle>Loading person details...</DialogTitle>
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
              </div>
            </>
          ) : personData ? (
            <>
              <div className='flex items-start gap-4'>
                <PersonAvatarWrapper
                  personId={personData.id}
                  personName={personData.name}
                  currentAvatar={personData.avatar}
                  jiraAvatar={personData.jiraAvatar}
                  githubAvatar={personData.githubAvatar}
                  isAdmin={false}
                />
                <div className='flex-1'>
                  <DialogTitle className='flex items-center gap-2 mb-2'>
                    {personData.name}
                    <PersonStatusBadge status={personData.status} size='sm' />
                  </DialogTitle>
                  <div className='space-y-1 text-sm text-muted-foreground'>
                    {personData.email && (
                      <div className='flex items-center gap-2'>
                        <Mail className='w-4 h-4' />
                        <span>{personData.email}</span>
                      </div>
                    )}
                    {personData.role && (
                      <div className='flex items-center gap-2'>
                        <User className='w-4 h-4' />
                        <span>{personData.role}</span>
                      </div>
                    )}
                    {personData.title && (
                      <div className='flex items-center gap-2'>
                        <Briefcase className='w-4 h-4' />
                        <span>{personData.title}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </DialogHeader>

        {personData && (
          <div className='space-y-6 mt-4'>
            {/* Initiatives Section */}
            {personData.initiatives.length > 0 && (
              <div>
                <h3 className='text-sm font-semibold mb-3'>Initiatives</h3>
                <SimpleInitiativeList
                  initiatives={personData.initiatives}
                  variant='compact'
                  emptyStateText='No initiatives found.'
                  interactive={false}
                />
              </div>
            )}

            {/* Tasks Section */}
            {personData.tasks.length > 0 && (
              <div>
                <h3 className='text-sm font-semibold mb-3'>Active Tasks</h3>
                <SimpleTaskList
                  tasks={personData.tasks}
                  variant='compact'
                  emptyStateText='No active tasks found.'
                  interactive={false}
                />
              </div>
            )}

            {/* Feedback Section */}
            {personData.feedback.length > 0 && (
              <div>
                <h3 className='text-sm font-semibold mb-3 flex items-center gap-2'>
                  <MessageCircle className='w-4 h-4' />
                  Recent Feedback
                </h3>
                <SimpleFeedbackList
                  feedback={personData.feedback}
                  emptyStateText='No feedback found.'
                  maxTextLength={120}
                />
              </div>
            )}

            {/* Empty State */}
            {personData.initiatives.length === 0 &&
              personData.tasks.length === 0 &&
              personData.feedback.length === 0 && (
                <div className='text-center py-8 text-sm text-muted-foreground'>
                  No initiatives, tasks, or feedback found.
                </div>
              )}
          </div>
        )}

        {personData && (
          <DialogFooter>
            <Button asChild variant='outline' className='w-full'>
              <Link
                href={`/people/${personData.id}`}
                onClick={onClose}
                className='flex items-center justify-center gap-2'
              >
                <ExternalLink className='w-4 h-4' />
                View Full Profile
              </Link>
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
