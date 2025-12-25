'use client'

import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { PeopleListModal } from './people-list-modal'
import type { PersonForList } from './person-list'
import {
  getReportsWithoutRecentOneOnOne,
  getReportsWithoutRecentFeedback360,
  getManagersExceedingMaxReports,
} from '@/lib/actions/people-stats-lists'

interface WidgetRenderResult {
  widgetId: string
  widgetElement: ReactNode
  minWidth?: string
}

interface PeopleDashboardWidgetsClientProps {
  widgets: WidgetRenderResult[]
}

/**
 * Client component wrapper for widgets
 * Handles interactivity like click handlers and modals
 */
export function PeopleDashboardWidgetsClient({
  widgets,
}: PeopleDashboardWidgetsClientProps) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalPeople, setModalPeople] = useState<PersonForList[]>([])

  const handleWidgetClick = async (widgetId: string) => {
    switch (widgetId) {
      case 'total-people':
        router.push('/people/list')
        break

      case 'direct-reports':
        router.push('/people/direct-reports')
        break

      case 'reports-without-recent-one-on-one': {
        const people = await getReportsWithoutRecentOneOnOne()
        setModalTitle('Reports Needing 1:1s')
        setModalPeople(people)
        setModalOpen(true)
        break
      }

      case 'reports-without-recent-feedback-360': {
        const people = await getReportsWithoutRecentFeedback360()
        setModalTitle('Reports Needing 360 Feedback')
        setModalPeople(people)
        setModalOpen(true)
        break
      }

      case 'managers-exceeding-max-reports': {
        const people = await getManagersExceedingMaxReports()
        setModalTitle('Managers Exceeding Max Reports')
        setModalPeople(people)
        setModalOpen(true)
        break
      }

      default:
        // No action for other widgets
        break
    }
  }

  // Widgets that should be clickable
  const clickableWidgetIds = [
    'total-people',
    'direct-reports',
    'reports-without-recent-one-on-one',
    'reports-without-recent-feedback-360',
    'managers-exceeding-max-reports',
  ]

  return (
    <>
      <div className='flex flex-wrap gap-4'>
        {widgets.map(({ widgetId, widgetElement, minWidth }) => {
          const isClickable = clickableWidgetIds.includes(widgetId)
          // Use flex-grow to fill space, but respect minWidth for wrapping
          const style = minWidth
            ? { minWidth, flex: '1 1 auto' }
            : { flex: '1 1 auto' }
          const baseClasses = 'min-w-0'

          if (isClickable) {
            return (
              <div
                key={widgetId}
                onClick={() => handleWidgetClick(widgetId)}
                className={`${baseClasses} cursor-pointer [&>div]:hover:bg-accent/50 [&>div]:transition-colors`}
                style={style}
              >
                {widgetElement}
              </div>
            )
          }

          return (
            <div key={widgetId} className={baseClasses} style={style}>
              {widgetElement}
            </div>
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
