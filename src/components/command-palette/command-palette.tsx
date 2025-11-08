'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
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
import { type CommandItemDescriptor, type CommandSource } from './types'
import { coreCommandSource } from './sources/core'
import { searchCommandSource } from './sources/search'
import { useDebounce } from '@/hooks/use-debounce'
import { getCurrentUserWithPerson } from '@/lib/actions/organization'

const sources: CommandSource[] = [coreCommandSource, searchCommandSource]

export function CommandPalette() {
  const { isOpen, setOpen } = useCommandPalette()
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoaded } = useUser()
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<CommandItemDescriptor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentUserPersonId, setCurrentUserPersonId] = useState<
    string | undefined
  >()

  // Debounce the search query to avoid frequent API calls
  const debouncedQuery = useDebounce(query, 300)

  const [userData, setUserData] = useState<{ role?: string } | null>(null)

  // Fetch current user's person ID and role when user is available
  useEffect(() => {
    if (!isLoaded || !user) return

    const fetchCurrentUserData = async () => {
      try {
        const [personData, userDataRes] = await Promise.all([
          getCurrentUserWithPerson(),
          fetch('/api/user/current').then(res => res.json()),
        ])
        setCurrentUserPersonId(personData.person?.id)
        setUserData(userDataRes.user)
      } catch (error) {
        console.error('Failed to fetch current user data:', error)
        setCurrentUserPersonId(undefined)
      }
    }

    fetchCurrentUserData()
  }, [isLoaded, user])

  useEffect(() => {
    let isCancelled = false
    async function run() {
      setIsLoading(true)
      try {
        const userRole = userData?.role
        const all = await Promise.all(
          sources.map(s =>
            s.getItems(debouncedQuery, userRole, pathname, currentUserPersonId)
          )
        )
        if (isCancelled) return
        setItems(all.flat())
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }
    run()
    return () => {
      isCancelled = true
    }
  }, [debouncedQuery, userData?.role, pathname, currentUserPersonId])

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
        className='p-0 overflow-hidden inset-0 h-full translate-x-0 translate-y-0 rounded-none sm:inset-auto sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:h-auto'
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
              <Loading size='sm' className='ml-2 text-muted-foreground' />
            )}
          </div>
          <CommandList className='flex-1 max-h-none sm:max-h-[400px]'>
            <CommandEmpty>
              {isLoading ? 'Searching…' : 'No results found.'}
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
