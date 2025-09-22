'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { DeleteInitiativeButton } from '@/components/delete-initiative-button'

interface InitiativeActionsDropdownProps {
  initiativeId: string
  size?: 'sm' | 'default'
}

export function InitiativeActionsDropdown({
  initiativeId,
  size = 'default',
}: InitiativeActionsDropdownProps) {
  const [openDropdown, setOpenDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenDropdown(!openDropdown)
  }

  const closeDropdown = () => {
    setOpenDropdown(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(false)
      }
    }

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  return (
    <div className='relative' ref={dropdownRef}>
      <Button
        variant='ghost'
        size={size}
        className={`${size === 'sm' ? 'h-8 w-8 p-0' : 'h-8 w-8 p-0'}`}
        onClick={handleDropdownClick}
      >
        <MoreHorizontal className='h-4 w-4' />
      </Button>

      {openDropdown && (
        <div
          className='absolute top-full right-0 mt-2 bg-popover text-popover-foreground border rounded-md shadow-lg z-10 min-w-48'
          onClick={e => e.stopPropagation()}
        >
          <div className='py-1'>
            {/* Edit Initiative */}
            <Link
              href={`/initiatives/${initiativeId}/edit`}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={closeDropdown}
            >
              <Edit className='w-4 h-4' />
              Edit Initiative
            </Link>

            {/* Delete Initiative */}
            <div
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer'
              onClick={closeDropdown}
            >
              <Trash2 className='w-4 h-4' />
              <DeleteInitiativeButton initiativeId={initiativeId} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
