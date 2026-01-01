'use client'

import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { InitiativesListModal } from './initiatives-list-modal'
import type { Initiative } from './initiative-list'
import {
  getOpenInitiatives,
  getUserInitiatives,
  getOverdueInitiatives,
} from '@/lib/actions/initiatives-stats-lists'

interface WidgetRenderResult {
  widgetId: string
  widgetElement: ReactNode
  minWidth?: string
}

interface InitiativesDashboardWidgetsClientProps {
  widgets: WidgetRenderResult[]
}

/**
 * Client component wrapper for initiative widgets
 * Handles interactivity like click handlers and navigation
 */
export function InitiativesDashboardWidgetsClient({
  widgets,
}: InitiativesDashboardWidgetsClientProps) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalInitiatives, setModalInitiatives] = useState<Initiative[]>([])

  const handleWidgetClick = async (widgetId: string) => {
    switch (widgetId) {
      case 'total-open-initiatives': {
        const initiatives = await getOpenInitiatives()
        setModalTitle('Open Initiatives')
        setModalInitiatives(initiatives)
        setModalOpen(true)
        break
      }

      case 'user-initiatives': {
        const initiatives = await getUserInitiatives()
        setModalTitle('My Initiatives')
        setModalInitiatives(initiatives)
        setModalOpen(true)
        break
      }

      case 'overdue-initiatives': {
        const initiatives = await getOverdueInitiatives()
        setModalTitle('Overdue Initiatives')
        setModalInitiatives(initiatives)
        setModalOpen(true)
        break
      }

      case 'initiatives-status-chart':
      case 'initiatives-rag-chart':
        // Chart-level clicks (bars/pie segments) are handled by the chart components themselves
        // This case is kept for backward compatibility but shouldn't be triggered
        // due to stopPropagation in the chart components
        break

      case 'initiatives-in-exception':
        router.push('/exceptions?entityType=Initiative&status=active')
        break

      default:
        // No action for other widgets
        break
    }
  }

  // Widgets that should be clickable
  const clickableWidgetIds = [
    'total-open-initiatives',
    'initiatives-in-exception',
    'user-initiatives',
    'overdue-initiatives',
    'initiatives-status-chart',
    'initiatives-rag-chart',
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

      <InitiativesListModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        initiatives={modalInitiatives}
        emptyStateText='No initiatives found.'
      />
    </>
  )
}
