'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from 'react'
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
  onOpenChange?: (_open: boolean) => void
}

export function ActionDropdown({
  children,
  size = 'default',
  align = 'right',
  className,
  menuClassName,
  triggerClassName,
  trigger,
  onOpenChange,
}: ActionDropdownProps) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const setOpenState = useCallback(
    (value: boolean) => {
      setOpen(value)
      onOpenChange?.(value)
    },
    [onOpenChange]
  )

  const toggle = (event: ReactMouseEvent) => {
    event.stopPropagation()
    setOpenState(!open)
  }

  const close = () => setOpenState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenState(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, setOpenState])

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {trigger ? (
        trigger({ open, toggle, close })
      ) : (
        <Button
          variant='ghost'
          size={size}
          className={cn('flex items-center gap-2', triggerClassName)}
          onClick={toggle}
        >
          <Pickaxe className='h-4 w-4' />
          <span className='hidden md:block'>Actions</span>
          <ChevronDown className='h-4 w-4' />
        </Button>
      )}

      {open && (
        <div
          className={cn(
            'absolute top-full mt-2 bg-popover text-popover-foreground border rounded-md shadow-lg z-10 min-w-48',
            align === 'right' ? 'right-0' : 'left-0',
            menuClassName
          )}
          onClick={event => event.stopPropagation()}
        >
          {children({ close, open })}
        </div>
      )}
    </div>
  )
}
