'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useCommandPalette } from './provider'
import { type CommandItemDescriptor, type CommandSource } from './types'
import { coreCommandSource } from './sources/core'
import { searchCommandSource } from './sources/search'

const sources: CommandSource[] = [coreCommandSource, searchCommandSource]

export function CommandPalette() {
  const { isOpen, setOpen } = useCommandPalette()
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<CommandItemDescriptor[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let isCancelled = false
    async function run() {
      setIsLoading(true)
      try {
        const all = await Promise.all(sources.map(s => s.getItems(query)))
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
  }, [query])

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
        <Command>
          <CommandInput
            placeholder='Type a command or search...'
            value={query}
            onValueChange={setQuery}
          />
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
                    onSelect={() => item.perform({ closePalette })}
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
