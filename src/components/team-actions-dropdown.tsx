'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { Team, Person, Initiative } from '@prisma/client'
import { Plus, Users, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'

type TeamWithChildren = Team & {
  parent?: { id: string; name: string } | null
  children?: TeamWithChildren[]
  people: Person[]
  initiatives: Initiative[]
}

interface TeamActionsDropdownProps {
  team: TeamWithChildren
  size?: 'sm' | 'default'
}

export function TeamActionsDropdown({
  team,
  size = 'default',
}: TeamActionsDropdownProps) {
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

  const hasPeople = team.people.length > 0
  const hasInitiatives = team.initiatives.length > 0
  const hasChildren = Boolean(team.children && team.children.length > 0)

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
            {/* Add Person */}
            <Link
              href={`/people/new?teamId=${team.id}`}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={closeDropdown}
            >
              <Plus className='w-4 h-4' />
              Add Person
            </Link>

            {/* Add Child Team */}
            <Link
              href={`/teams/new?parentTeamId=${team.id}`}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={closeDropdown}
            >
              <Users className='w-4 h-4' />
              Add Child Team
            </Link>

            {/* Edit Team */}
            <Link
              href={`/teams/${team.id}/edit`}
              className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
              onClick={closeDropdown}
            >
              <Edit className='w-4 h-4' />
              Edit Team
            </Link>

            {/* Delete Team - Only show if team can be deleted */}
            {!hasPeople && !hasInitiatives && !hasChildren && (
              <button
                className='w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left text-destructive'
                onClick={() => {
                  // This would need to be implemented with a confirmation dialog
                  // For now, we'll just close the dropdown
                  closeDropdown()
                }}
              >
                <Trash2 className='w-4 h-4' />
                Delete Team
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
