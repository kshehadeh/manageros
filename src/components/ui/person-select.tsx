'use client'

import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from '@/components/ui/select'
import { PersonAvatar } from '@/components/people/person-avatar'
import { usePeopleForSelect } from '@/hooks/use-organization-cache'
import { useViewportPosition } from '@/hooks/use-viewport-position'
import { useKeyboardSearch } from '@/hooks/use-keyboard-search'

interface Person {
  id: string
  name: string
  email?: string | null
  role?: string | null
  avatar?: string | null
}

interface PersonSelectProps {
  value?: string
  onValueChange?: (_value: string) => void
  placeholder?: string
  disabled?: boolean
  showAvatar?: boolean // Optional: whether to show avatars (default: true)
  showRole?: boolean // Optional: whether to show role (default: true)
  includeNone?: boolean // Optional: whether to include "None" option (default: false)
  noneLabel?: string // Optional: label for "None" option (default: "No person")
  className?: string
  autoFocus?: boolean // Optional: whether to auto-open dropdown (default: false)
  excludePersonIds?: string[] // Optional: list of person IDs to exclude from the list
}

export function PersonSelect({
  value,
  onValueChange,
  placeholder = 'Select a person...',
  disabled = false,
  showAvatar = true,
  showRole = true,
  includeNone = false,
  noneLabel = 'No person',
  className,
  autoFocus = false,
  excludePersonIds = [],
}: PersonSelectProps) {
  const { people, isLoading } = usePeopleForSelect()
  const [selectOpen, setSelectOpen] = useState(false)
  const { position, maxHeight, triggerRef } = useViewportPosition(
    selectOpen,
    300,
    16
  )

  // Filter out excluded people
  const availablePeople = people.filter(
    person => !excludePersonIds.includes(person.id)
  )

  // Use keyboard search hook
  const { searchQuery, filteredItems: filteredPeople } = useKeyboardSearch({
    items: availablePeople,
    getItemText: person => person.name,
    onSelect: person => onValueChange?.(person.id),
    isOpen: selectOpen,
  })

  // Auto-open dropdown if requested
  useEffect(() => {
    if (autoFocus && !isLoading && availablePeople.length > 0) {
      const timer = setTimeout(() => {
        setSelectOpen(true)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [autoFocus, isLoading, availablePeople.length])

  const renderPersonItem = (person: Person) => (
    <div className='flex items-center gap-lg'>
      {showAvatar && (
        <PersonAvatar name={person.name} avatar={person.avatar} size='xs' />
      )}
      <div className='flex items-center gap-md flex-1 min-w-0'>
        <span className='font-medium whitespace-nowrap'>{person.name}</span>
        {showRole && person.role && (
          <span className='text-xs text-muted-foreground truncate'>
            {person.role}
          </span>
        )}
      </div>
    </div>
  )

  const renderPersonText = (person: Person) => {
    if (showRole && person.role) {
      return `${person.name} • ${person.role}`
    }
    return person.name
  }

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled || isLoading}
      open={selectOpen}
      onOpenChange={setSelectOpen}
    >
      <SelectTrigger ref={triggerRef} className={className}>
        <SelectValue
          placeholder={isLoading ? 'Loading people...' : placeholder}
        />
      </SelectTrigger>
      <SelectContent
        side={position}
        sideOffset={4}
        style={{ maxHeight: `${maxHeight}px` }}
        className='overflow-y-auto'
      >
        {searchQuery && (
          <div className='px-md py-sm text-xs text-muted-foreground border-b'>
            Searching: &ldquo;{searchQuery}&rdquo;
          </div>
        )}
        <SelectScrollUpButton />
        {includeNone && <SelectItem value='none'>{noneLabel}</SelectItem>}
        {filteredPeople.map(person => (
          <SelectItem key={person.id} value={person.id}>
            {showAvatar ? renderPersonItem(person) : renderPersonText(person)}
          </SelectItem>
        ))}
        {filteredPeople.length === 0 && searchQuery && (
          <div className='py-2xl text-center text-sm text-muted-foreground'>
            No people found matching &ldquo;{searchQuery}&rdquo;
          </div>
        )}
        <SelectScrollDownButton />
      </SelectContent>
    </Select>
  )
}
