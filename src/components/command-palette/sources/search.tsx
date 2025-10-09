'use client'

import { type CommandItemDescriptor, type CommandSource } from '../types'
import {
  Calendar,
  ListTodo,
  Rocket,
  User,
  MessageCircle,
  Handshake,
} from 'lucide-react'

interface SearchResultBase {
  id: string
  title: string
  subtitle?: string
  type: 'task' | 'initiative' | 'person' | 'feedback' | 'oneOnOne' | 'meeting'
}

async function searchAll(query: string): Promise<SearchResultBase[]> {
  if (!query || query.trim().length < 2) return []
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  const data = (await res.json()) as { results: SearchResultBase[] }
  return data.results
}

export const searchCommandSource: CommandSource = {
  id: 'search',
  label: 'Search',
  getItems: async (
    query: string,
    _userRole?: string,
    _pathname?: string,
    _currentUserPersonId?: string
  ) => {
    const results = await searchAll(query)
    const items: CommandItemDescriptor[] = results.map(r => {
      const base = {
        id: `${r.type}.${r.id}`,
        title: r.title,
        subtitle: r.subtitle,
        group: 'Search Results',
      }
      if (r.type === 'task') {
        return {
          ...base,
          icon: <ListTodo className='h-4 w-4' />,
          perform: ({ closePalette, router }) => {
            router.push(`/tasks/${r.id}`)
            closePalette()
          },
        }
      }
      if (r.type === 'initiative') {
        return {
          ...base,
          icon: <Rocket className='h-4 w-4' />,
          perform: ({ closePalette, router }) => {
            router.push(`/initiatives/${r.id}`)
            closePalette()
          },
        }
      }
      if (r.type === 'feedback') {
        return {
          ...base,
          icon: <MessageCircle className='h-4 w-4' />,
          perform: ({ closePalette, router }) => {
            router.push(`/feedback/${r.id}`)
            closePalette()
          },
        }
      }
      if (r.type === 'oneOnOne') {
        return {
          ...base,
          icon: <Handshake className='h-4 w-4' />,
          perform: ({ closePalette, router }) => {
            router.push(`/oneonones/${r.id}`)
            closePalette()
          },
        }
      }
      if (r.type === 'meeting') {
        return {
          ...base,
          icon: <Calendar className='h-4 w-4' />,
          perform: ({ closePalette, router }) => {
            router.push(`/meetings/${r.id}`)
            closePalette()
          },
        }
      }
      return {
        ...base,
        icon: <User className='h-4 w-4' />,
        perform: ({ closePalette, router }) => {
          router.push(`/people/${r.id}`)
          closePalette()
        },
      }
    })
    return items
  },
}
