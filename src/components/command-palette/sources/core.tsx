'use client'
import {
  Plus,
  ListTodo,
  User,
  Users2,
  Rocket,
  MessageCircle,
  BarChart3,
  Handshake,
  CheckSquare,
  UserPlus,
  Calendar,
  Briefcase,
  ClipboardList,
  Building,
} from 'lucide-react'
import {
  type CommandItemDescriptor,
  type CommandSource,
  type CommandActionContext,
  type CommandPermissions,
} from '../types'

function createStaticItems(
  query: string,
  userRole?: string,
  pathname?: string,
  currentUserPersonId?: string,
  permissions?: CommandPermissions,
  organizationId?: string | null
): CommandItemDescriptor[] {
  const q = query.toLowerCase()
  const hasOrganization = !!organizationId
  const isAdmin = permissions?.isAdmin ?? userRole === 'ADMIN'
  const hasLinkedPerson = !!currentUserPersonId

  // If no organization, only show Create Organization action
  if (!hasOrganization) {
    const items: CommandItemDescriptor[] = []
    items.push({
      id: 'organization.setup',
      title: 'Setup Organization',
      subtitle: 'Create or join an organization',
      icon: <Building className='h-4 w-4' />,
      keywords: ['organization', 'org', 'create', 'setup', 'new', 'join'],
      group: 'Quick Actions',
      perform: ({ closePalette, router }) => {
        router.push('/dashboard')
        closePalette()
      },
    })
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

  // Use permissions from server if available, otherwise fall back to client-side checks
  const canCreateTasks =
    permissions?.['task.create'] ?? (isAdmin || hasLinkedPerson)
  const canCreateMeetings =
    permissions?.['meeting.create'] ?? (isAdmin || hasLinkedPerson)
  const canCreateInitiatives =
    permissions?.['initiative.create'] ?? (isAdmin || hasLinkedPerson)
  const canCreateFeedback =
    permissions?.['feedback.create'] ?? (isAdmin || hasLinkedPerson)
  const canCreateOneOnOne =
    permissions?.['oneonone.create'] ?? (isAdmin || hasLinkedPerson)

  const items: CommandItemDescriptor[] = []

  // Task creation - use permission check
  if (canCreateTasks) {
    items.push({
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
    })
  }

  // One-on-one creation - use permission check
  if (canCreateOneOnOne) {
    items.push({
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
    })
  }

  // Meeting creation - use permission check
  if (canCreateMeetings) {
    items.push({
      id: 'meeting.create',
      title: 'Create Meeting',
      subtitle: 'Schedule a new team meeting',
      icon: <Calendar className='h-4 w-4' />,
      keywords: [
        'meeting',
        'schedule',
        'calendar',
        'team meeting',
        'new meeting',
      ],
      group: 'Quick Actions',
      perform: ({ closePalette, router }) => {
        router.push('/meetings/new')
        closePalette()
      },
    })
  }

  // Initiative creation - use permission check
  if (canCreateInitiatives) {
    items.push({
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
    })
  }

  // Feedback creation - use permission check
  if (canCreateFeedback) {
    items.push({
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
    })
  }

  // Add initiative-specific task creation if we're on an initiative page and can create tasks
  if (pathname?.match(/^\/initiatives\/[^/]+$/) && canCreateTasks) {
    items.push({
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
    })
  }

  // Navigation items
  items.push(
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
    // Only show "My Tasks" if user has a linked person
    ...(hasLinkedPerson
      ? [
          {
            id: 'nav.my-tasks',
            title: 'View My Tasks',
            subtitle: 'Go to my assigned tasks',
            icon: <CheckSquare className='h-4 w-4' />,
            keywords: ['my tasks', 'assigned', 'personal', 'todo'],
            group: 'Navigation',
            perform: ({ closePalette, router }: CommandActionContext) => {
              router.push('/my-tasks')
              closePalette()
            },
          },
        ]
      : []),
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
      id: 'nav.feedback-campaigns',
      title: 'View Feedback Campaigns',
      subtitle: 'Go to feedback campaigns',
      icon: <ClipboardList className='h-4 w-4' />,
      keywords: [
        'feedback campaigns',
        'campaigns',
        'feedback request',
        'survey',
      ],
      group: 'Navigation',
      perform: ({ closePalette, router }) => {
        router.push('/feedback-campaigns')
        closePalette()
      },
    },
    {
      id: 'nav.meetings',
      title: 'View Meetings',
      subtitle: 'Go to meetings page',
      icon: <Calendar className='h-4 w-4' />,
      keywords: ['meetings', 'calendar', 'schedule'],
      group: 'Navigation',
      perform: ({ closePalette, router }) => {
        router.push('/meetings')
        closePalette()
      },
    },
    {
      id: 'nav.oneonones',
      title: 'View My 1:1s',
      subtitle: 'Go to your one-on-one meetings',
      icon: <Handshake className='h-4 w-4' />,
      keywords: [
        '1:1',
        'one on one',
        'oneonone',
        'meetings',
        'personal meetings',
      ],
      group: 'Navigation',
      perform: ({ closePalette, router }) => {
        router.push('/oneonones')
        closePalette()
      },
    },
    // Add reports navigation for admin users
    ...(isAdmin
      ? [
          {
            id: 'nav.reports',
            title: 'View Reports',
            subtitle: 'Go to reports page',
            icon: <BarChart3 className='h-4 w-4' />,
            keywords: ['reports', 'analytics', 'data', 'charts'],
            group: 'Navigation',
            perform: ({ closePalette, router }: CommandActionContext) => {
              router.push('/reports')
              closePalette()
            },
          },
        ]
      : [])
  )

  // Add admin-only commands
  if (userRole === 'ADMIN') {
    items.push(
      {
        id: 'person.create',
        title: 'Create Person',
        subtitle: 'Add a new person to the organization',
        icon: <UserPlus className='h-4 w-4' />,
        keywords: [
          'person',
          'people',
          'new person',
          'add person',
          'employee',
          'team member',
        ],
        group: 'Quick Actions',
        perform: ({ closePalette, router }) => {
          router.push('/people/new')
          closePalette()
        },
      },
      {
        id: 'nav.job-roles',
        title: 'View Job Roles',
        subtitle: 'Go to job role management',
        icon: <Briefcase className='h-4 w-4' />,
        keywords: [
          'job roles',
          'job role',
          'roles',
          'positions',
          'jobs',
          'job management',
        ],
        group: 'Administration',
        perform: ({ closePalette, router }) => {
          router.push('/organization/job-roles')
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
    currentUserPersonId?: string,
    permissions?: CommandPermissions,
    organizationId?: string | null
  ) => {
    return createStaticItems(
      query,
      userRole,
      pathname,
      currentUserPersonId,
      permissions,
      organizationId
    )
  },
}
