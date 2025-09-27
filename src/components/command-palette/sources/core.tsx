'use client'
import { Plus, ListTodo, Users, Rocket, MessageCircle } from 'lucide-react'
import { type CommandItemDescriptor, type CommandSource } from '../types'

function createStaticItems(query: string): CommandItemDescriptor[] {
  const q = query.toLowerCase()
  const items: CommandItemDescriptor[] = [
    {
      id: 'task.create',
      title: 'Create Task',
      subtitle: 'Open quick create task',
      icon: <Plus className='h-4 w-4' />,
      keywords: ['task', 'new task', 'add task'],
      group: 'Quick Actions',
      perform: ({ closePalette }) => {
        const ev = new CustomEvent('command:openCreateTaskModal')
        window.dispatchEvent(ev)
        closePalette()
      },
    },
    {
      id: 'nav.tasks',
      title: 'View Tasks',
      subtitle: 'Go to tasks list',
      icon: <ListTodo className='h-4 w-4' />,
      keywords: ['task', 'tasks', 'todo'],
      group: 'Navigation',
      perform: ({ closePalette, router }) => {
        router.push('/tasks')
        closePalette()
      },
    },
    {
      id: 'nav.people',
      title: 'View People',
      subtitle: 'Go to people directory',
      icon: <Users className='h-4 w-4' />,
      keywords: ['people', 'person', 'team', 'members'],
      group: 'Navigation',
      perform: ({ closePalette, router }) => {
        router.push('/people')
        closePalette()
      },
    },
    {
      id: 'nav.initiatives',
      title: 'View Initiatives',
      subtitle: 'Go to initiatives',
      icon: <Rocket className='h-4 w-4' />,
      keywords: ['initiative', 'okr', 'objectives'],
      group: 'Navigation',
      perform: ({ closePalette, router }) => {
        router.push('/initiatives')
        closePalette()
      },
    },
    {
      id: 'nav.feedback',
      title: 'View Feedback',
      subtitle: 'Go to feedback page',
      icon: <MessageCircle className='h-4 w-4' />,
      keywords: ['feedback', 'reviews', 'comments'],
      group: 'Navigation',
      perform: ({ closePalette, router }) => {
        router.push('/feedback')
        closePalette()
      },
    },
  ]

  return items.filter(item => {
    if (!q) return true
    const hay = [
      item.title.toLowerCase(),
      item.subtitle?.toLowerCase() || '',
      ...(item.keywords || []).map(k => k.toLowerCase()),
    ].join(' ')
    return hay.includes(q)
  })
}

export const coreCommandSource: CommandSource = {
  id: 'core',
  label: 'Core',
  getItems: async (query: string) => createStaticItems(query),
}
