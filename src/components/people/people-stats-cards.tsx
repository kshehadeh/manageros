'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WidgetCard } from '@/components/people/widget-card'
import {
  Users,
  UserCheck,
  MessageSquare,
  Handshake,
  AlertTriangle,
} from 'lucide-react'
import type { PeopleStats } from '@/lib/actions/people-stats'
import { PeopleListModal } from '@/components/people/people-list-modal'
import {
  getReportsWithoutRecentOneOnOne,
  getReportsWithoutRecentFeedback360,
  getManagersExceedingMaxReports,
} from '@/lib/actions/people-stats-lists'
import type { PersonForList } from '@/components/people/person-list'

interface PeopleStatsCardsProps {
  stats: PeopleStats
  hasLinkedPerson: boolean
  currentPersonId?: string | null
}

/**
 * Widget IDs for future customization support
 */
export const STAT_CARD_IDS = {
  TOTAL_PEOPLE: 'total-people',
  DIRECT_REPORTS: 'direct-reports',
  REPORTS_WITHOUT_RECENT_ONE_ON_ONE: 'reports-without-recent-one-on-one',
  REPORTS_WITHOUT_RECENT_FEEDBACK_360: 'reports-without-recent-feedback-360',
  MANAGERS_EXCEEDING_MAX_REPORTS: 'managers-exceeding-max-reports',
} as const

export type StatCardId = (typeof STAT_CARD_IDS)[keyof typeof STAT_CARD_IDS]

interface StatCardConfig {
  id: StatCardId
  title: string
  value: number
  icon: typeof Users
  show: boolean
  minWidth?: string
}

export function PeopleStatsCards({
  stats,
  hasLinkedPerson,
}: PeopleStatsCardsProps) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalPeople, setModalPeople] = useState<PersonForList[]>([])

  const handleTotalPeopleClick = () => {
    router.push('/people/list')
  }

  const handleDirectReportsClick = () => {
    router.push('/people/direct-reports')
  }

  const handleOneOnOnesNeededClick = async () => {
    const people = await getReportsWithoutRecentOneOnOne()
    setModalTitle('Reports Needing 1:1s')
    setModalPeople(people)
    setModalOpen(true)
  }

  const handleFeedback360NeededClick = async () => {
    const people = await getReportsWithoutRecentFeedback360()
    setModalTitle('Reports Needing 360 Feedback')
    setModalPeople(people)
    setModalOpen(true)
  }

  const handleManagersExceedingMaxReportsClick = async () => {
    const people = await getManagersExceedingMaxReports()
    setModalTitle('Managers Exceeding Max Reports')
    setModalPeople(people)
    setModalOpen(true)
  }

  // Structure cards as config array for future customization support
  const cardConfigs: (StatCardConfig & { onClick?: () => void })[] = [
    {
      id: STAT_CARD_IDS.TOTAL_PEOPLE,
      title: 'Total People',
      value: stats.totalPeople,
      icon: Users,
      show: true,
      minWidth: '160px',
      onClick: handleTotalPeopleClick,
    },
    {
      id: STAT_CARD_IDS.DIRECT_REPORTS,
      title: 'Direct Reports',
      value: stats.directReports,
      icon: UserCheck,
      show: hasLinkedPerson,
      minWidth: '160px',
      onClick: handleDirectReportsClick,
    },
    {
      id: STAT_CARD_IDS.REPORTS_WITHOUT_RECENT_ONE_ON_ONE,
      title: '1:1s Needed',
      value: stats.reportsWithoutRecentOneOnOne,
      icon: Handshake,
      show: hasLinkedPerson && stats.directReports > 0,
      minWidth: '200px',
      onClick: handleOneOnOnesNeededClick,
    },
    {
      id: STAT_CARD_IDS.REPORTS_WITHOUT_RECENT_FEEDBACK_360,
      title: '360s Needed',
      value: stats.reportsWithoutRecentFeedback360,
      icon: MessageSquare,
      show: hasLinkedPerson && stats.directReports > 0,
      minWidth: '200px',
      onClick: handleFeedback360NeededClick,
    },
    {
      id: STAT_CARD_IDS.MANAGERS_EXCEEDING_MAX_REPORTS,
      title: 'Max Reports Exceeded',
      value: stats.managersExceedingMaxReports,
      icon: AlertTriangle,
      show: stats.hasMaxReportsRule,
      minWidth: '200px',
      onClick: handleManagersExceedingMaxReportsClick,
    },
  ]

  // Filter cards based on visibility (future: can be filtered by user preferences)
  const visibleCards = cardConfigs.filter(card => card.show)

  if (visibleCards.length === 0) {
    return null
  }

  return (
    <>
      <div className='flex flex-wrap gap-4'>
        {visibleCards.map(card => {
          return (
            <WidgetCard
              key={card.id}
              title={card.title}
              titleIcon={card.icon}
              minWidth={card.minWidth}
              onClick={card.onClick}
              className='flex-1 min-w-0'
            >
              <div className='flex items-center justify-center'>
                <span className='text-4xl font-bold font-mono'>
                  {card.value}
                </span>
              </div>
            </WidgetCard>
          )
        })}
      </div>

      <PeopleListModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        people={modalPeople}
        emptyStateText='No people found.'
      />
    </>
  )
}
