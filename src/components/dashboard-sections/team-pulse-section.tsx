'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { PersonAvatar } from '@/components/people/person-avatar'
import { PersonDetailModal } from '@/components/people/person-detail-modal'
import { format, isFuture, differenceInDays } from 'date-fns'
import { Activity, AlertCircle, ThumbsUp } from 'lucide-react'

interface TeamPulseMember {
  id: string
  name: string
  avatar: string | null
  nextOneOnOne: Date | null
  lastOneOnOne: Date | null
  taskCount: number
  feedbackPending: boolean
  hasRecentNegativeFeedback: boolean
  hasRecentPositiveFeedback: boolean
}

interface TeamPulseSectionProps {
  members: TeamPulseMember[]
}

function formatOneOnOneInfo(
  nextOneOnOne: Date | null,
  lastOneOnOne: Date | null
): string {
  if (nextOneOnOne && isFuture(new Date(nextOneOnOne))) {
    const date = new Date(nextOneOnOne)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'pm' : 'am'
    const displayHours = hours % 12 || 12
    return `Next 1:1: ${displayHours}:${minutes.toString().padStart(2, '0')}${ampm}`
  }

  if (lastOneOnOne) {
    const daysAgo = differenceInDays(new Date(), new Date(lastOneOnOne))
    if (daysAgo === 0) {
      return 'Last 1:1: Today'
    } else if (daysAgo === 1) {
      return 'Last 1:1: Yesterday'
    } else if (daysAgo < 7) {
      return `Last 1:1: ${daysAgo} days ago`
    } else {
      return `Last 1:1: ${format(new Date(lastOneOnOne), 'MMM d')}`
    }
  }

  return 'No 1:1s scheduled'
}

export function TeamPulseSection({ members }: TeamPulseSectionProps) {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (members.length === 0) {
    return null
  }

  const handleMemberClick = (personId: string) => {
    setSelectedPersonId(personId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedPersonId(null)
  }

  return (
    <>
      <PageSection
        header={<SectionHeader icon={Activity} title='Team Pulse' />}
      >
        <div className='flex flex-col gap-xl'>
          {members.map(member => {
            const hasIssues = member.hasRecentNegativeFeedback
            const hasPositives = member.hasRecentPositiveFeedback

            return (
              <Card
                key={member.id}
                onClick={() => handleMemberClick(member.id)}
                className={`p-lg rounded-md shadow-none transition-colors cursor-pointer ${
                  hasIssues
                    ? 'bg-destructive/10 border border-destructive/30 hover:bg-destructive/15'
                    : hasPositives
                      ? 'bg-green-500/10 border border-green-500/30 hover:bg-green-500/15'
                      : 'bg-muted/20 border-0 hover:bg-muted/30'
                }`}
              >
                <div className='flex items-center gap-lg'>
                  <PersonAvatar
                    name={member.name}
                    avatar={member.avatar}
                    size='sm'
                    className='shrink-0'
                  />
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <div className='font-medium text-sm truncate'>
                        {member.name}
                      </div>
                      {hasIssues && (
                        <AlertCircle className='w-4 h-4 text-destructive shrink-0' />
                      )}
                      {!hasIssues && hasPositives && (
                        <ThumbsUp className='w-4 h-4 text-green-600 shrink-0' />
                      )}
                    </div>
                    <div className='text-xs text-muted-foreground mt-sm'>
                      {formatOneOnOneInfo(
                        member.nextOneOnOne,
                        member.lastOneOnOne
                      )}
                    </div>
                    <div className='flex flex-col gap-xs mt-sm'>
                      {member.hasRecentNegativeFeedback && (
                        <div className='text-xs text-destructive font-medium'>
                          • Recent negative feedback
                        </div>
                      )}
                      {member.hasRecentPositiveFeedback && (
                        <div className='text-xs text-green-600 font-medium'>
                          • Recent positive feedback
                        </div>
                      )}
                      {(member.taskCount > 0 || member.feedbackPending) && (
                        <div className='text-xs text-muted-foreground'>
                          {member.taskCount > 0 &&
                            `• ${member.taskCount} task${member.taskCount === 1 ? '' : 's'}`}
                          {member.feedbackPending && `• Feedback pending`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </PageSection>

      {selectedPersonId && (
        <PersonDetailModal
          personId={selectedPersonId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  )
}
