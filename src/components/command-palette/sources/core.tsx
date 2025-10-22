'use client'
import {
  Plus,
  ListTodo,
  User,
  Users2,
  Rocket,
  MessageCircle,
  Settings,
  BarChart3,
  Handshake,
  CheckSquare,
  UserPlus,
} from 'lucide-react'
import { type CommandItemDescriptor, type CommandSource } from '../types'

function createStaticItems(
  query: string,
  userRole?: string,
  pathname?: string,
  currentUserPersonId?: string
): CommandItemDescriptor[] {
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
      id: 'oneonone.create',
      title: 'Create 1:1 Meeting',
      subtitle: 'Schedule a new one-on-one meeting',
      icon: <Handshake className='h-4 w-4' />,
      keywords: ['1:1', 'one on one', 'meeting', 'schedule', 'calendar'],
      group: 'Quick Actions',
      perform: ({ closePalette, router }) => {
        const url = currentUserPersonId
          ? `/oneonones/new?participant1Id=${currentUserPersonId}`
          : '/oneonones/new'
        router.push(url)
        closePalette()
      },
    },
    {
      id: 'initiative.create',
      title: 'Create Initiative',
      subtitle: 'Start a new initiative or OKR',
      icon: <Rocket className='h-4 w-4' />,
      keywords: ['initiative', 'okr', 'objective', 'goal', 'project'],
      group: 'Quick Actions',
      perform: ({ closePalette, router }) => {
        router.push('/initiatives/new')
        closePalette()
      },
    },
    {
      id: 'feedback.create',
      title: 'Create Feedback',
      subtitle: 'Give feedback to a team member',
      icon: <MessageCircle className='h-4 w-4' />,
      keywords: ['feedback', 'review', 'comment', 'praise', 'criticism'],
      group: 'Quick Actions',
      perform: ({ closePalette }) => {
        const ev = new CustomEvent('command:openPersonSelectorModal')
        window.dispatchEvent(ev)
        closePalette()
      },
    },
    // Add initiative-specific task creation if we're on an initiative page
    ...(pathname?.match(/^\/initiatives\/[^\/]+$/)
      ? [
          {
            id: 'task.create.initiative',
            title: 'Create Task for Initiative',
            subtitle: 'Add task to this initiative',
            icon: <Plus className='h-4 w-4' />,
            keywords: ['task', 'new task', 'add task', 'initiative'],
            group: 'Quick Actions',
            perform: ({ closePalette }: { closePalette: () => void }) => {
              const initiativeId = pathname.split('/')[2]
              const ev = new CustomEvent('command:openCreateTaskModal', {
                detail: { initiativeId },
              })
              window.dispatchEvent(ev)
              closePalette()
            },
          },
        ]
      : []),
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
      id: 'nav.my-tasks',
      title: 'View My Tasks',
      subtitle: 'Go to my assigned tasks',
      icon: <CheckSquare className='h-4 w-4' />,
      keywords: ['my tasks', 'assigned', 'personal', 'todo'],
      group: 'Navigation',
      perform: ({ closePalette, router }) => {
        router.push('/my-tasks')
        closePalette()
      },
    },
    {
      id: 'nav.people',
      title: 'View People',
      subtitle: 'Go to people directory',
      icon: <User className='h-4 w-4' />,
      keywords: ['people', 'person', 'team', 'members'],
      group: 'Navigation',
      perform: ({ closePalette, router }) => {
        router.push('/people')
        closePalette()
      },
    },
    {
      id: 'nav.teams',
      title: 'View Teams',
      subtitle: 'Go to teams directory',
      icon: <Users2 className='h-4 w-4' />,
      keywords: ['teams', 'team', 'groups', 'organization'],
      group: 'Navigation',
      perform: ({ closePalette, router }) => {
        router.push('/teams')
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
    {
      id: 'nav.reports',
      title: 'View Reports',
      subtitle: 'Go to reports page',
      icon: <BarChart3 className='h-4 w-4' />,
      keywords: ['reports', 'analytics', 'data', 'charts'],
      group: 'Navigation',
      perform: ({ closePalette, router }) => {
        router.push('/reports')
        closePalette()
      },
    },
  ]

  // Add admin-only commands
  if (userRole === 'ADMIN') {
    items.push(
      {
        id: 'person.create',
        title: 'Create Person',
        subtitle: 'Add a new person to the organization',
        icon: <UserPlus className='h-4 w-4' />,
        keywords: ['person', 'people', 'new person', 'add person', 'employee', 'team member'],
        group: 'Quick Actions',
        perform: ({ closePalette, router }) => {
          router.push('/people/new')
          closePalette()
        },
      },
      {
        id: 'nav.org-settings',
        title: 'Organization Settings',
        subtitle: 'Manage organization settings',
        icon: <Settings className='h-4 w-4' />,
        keywords: ['settings', 'organization', 'admin', 'config'],
        group: 'Administration',
        perform: ({ closePalette, router }) => {
          router.push('/organization/settings')
          closePalette()
        },
      }
    )
  }

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
  getItems: async (
    query: string,
    userRole?: string,
    pathname?: string,
    currentUserPersonId?: string
  ) => {
    return createStaticItems(query, userRole, pathname, currentUserPersonId)
  },
}
