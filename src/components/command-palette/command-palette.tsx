'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Command as CommandPrimitive } from 'cmdk'
import { Search } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { Loading } from '@/components/ui/loading'
import { useCommandPalette } from './provider'
import {
  type CommandItemDescriptor,
  type CommandSource,
  type CommandPermissions,
} from './types'
import { coreCommandSource } from './sources/core'
import { searchCommandSource } from './sources/search'
import { useDebounce } from '@/hooks/use-debounce'
import { UserBrief, OrganizationBrief } from '@/lib/auth-types'
import { PersonBrief } from '@/types/person'

const sources: CommandSource[] = [coreCommandSource, searchCommandSource]

// Entity types that are searched in the database
const SEARCH_ENTITY_TYPES = [
  'tasks',
  'initiatives',
  'people',
  'feedback',
  'one-on-ones',
] as const

type SearchEntityType = (typeof SEARCH_ENTITY_TYPES)[number]

export function CommandPalette({
  user,
  person,
  organization,
}: {
  user: UserBrief
  person: PersonBrief | null
  organization: OrganizationBrief | null
}) {
  const { isOpen, setOpen } = useCommandPalette()
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<CommandItemDescriptor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentSearchEntity, setCurrentSearchEntity] =
    useState<SearchEntityType | null>(null)

  // Debounce the search query to avoid frequent API calls
  const debouncedQuery = useDebounce(query, 300)

  const [permissions, setPermissions] = useState<CommandPermissions | null>(
    null
  )

  // Ref to track current entity index for rotation
  const entityIndexRef = useRef(0)

  // Fetch current user's person ID, role, and permissions when user is available
  useEffect(() => {
    if (!user) return

    const fetchCurrentUserData = async () => {
      try {
        const permissionsRes = await fetch(
          '/api/command-palette/permissions'
        ).then(res => res.json())
        if (permissionsRes?.permissions) {
          setPermissions(permissionsRes.permissions)
        }
      } catch (error) {
        console.error('Failed to fetch permissions:', error)
        setPermissions(null)
      }
    }
    fetchCurrentUserData()
  }, [user])

  // Rotate through entity types during search to show progress
  useEffect(() => {
    if (!isLoading) {
      setCurrentSearchEntity(null)
      entityIndexRef.current = 0
      return
    }

    // Only show entity rotation if we're actually searching (query length >= 2)
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setCurrentSearchEntity(null)
      entityIndexRef.current = 0
      return
    }

    // Set initial entity
    setCurrentSearchEntity(SEARCH_ENTITY_TYPES[entityIndexRef.current])

    const interval = setInterval(() => {
      entityIndexRef.current =
        (entityIndexRef.current + 1) % SEARCH_ENTITY_TYPES.length
      setCurrentSearchEntity(SEARCH_ENTITY_TYPES[entityIndexRef.current])
    }, 400) // Rotate every 400ms

    return () => {
      clearInterval(interval)
    }
  }, [isLoading, debouncedQuery])

  useEffect(() => {
    let isCancelled = false
    async function run() {
      setIsLoading(true)
      try {
        const all = await Promise.all(
          sources.map(s =>
            s.getItems(
              debouncedQuery,
              user?.role || undefined,
              pathname,
              person?.id,
              permissions || undefined,
              organization?.id
            )
          )
        )
        if (isCancelled) return
        setItems(all.flat())
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
          setCurrentSearchEntity(null)
        }
      }
    }
    run()
    return () => {
      isCancelled = true
    }
  }, [
    debouncedQuery,
    user?.role,
    organization?.id,
    pathname,
    person?.id,
    permissions,
  ])

  const grouped = useMemo<Record<string, CommandItemDescriptor[]>>(() => {
    const byGroup: Record<string, CommandItemDescriptor[]> = {}
    for (const item of items) {
      const group = item.group || 'Actions'
      if (!byGroup[group]) byGroup[group] = []
      byGroup[group].push(item)
    }
    return byGroup
  }, [items])

  function closePalette() {
    setOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent
        size='sm'
        className='p-0! overflow-hidden inset-0 h-full translate-x-0 translate-y-0 rounded-none sm:inset-0 sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:h-auto'
      >
        <VisuallyHidden>
          <DialogTitle>Command Palette</DialogTitle>
        </VisuallyHidden>
        <Command className='h-full'>
          <div
            className='flex items-center border-b px-3'
            cmdk-input-wrapper=''
          >
            <Search className='mr-2 h-4 w-4 shrink-0 opacity-50' />
            <CommandPrimitive.Input
              placeholder='Type a command or search...'
              value={query}
              onValueChange={setQuery}
              className='flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50'
            />
            {isLoading && (
              <div className='ml-2 flex items-center gap-2 text-muted-foreground'>
                <Loading size='sm' />
                {currentSearchEntity && (
                  <span className='text-xs'>
                    Searching {currentSearchEntity}...
                  </span>
                )}
              </div>
            )}
          </div>
          <CommandList className='flex-1 max-h-none'>
            <CommandEmpty>
              {isLoading
                ? currentSearchEntity
                  ? `Searching ${currentSearchEntity}...`
                  : 'Searching…'
                : 'No results found.'}
            </CommandEmpty>
            {Object.entries(grouped).map(([groupName, groupItems]) => (
              <CommandGroup key={groupName} heading={groupName}>
                {groupItems.map(item => (
                  <CommandItem
                    key={item.id}
                    value={[item.title, item.subtitle, ...(item.keywords || [])]
                      .filter(Boolean)
                      .join(' ')
                      .toLowerCase()}
                    onSelect={() => item.perform({ closePalette, router })}
                  >
                    {item.icon}
                    <div className='ml-2 flex flex-col'>
                      <span>{item.title}</span>
                      {item.subtitle && (
                        <span className='text-xs text-muted-foreground truncate'>
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
