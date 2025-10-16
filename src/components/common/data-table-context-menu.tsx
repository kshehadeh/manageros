'use client'

import { useEffect, useState, useCallback, ReactNode } from 'react'

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  entityId: string
  triggerType: 'button' | 'rightClick'
}

interface DataTableContextMenuProps {
  children: (_params: { entityId: string; close: () => void }) => ReactNode
  className?: string
}

interface UseDataTableContextMenuReturn {
  contextMenu: ContextMenuState
  handleButtonClick: (_e: React.MouseEvent, _entityId: string) => void
  closeContextMenu: () => void
  ContextMenuComponent: (_props: DataTableContextMenuProps) => ReactNode
}

/**
 * Hook and component for managing context menus in data tables
 * Provides consistent positioning, state management, and outside click handling
 */
export function useDataTableContextMenu(): UseDataTableContextMenuReturn {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    entityId: '',
    triggerType: 'rightClick',
  })

  const handleButtonClick = useCallback(
    (e: React.MouseEvent, entityId: string) => {
      e.stopPropagation()
      const rect = e.currentTarget.getBoundingClientRect()
      setContextMenu({
        visible: true,
        x: rect.right - 160,
        y: rect.bottom + 4,
        entityId,
        triggerType: 'button',
      })
    },
    []
  )

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }))
  }, [])

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        closeContextMenu()
      }
    }

    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu.visible, closeContextMenu])

  const ContextMenuComponent = useCallback(
    ({ children, className = '' }: DataTableContextMenuProps) => {
      if (!contextMenu.visible) {
        return null
      }

      return (
        <div
          className={`fixed bg-popover border border-border rounded-md shadow-md py-1 z-50 min-w-[160px] ${className}`}
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          onClick={e => e.stopPropagation()}
        >
          {children({
            entityId: contextMenu.entityId,
            close: closeContextMenu,
          })}
        </div>
      )
    },
    [contextMenu, closeContextMenu]
  )

  return {
    contextMenu,
    handleButtonClick,
    closeContextMenu,
    ContextMenuComponent,
  }
}
