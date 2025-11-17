import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import type { Prisma, EmployeeType } from '@prisma/client'

export const peopleTool = {
  description: 'Get information about people in the organization',
  parameters: z.object({
    query: z
      .string()
      .optional()
      .describe('Search query to filter people by name, role, or team'),
    hasManager: z
      .boolean()
      .optional()
      .describe('Whether the person has a manager'),
    hasReports: z
      .boolean()
      .optional()
      .describe('Whether to include direct reports'),
    managerIs: z
      .string()
      .optional()
      .describe('The person ID of the manager of the people to look up'),
    teamIs: z
      .string()
      .optional()
      .describe('The team ID of the people to look up'),
    jobRoleIs: z
      .string()
      .optional()
      .describe('The job role ID of the people to look up'),
    jobLevelIs: z
      .string()
      .optional()
      .describe('The job level ID of the people to look up'),
    jobDomainIs: z
      .string()
      .optional()
      .describe('The job domain ID of the people to look up'),
    employeeTypeIs: z
      .enum(['FULL_TIME', 'PART_TIME', 'INTERN', 'CONSULTANT'])
      .optional()
      .describe('The employee type of the people to look up'),
  }),
  execute: async ({
    query,
    hasManager,
    hasReports,
    managerIs,
    teamIs,
    jobRoleIs,
    jobLevelIs,
    jobDomainIs,
    employeeTypeIs,
    includeManager = false,
    includeReports = false,
  }: {
    query?: string
    hasManager?: boolean
    hasReports?: boolean
    managerIs?: string
    teamIs?: string
    jobRoleIs?: string
    jobLevelIs?: string
    jobDomainIs?: string
    employeeTypeIs?: EmployeeType
    includeManager?: boolean
    includeReports?: boolean
  }) => {
    console.log('🔧 peopleTool called with parameters:', {
      query,
      hasManager,
      hasReports,
      managerIs,
      teamIs,
      jobRoleIs,
      jobLevelIs,
      jobDomainIs,
      employeeTypeIs,
      includeManager,
      includeReports,
    })
    try {
      const user = await getCurrentUser()
      if (!user.managerOSOrganizationId) {
        throw new Error('User must belong to an organization')
      }

      const whereClause: Prisma.PersonWhereInput = {
        organizationId: user.managerOSOrganizationId,
        status: 'active',
      }

      if (query) {
        whereClause.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { role: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ]
      }

      if (managerIs) {
        // Specific manager ID takes precedence
        whereClause.managerId = managerIs
      } else if (hasManager !== undefined) {
        // Fall back to hasManager filter if managerIs not provided
        if (hasManager) {
          whereClause.managerId = { not: null }
        } else {
          whereClause.managerId = null
        }
      }

      if (hasReports !== undefined) {
        if (hasReports) {
          whereClause.reports = { some: {} }
        } else {
          whereClause.reports = { none: {} }
        }
      }

      if (teamIs) {
        whereClause.teamId = teamIs
      }

      if (jobRoleIs) {
        whereClause.jobRoleId = jobRoleIs
      }

      if (jobLevelIs || jobDomainIs) {
        const jobRoleFilter: Prisma.JobRoleWhereInput = {}
        if (jobLevelIs) {
          jobRoleFilter.levelId = jobLevelIs
        }
        if (jobDomainIs) {
          jobRoleFilter.domainId = jobDomainIs
        }
        whereClause.jobRole = jobRoleFilter
      }

      if (employeeTypeIs) {
        whereClause.employeeType = employeeTypeIs
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

      return result
    } catch (error) {
      console.error('Error in people tool:', error)
      throw error
    }
  },
}
