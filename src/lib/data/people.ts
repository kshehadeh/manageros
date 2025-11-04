import 'server-only'

import { prisma } from '@/lib/db'

export async function getActivePeopleForOrganization(organizationId: string) {
  if (!organizationId) {
    return []
  }

  return prisma.person.findMany({
    where: {
      status: 'active',
      organizationId,
    },
    include: {
      jobRole: {
        include: {
          level: true,
          domain: true,
        },
      },
      team: true,
      manager: true,
      reports: true,
      user: true,
    },
    orderBy: { name: 'asc' },
  })
}

export async function getPersonById(
  personId: string,
  organizationId: string,
  options?: {
    includeTeam?: boolean
    includeManager?: boolean
    includeReports?: boolean
    includeJobRole?: boolean
    includeUser?: boolean
    includeJiraAccount?: boolean
    includeGithubAccount?: boolean
    includeNameOnly?: boolean
  }
) {
  if (options?.includeNameOnly) {
    return prisma.person.findFirst({
      where: {
        id: personId,
        organizationId,
      },
      select: { name: true },
    })
  }

  const include: Record<string, unknown> = {}
  if (options?.includeTeam) {
    include.team = true
  }
  if (options?.includeManager) {
    include.manager = {
      include: {
        reports: true,
      },
    }
  }
  if (options?.includeReports) {
    include.reports = true
  }
  if (options?.includeJobRole) {
    include.jobRole = {
      include: {
        level: true,
        domain: true,
      },
    }
  }
  if (options?.includeUser) {
    include.user = {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    }
  }
  if (options?.includeJiraAccount) {
    include.jiraAccount = true
  }
  if (options?.includeGithubAccount) {
    include.githubAccount = true
  }

  return prisma.person.findFirst({
    where: {
      id: personId,
      organizationId,
    },
    include: Object.keys(include).length > 0 ? include : undefined,
  })
}

export async function getPersonByUserId(
  userId: string,
  options?: {
    includeTeam?: boolean
    includeManager?: boolean
    includeReports?: boolean
    includeJobRole?: boolean
  }
) {
  const include: Record<string, unknown> = {}
  if (options?.includeTeam) {
    include.team = true
  }
  if (options?.includeManager) {
    include.manager = {
      include: {
        reports: true,
      },
    }
  }
  if (options?.includeReports) {
    include.reports = true
  }
  if (options?.includeJobRole) {
    include.jobRole = {
      include: {
        level: true,
        domain: true,
      },
    }
  }

  return prisma.person.findFirst({
    where: {
      user: {
        id: userId,
      },
    },
    include: Object.keys(include).length > 0 ? include : undefined,
  })
}

export async function getDirectReports(
  managerId: string,
  organizationId: string,
  options?: {
    limit?: number
    includeOnlyFields?: boolean
  }
) {
  const select = options?.includeOnlyFields
    ? {
        id: true,
        name: true,
        avatar: true,
      }
    : undefined

  return prisma.person.findMany({
    where: {
      managerId,
      organizationId,
      status: 'active',
    },
    select,
    orderBy: { name: 'asc' },
    take: options?.limit,
  })
}

export async function getPeopleForOrganization(organizationId: string) {
  return prisma.person.findMany({
    where: {
      organizationId,
    },
    orderBy: { name: 'asc' },
  })
}

export async function getPersonWithReportsAndManager(
  personId: string,
  organizationId: string
) {
  return prisma.person.findFirst({
    where: {
      id: personId,
      organizationId,
    },
    include: {
      reports: true,
      manager: true,
    },
  })
}
