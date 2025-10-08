'use client'

import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PersonAvatar } from '@/components/people/person-avatar'
import { getPeople } from '@/lib/actions/person'

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
  people?: Person[] // Optional: if provided, use this list instead of loading
  showAvatar?: boolean // Optional: whether to show avatars (default: true)
  showRole?: boolean // Optional: whether to show role (default: true)
  showEmail?: boolean // Optional: whether to show email (default: false)
  includeNone?: boolean // Optional: whether to include "None" option (default: false)
  noneLabel?: string // Optional: label for "None" option (default: "No person")
  className?: string
  autoFocus?: boolean // Optional: whether to auto-open dropdown (default: false)
}

export function PersonSelect({
  value,
  onValueChange,
  placeholder = 'Select a person...',
  disabled = false,
  people: providedPeople,
  showAvatar = true,
  showRole = true,
  showEmail = false,
  includeNone = false,
  noneLabel = 'No person',
  className,
  autoFocus = false,
}: PersonSelectProps) {
  const [people, setPeople] = useState<Person[]>(providedPeople || [])
  const [isLoading, setIsLoading] = useState(false)
  const [selectOpen, setSelectOpen] = useState(false)

  // Load people if not provided
  useEffect(() => {
    if (!providedPeople) {
      loadPeople()
    } else {
      setPeople(providedPeople)
    }
  }, [providedPeople])

  // Auto-open dropdown if requested
  useEffect(() => {
    if (autoFocus && !isLoading && people.length > 0) {
      const timer = setTimeout(() => {
        setSelectOpen(true)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [autoFocus, isLoading, people.length])

  const loadPeople = async () => {
    setIsLoading(true)
    try {
      const peopleData = await getPeople()
      setPeople(
        peopleData.map(person => ({
          id: person.id,
          name: person.name,
          email: person.email,
          role: person.role,
          avatar: person.avatar,
        }))
      )
    } catch (error) {
      console.error('Error loading people:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderPersonItem = (person: Person) => (
    <div className='flex items-center gap-2'>
      {showAvatar && (
        <PersonAvatar name={person.name} avatar={person.avatar} size='sm' />
      )}
      <div className='text-left'>
        <div className='font-medium'>{person.name}</div>
        {showRole && person.role && (
          <div className='text-xs text-muted-foreground'>{person.role}</div>
        )}
        {showEmail && person.email && (
          <div className='text-xs text-muted-foreground'>{person.email}</div>
        )}
      </div>
    </div>
  )

  const renderPersonText = (person: Person) => {
    let text = person.name
    if (showEmail && person.email) {
      text += ` (${person.email})`
    }
    return text
  }

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled || isLoading}
      open={selectOpen}
      onOpenChange={setSelectOpen}
    >
      <SelectTrigger className={className}>
        <SelectValue
          placeholder={isLoading ? 'Loading people...' : placeholder}
        />
      </SelectTrigger>
      <SelectContent>
        {includeNone && <SelectItem value='none'>{noneLabel}</SelectItem>}
        {people.map(person => (
          <SelectItem key={person.id} value={person.id}>
            {showAvatar ? renderPersonItem(person) : renderPersonText(person)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
