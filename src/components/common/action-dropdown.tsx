'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Pickaxe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ActionDropdownRenderProps {
  close: () => void
  open: boolean
}

interface ActionDropdownTriggerProps {
  open: boolean
  toggle: (_event: ReactMouseEvent) => void
  close: () => void
}

interface ActionDropdownProps {
  children: (_helpers: ActionDropdownRenderProps) => ReactNode
  size?: 'sm' | 'default'
  align?: 'left' | 'right'
  className?: string
  menuClassName?: string
  triggerClassName?: string
  trigger?: (_props: ActionDropdownTriggerProps) => ReactNode
  usePortal?: boolean
  onOpenChange?: (_open: boolean) => void
}

export function ActionDropdown({
  children,
  size = 'sm',
  align = 'right',
  className,
  menuClassName,
  triggerClassName,
  trigger,
  usePortal = false,
  onOpenChange,
}: ActionDropdownProps) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })

  const setOpenState = useCallback(
    (value: boolean) => {
      setOpen(value)
      onOpenChange?.(value)
    },
    [onOpenChange]
  )

  const toggle = (event: ReactMouseEvent) => {
    event.stopPropagation()
    if (!open && usePortal && dropdownRef.current) {
      // Calculate position for fixed positioning
      const rect = dropdownRef.current.getBoundingClientRect()
      const menuWidth = 192 // w-48 = 192px

      setMenuPosition({
        top: rect.bottom + 4,
        left: align === 'right' ? rect.right - menuWidth : rect.left,
      })
    }
    setOpenState(!open)
  }

  const close = () => setOpenState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        (!usePortal || !menuRef.current || !menuRef.current.contains(target))
      ) {
        setOpenState(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, setOpenState, usePortal])

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {trigger ? (
        trigger({ open, toggle, close })
      ) : (
        <Button
          variant='outline'
          size={size}
          className={cn('flex items-center gap-md', triggerClassName)}
          onClick={toggle}
        >
          <Pickaxe className='h-4 w-4' />
          <span className='hidden md:block'>Actions</span>
          <ChevronDown className='h-4 w-4' />
        </Button>
      )}

      {open &&
        (() => {
          const menuContent = (
            <div
              ref={menuRef}
              className={cn(
                usePortal
                  ? 'fixed bg-popover text-popover-foreground border rounded-md shadow-lg z-[100] min-w-48'
                  : 'absolute top-full mt-md bg-popover text-popover-foreground border rounded-md shadow-lg z-10 min-w-48',
                !usePortal && (align === 'right' ? 'right-0' : 'left-0'),
                menuClassName
              )}
              style={
                usePortal
                  ? {
                      top: `${menuPosition.top}px`,
                      left: `${menuPosition.left}px`,
                    }
                  : undefined
              }
              onClick={event => event.stopPropagation()}
            >
              {children({ close, open })}
            </div>
          )

          if (usePortal && typeof window !== 'undefined') {
            return createPortal(menuContent, document.body)
          }

          return menuContent
        })()}
    </div>
  )
}
