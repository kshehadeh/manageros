'use client'

import { Badge } from '@/components/ui/badge'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { PersonAvatar } from '@/components/people/person-avatar'
import { Users, ChevronDown } from 'lucide-react'
import { Link } from '@/components/ui/link'
import { useState } from 'react'

interface Participant {
  id: string
  personId: string
  status: string
  person: {
    id: string
    name: string
    avatar?: string | null
  }
}

interface ParticipantsListProps {
  participants: Participant[]
}

export function MeetingParticipantsSidebar({
  participants,
}: ParticipantsListProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const showExpander = participants.length > 5
  const visibleParticipants =
    showExpander && !isExpanded ? participants.slice(0, 5) : participants

  const getStatusColor = (status: string) => {
    switch (status) {
      // Meeting statuses
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'tentative':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      // Meeting instance statuses
      case 'attended':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <PageSection
      header={
        <SectionHeader
          icon={Users}
          title={`Participants (${participants.length})`}
        />
      }
    >
      <div className='space-y-3'>
        {visibleParticipants.map(participant => (
          <div
            key={participant.id}
            className='flex items-center justify-between'
          >
            <div className='flex items-center gap-3 min-w-0'>
              <PersonAvatar
                name={participant.person.name}
                avatar={participant.person.avatar}
                size='sm'
              />
              <Link
                href={`/people/${participant.person.id}`}
                className='hover:text-highlight transition-colors truncate'
              >
                {participant.person.name}
              </Link>
            </div>
            <Badge
              className={`${getStatusColor(participant.status)} flex-shrink-0 ml-2`}
            >
              {participant.status.charAt(0).toUpperCase() +
                participant.status.slice(1)}
            </Badge>
          </div>
        ))}
        {showExpander && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className='w-full flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground hover:text-foreground transition-colors'
          >
            <span>
              {isExpanded
                ? `Show less (${participants.length - 5} hidden)`
                : `Show all (${participants.length})`}
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>
    </PageSection>
  )
}
