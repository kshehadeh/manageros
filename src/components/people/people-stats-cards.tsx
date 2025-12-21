'use client'

import { WidgetCard } from '@/components/people/widget-card'
import { Users, UserCheck, MessageSquare, Handshake } from 'lucide-react'
import type { PeopleStats } from '@/lib/actions/people-stats'

interface PeopleStatsCardsProps {
  stats: PeopleStats
  hasLinkedPerson: boolean
}

/**
 * Widget IDs for future customization support
 */
export const STAT_CARD_IDS = {
  TOTAL_PEOPLE: 'total-people',
  DIRECT_REPORTS: 'direct-reports',
  REPORTS_WITHOUT_RECENT_ONE_ON_ONE: 'reports-without-recent-one-on-one',
  REPORTS_WITHOUT_RECENT_FEEDBACK_360: 'reports-without-recent-feedback-360',
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
  // Structure cards as config array for future customization support
  const cardConfigs: StatCardConfig[] = [
    {
      id: STAT_CARD_IDS.TOTAL_PEOPLE,
      title: 'Total People',
      value: stats.totalPeople,
      icon: Users,
      show: true,
      minWidth: '160px',
    },
    {
      id: STAT_CARD_IDS.DIRECT_REPORTS,
      title: 'Direct Reports',
      value: stats.directReports,
      icon: UserCheck,
      show: hasLinkedPerson,
      minWidth: '160px',
    },
    {
      id: STAT_CARD_IDS.REPORTS_WITHOUT_RECENT_ONE_ON_ONE,
      title: '1:1s Needed',
      value: stats.reportsWithoutRecentOneOnOne,
      icon: Handshake,
      show: hasLinkedPerson && stats.directReports > 0,
      minWidth: '200px',
    },
    {
      id: STAT_CARD_IDS.REPORTS_WITHOUT_RECENT_FEEDBACK_360,
      title: '360s Needed',
      value: stats.reportsWithoutRecentFeedback360,
      icon: MessageSquare,
      show: hasLinkedPerson && stats.directReports > 0,
      minWidth: '200px',
    },
  ]

  // Filter cards based on visibility (future: can be filtered by user preferences)
  const visibleCards = cardConfigs.filter(card => card.show)

  if (visibleCards.length === 0) {
    return null
  }

  return (
    <div className='flex flex-wrap gap-4'>
      {visibleCards.map(card => {
        return (
          <WidgetCard
            key={card.id}
            title={card.title}
            titleIcon={card.icon}
            minWidth={card.minWidth}
          >
            <div className='flex items-center justify-center'>
              <span className='text-4xl font-bold font-mono'>{card.value}</span>
            </div>
          </WidgetCard>
        )
      })}
    </div>
  )
}
