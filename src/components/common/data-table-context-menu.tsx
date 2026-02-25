'use client'

import { useEffect, useState, useCallback, ReactNode } from 'react'

const MENU_MIN_WIDTH = 160
/** Min space we want below the trigger before flipping menu above */
const MIN_SPACE_BELOW = 200

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  /** When true, menu is positioned above the trigger (use bottom for positioning) */
  openAbove: boolean
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
    openAbove: false,
    entityId: '',
    triggerType: 'rightClick',
  })

  const handleButtonClick = useCallback(
    (e: React.MouseEvent, entityId: string) => {
      e.stopPropagation()
      const rect = e.currentTarget.getBoundingClientRect()
      const spaceBelow =
        typeof window !== 'undefined'
          ? window.innerHeight - rect.bottom - 4
          : Infinity
      const openAbove =
        spaceBelow < MIN_SPACE_BELOW && rect.top > MIN_SPACE_BELOW
      const x = Math.max(
        0,
        Math.min(
          rect.right - MENU_MIN_WIDTH,
          typeof window !== 'undefined'
            ? window.innerWidth - MENU_MIN_WIDTH
            : rect.right - MENU_MIN_WIDTH
        )
      )
      // When openAbove, y is the menu's bottom edge (viewport top coords) so we can compute CSS bottom
      const y = openAbove ? rect.top - 4 : rect.bottom + 4
      setContextMenu({
        visible: true,
        x,
        y,
        openAbove,
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
          style={
            contextMenu.openAbove
              ? {
                  left: `${contextMenu.x}px`,
                  bottom: `${typeof window !== 'undefined' ? window.innerHeight - contextMenu.y : 0}px`,
                  top: 'auto',
                }
              : {
                  left: `${contextMenu.x}px`,
                  top: `${contextMenu.y}px`,
                }
          }
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
