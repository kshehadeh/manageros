import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

// Tool schemas for different entity types
export const peopleTool = {
  description: 'Get information about people in the organization',
  parameters: z.object({
    query: z
      .string()
      .optional()
      .describe('Search query to filter people by name, role, or team'),
    includeManager: z
      .boolean()
      .optional()
      .describe('Whether to include manager information'),
    includeReports: z
      .boolean()
      .optional()
      .describe('Whether to include direct reports'),
  }),
  execute: async ({
    query,
    includeManager = false,
    includeReports = false,
  }: {
    query?: string
    includeManager?: boolean
    includeReports?: boolean
  }) => {
    console.log('People tool called with:', {
      query,
      includeManager,
      includeReports,
    })
    try {
      const user = await getCurrentUser()
      console.log('Current user:', user?.id, user?.organizationId)
      if (!user.organizationId) {
        throw new Error('User must belong to an organization')
      }

      const whereClause: Prisma.PersonWhereInput = {
        organizationId: user.organizationId,
        status: 'active',
      }

      if (query) {
        whereClause.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { role: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ]
      }

      const people = await prisma.person.findMany({
        where: whereClause,
        include: {
          team: true,
          manager: includeManager
            ? {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              }
            : false,
          reports: includeReports
            ? {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              }
            : false,
          jobRole: {
            include: {
              level: true,
              domain: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      })

      console.log('Found people:', people.length)
      console.log(
        'People data:',
        people.map(p => ({ id: p.id, name: p.name, manager: p.manager?.name }))
      )

      const result = {
        people: people.map(person => ({
          id: person.id,
          name: person.name,
          email: person.email,
          role: person.role,
          team: person.team?.name,
          manager: person.manager?.name,
          reports: person.reports?.map(r => r.name),
          jobRole: person.jobRole?.title,
          jobLevel: person.jobRole?.level?.name,
          jobDomain: person.jobRole?.domain?.name,
        })),
      }

      console.log('People tool returning:', JSON.stringify(result, null, 2))
      return result
    } catch (error) {
      console.error('Error in people tool:', error)
      throw error
    }
  },
}

export const initiativesTool = {
  description: 'Get information about initiatives in the organization',
  parameters: z.object({
    status: z
      .enum(['planned', 'in_progress', 'paused', 'done', 'canceled'])
      .optional()
      .describe('Filter by initiative status'),
    rag: z
      .enum(['green', 'amber', 'red'])
      .optional()
      .describe('Filter by RAG status'),
    teamId: z.string().optional().describe('Filter by team ID'),
    query: z
      .string()
      .optional()
      .describe('Search query to filter initiatives by title or summary'),
  }),
  execute: async ({
    status,
    rag,
    teamId,
    query,
  }: {
    status?: string
    rag?: string
    teamId?: string
    query?: string
  }) => {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      throw new Error('User must belong to an organization')
    }

    const whereClause: Prisma.InitiativeWhereInput = {
      organizationId: user.organizationId,
    }

    if (status) whereClause.status = status
    if (rag) whereClause.rag = rag
    if (teamId) whereClause.teamId = teamId
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
      ]
    }

    const initiatives = await prisma.initiative.findMany({
      where: whereClause,
      include: {
        team: true,
        owners: {
          include: {
            person: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        objectives: true,
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: {
            objectives: true,
            tasks: true,
            checkIns: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return {
      initiatives: initiatives.map(initiative => ({
        id: initiative.id,
        title: initiative.title,
        summary: initiative.summary,
        status: initiative.status,
        rag: initiative.rag,
        confidence: initiative.confidence,
        startDate: initiative.startDate,
        targetDate: initiative.targetDate,
        team: initiative.team?.name,
        owners: initiative.owners,
        objectivesCount: initiative._count.objectives,
        tasksCount: initiative._count.tasks,
        checkInsCount: initiative._count.checkIns,
        tasks: initiative.tasks.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
        })),
      })),
    }
  },
}

export const tasksTool = {
  description: 'Get information about tasks in the organization',
  parameters: z.object({
    status: z
      .enum(['todo', 'doing', 'blocked', 'done', 'dropped'])
      .optional()
      .describe('Filter by task status'),
    priority: z.number().optional().describe('Filter by task priority (1-4)'),
    assigneeId: z.string().optional().describe('Filter by assigned person ID'),
    initiativeId: z.string().optional().describe('Filter by initiative ID'),
    query: z
      .string()
      .optional()
      .describe('Search query to filter tasks by title or description'),
  }),
  execute: async ({
    status,
    priority,
    assigneeId,
    initiativeId,
    query,
  }: {
    status?: string
    priority?: number
    assigneeId?: string
    initiativeId?: string
    query?: string
  }) => {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      throw new Error('User must belong to an organization')
    }

    const whereClause: Prisma.TaskWhereInput = {
      OR: [
        {
          createdBy: {
            organizationId: user.organizationId,
            id: user.id,
          },
        },
        { initiative: { organizationId: user.organizationId } },
        { objective: { initiative: { organizationId: user.organizationId } } },
      ],
    }

    if (status) whereClause.status = status
    if (priority) whereClause.priority = priority
    if (assigneeId) whereClause.assigneeId = assigneeId
    if (initiativeId) whereClause.initiativeId = initiativeId
    if (query) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ]
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        initiative: {
          select: {
            id: true,
            title: true,
          },
        },
        objective: {
          select: {
            id: true,
            title: true,
            initiative: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return {
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assignee: task.assignee?.name,
        initiative: task.initiative?.title,
        objective: task.objective?.title,
        createdBy: task.createdBy?.name,
        completedAt: task.completedAt,
      })),
    }
  },
}

