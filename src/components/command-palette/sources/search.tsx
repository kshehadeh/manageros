'use client'

import {
  type CommandItemDescriptor,
  type CommandSource,
  type CommandPermissions,
} from '../types'
import {
  Calendar,
  ListTodo,
  Rocket,
  User,
  MessageCircle,
  Handshake,
  Activity,
  ClipboardList,
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
    _currentUserPersonId?: string,
    _permissions?: CommandPermissions,
    organizationId?: string | null
  ) => {
    // If no organization, don't show search results
    if (!organizationId) {
      return []
    }
    const results = await searchAll(query)
    const items: CommandItemDescriptor[] = results.flatMap(r => {
      const base = {
        id: `${r.type}.${r.id}`,
        title: r.title,
        subtitle: r.subtitle,
        group: 'Search Results',
      }
      if (r.type === 'task') {
        return [
          {
            ...base,
            icon: <ListTodo className='h-4 w-4' />,
            perform: ({ closePalette, router }) => {
              router.push(`/tasks/${r.id}`)
              closePalette()
            },
          },
        ]
      }
      if (r.type === 'initiative') {
        return [
          {
            ...base,
            icon: <Rocket className='h-4 w-4' />,
            perform: ({ closePalette, router }) => {
              router.push(`/initiatives/${r.id}`)
              closePalette()
            },
          },
        ]
      }
      if (r.type === 'feedback') {
        return [
          {
            ...base,
            icon: <MessageCircle className='h-4 w-4' />,
            perform: ({ closePalette, router }) => {
              router.push(`/feedback/${r.id}`)
              closePalette()
            },
          },
        ]
      }
      if (r.type === 'oneOnOne') {
        return [
          {
            ...base,
            icon: <Handshake className='h-4 w-4' />,
            perform: ({ closePalette, router }) => {
              router.push(`/oneonones/${r.id}`)
              closePalette()
            },
          },
        ]
      }
      if (r.type === 'meeting') {
        return [
          {
            ...base,
            icon: <Calendar className='h-4 w-4' />,
            perform: ({ closePalette, router }) => {
              router.push(`/meetings/${r.id}`)
              closePalette()
            },
          },
        ]
      }
      // For persons, return multiple items: Profile, Activity, and Feedback 360
      if (r.type === 'person') {
        return [
          {
            ...base,
            id: `${r.type}.${r.id}.profile`,
            title: `View ${r.title}`,
            subtitle: 'View profile',
            icon: <User className='h-4 w-4' />,
            perform: ({ closePalette, router }) => {
              router.push(`/people/${r.id}`)
              closePalette()
            },
          },
          {
            ...base,
            id: `${r.type}.${r.id}.activity`,
            title: `${r.title} - Activity`,
            subtitle: 'View activity page',
            icon: <Activity className='h-4 w-4' />,
            perform: ({ closePalette, router }) => {
              router.push(`/people/${r.id}/activity`)
              closePalette()
            },
          },
          {
            ...base,
            id: `${r.type}.${r.id}.feedback-360`,
            title: `${r.title} - Feedback 360`,
            subtitle: 'View Feedback 360',
            icon: <ClipboardList className='h-4 w-4' />,
            perform: ({ closePalette, router }) => {
              router.push(`/people/${r.id}/feedback-campaigns`)
              closePalette()
            },
          },
        ]
      }
      // Fallback for unknown types
      return [
        {
          ...base,
          icon: <User className='h-4 w-4' />,
          perform: ({ closePalette, router }) => {
            router.push(`/people/${r.id}`)
            closePalette()
          },
        },
      ]
    })
    return items
  },
}
