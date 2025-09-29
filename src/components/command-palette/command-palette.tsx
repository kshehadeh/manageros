'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
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
import { useCommandPalette } from './provider'
import { type CommandItemDescriptor, type CommandSource } from './types'
import { coreCommandSource } from './sources/core'
import { searchCommandSource } from './sources/search'

const sources: CommandSource[] = [coreCommandSource, searchCommandSource]

export function CommandPalette() {
  const { isOpen, setOpen } = useCommandPalette()
  const router = useRouter()
  const { data: session } = useSession()
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<CommandItemDescriptor[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let isCancelled = false
    async function run() {
      setIsLoading(true)
      try {
        const userRole = session?.user?.role
        const all = await Promise.all(
          sources.map(s => s.getItems(query, userRole))
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
  }, [query, session?.user?.role])

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
      <DialogContent className='p-0 overflow-hidden sm:max-w-[640px]'>
        <VisuallyHidden>
          <DialogTitle>Command Palette</DialogTitle>
        </VisuallyHidden>
        <Command>
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
          </div>
          <CommandList>
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
                      .join(' ')}
                    onSelect={() => item.perform({ closePalette, router })}
                  >
                    {item.icon}
                    <span className='ml-2'>{item.title}</span>
                    {item.subtitle && (
                      <span className='ml-2 text-xs text-muted-foreground truncate'>
                        {item.subtitle}
                      </span>
                    )}
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