export const meetingsTool = {
  description: 'Get information about meetings in the organization',
  parameters: z.object({
    ownerId: z.string().optional().describe('Filter by meeting owner ID'),
    participantId: z.string().optional().describe('Filter by participant ID'),
    query: z
      .string()
      .optional()
      .describe('Search query to filter meetings by title or description'),
  }),
  execute: async ({
    ownerId,
    participantId,
    query,
  }: {
    ownerId?: string
    participantId?: string
    query?: string
  }) => {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      throw new Error('User must belong to an organization')
    }

    const whereClause: Prisma.MeetingWhereInput = {
      organizationId: user.organizationId,
    }

    if (ownerId) whereClause.ownerId = ownerId
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ]
    }

    const meetings = await prisma.meeting.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participants: {
          include: {
            person: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        instances: {
          select: {
            id: true,
            scheduledAt: true,
          },
          orderBy: { scheduledAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            instances: true,
            participants: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Filter by participant if specified
    let filteredMeetings = meetings
    if (participantId) {
      filteredMeetings = meetings.filter(meeting =>
        meeting.participants.some(p => p.personId === participantId)
      )
    }

    return {
      meetings: filteredMeetings.map(meeting => ({
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        owner: meeting.owner?.name,
        participants: meeting.participants.map(p => p.person.name),
        instancesCount: meeting._count.instances,
        participantsCount: meeting._count.participants,
        lastInstance: meeting.instances[0]
          ? {
              scheduledAt: meeting.instances[0].scheduledAt,
            }
          : null,
      })),
    }
  },
}

export const teamsTool = {
  description: 'Get information about teams in the organization',
  parameters: z.object({
    parentId: z.string().optional().describe('Filter by parent team ID'),
    query: z
      .string()
      .optional()
      .describe('Search query to filter teams by name or description'),
  }),
  execute: async ({
    parentId,
    query,
  }: {
    parentId?: string
    query?: string
  }) => {
    const user = await getCurrentUser()
    if (!user.organizationId) {
      throw new Error('User must belong to an organization')
    }

    const whereClause: Prisma.TeamWhereInput = {
      organizationId: user.organizationId,
    }

    if (parentId) whereClause.parentId = parentId
    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ]
    }

    const teams = await prisma.team.findMany({
      where: whereClause,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
          },
        },
        people: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        _count: {
          select: {
            people: true,
            children: true,
            initiatives: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return {
      teams: teams.map(team => ({
        id: team.id,
        name: team.name,
        description: team.description,
        parent: team.parent?.name,
        children: team.children.map(c => c.name),
        members: team.people.map(p => ({
          id: p.id,
          name: p.name,
          role: p.role,
        })),
        membersCount: team._count.people,
        childrenCount: team._count.children,
        initiativesCount: team._count.initiatives,
      })),
    }
  },
}

export const currentUserTool = {
  description:
    'Get information about the current user to help interpret pronouns like "me" or "I" in chat inputs',
  parameters: z.object({}),
  execute: async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    if (!user.organizationId) {
      throw new Error('User must belong to an organization')
    }

    if (!user.personId) {
      throw new Error('User is not linked to a person record')
    }

    // Get the person record linked to this user
    const person = await prisma.person.findFirst({
      where: {
        id: user.personId,
        organizationId: user.organizationId,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        reports: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        jobRole: {
          include: {
            level: true,
            domain: true,
          },
        },
      },
    })

    if (!person) {
      throw new Error('No person record found for current user')
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
      person: {
        id: person.id,
        name: person.name,
        email: person.email,
        role: person.role,
        team: person.team?.name,
        manager: person.manager?.name,
        reports: person.reports.map((r: { name: string }) => r.name),
        jobRole: person.jobRole?.title,
        jobLevel: person.jobRole?.level?.name,
        jobDomain: person.jobRole?.domain?.name,
      },
    }
  },
}

// Export all tools
export const aiTools = {
  people: peopleTool,
  initiatives: initiativesTool,
  tasks: tasksTool,
  meetings: meetingsTool,
  teams: teamsTool,
  currentUser: currentUserTool,
}
