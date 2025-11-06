'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { PersonAvatar } from '@/components/people/person-avatar'
import { PersonDetailModal } from '@/components/people/person-detail-modal'
import Link from 'next/link'
import { format, isFuture, differenceInDays } from 'date-fns'

interface TeamPulseMember {
  id: string
  name: string
  avatar: string | null
  nextOneOnOne: Date | null
  lastOneOnOne: Date | null
  taskCount: number
  feedbackPending: boolean
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
      <div className='space-y-4'>
        <div>
          <h2 className='text-lg font-semibold'>Team Pulse</h2>
          <div className='hidden md:flex items-center gap-2 text-[10px] text-muted-foreground mt-1'>
            <Link href='/direct-reports' className='hover:underline'>
              View Direct Reports
            </Link>
            <span>•</span>
            <Link href='/teams' className='hover:underline'>
              View Teams
            </Link>
          </div>
        </div>
        <div className='flex flex-col gap-2.5'>
          {members.map(member => (
            <Card
              key={member.id}
              onClick={() => handleMemberClick(member.id)}
              className='p-3 bg-muted/20 border-0 rounded-md shadow-none hover:bg-muted/30 transition-colors cursor-pointer'
            >
              <div className='flex items-center gap-3'>
                <PersonAvatar
                  name={member.name}
                  avatar={member.avatar}
                  size='sm'
                  className='shrink-0'
                />
                <div className='flex-1 min-w-0'>
                  <div className='font-medium text-sm truncate'>
                    {member.name}
                  </div>
                  <div className='text-xs text-muted-foreground mt-1'>
                    {formatOneOnOneInfo(
                      member.nextOneOnOne,
                      member.lastOneOnOne
                    )}
                  </div>
                  {(member.taskCount > 0 || member.feedbackPending) && (
                    <div className='text-xs text-muted-foreground mt-1'>
                      {member.taskCount > 0 &&
                        `• ${member.taskCount} task${member.taskCount === 1 ? '' : 's'}`}
                      {member.feedbackPending && `• Feedback pending`}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

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
