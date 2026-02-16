/**
 * Utility functions to automatically resolve exceptions when underlying problems are fixed
 */

import { prisma } from '@/lib/db'

/**
 * Resolve one-on-one exceptions for a manager-report pair
 * Called when a 1:1 meeting is created
 */
export async function resolveOneOnOneExceptions(
  organizationId: string,
  managerId: string,
  reportId: string
): Promise<void> {
  // EntityId can be in either direction: managerId-reportId or reportId-managerId
  const entityId1 = `${managerId}-${reportId}`
  const entityId2 = `${reportId}-${managerId}`

  // Find all active exceptions for this pair
  const exceptions = await prisma.exception.findMany({
    where: {
      organizationId,
      entityType: 'OneOnOne',
      entityId: { in: [entityId1, entityId2] },
      status: 'active',
    },
    select: { id: true },
  })

  if (exceptions.length === 0) {
    return
  }

  const now = new Date()

  await prisma.exception.updateMany({
    where: {
      id: { in: exceptions.map(e => e.id) },
    },
    data: {
      status: 'resolved',
      resolvedAt: now,
    },
  })
}

/**
 * Resolve initiative check-in exceptions
 * Called when a check-in is created for an initiative
 */
export async function resolveInitiativeExceptions(
  organizationId: string,
  initiativeId: string
): Promise<void> {
  // Find all active exceptions for this initiative
  const exceptions = await prisma.exception.findMany({
    where: {
      organizationId,
      entityType: 'Initiative',
      entityId: initiativeId,
      status: 'active',
    },
    select: { id: true },
  })

  if (exceptions.length === 0) {
    return
  }

  const now = new Date()

  await prisma.exception.updateMany({
    where: {
      id: { in: exceptions.map(e => e.id) },
    },
    data: {
      status: 'resolved',
      resolvedAt: now,
    },
  })
}

/**
 * Resolve feedback360 exceptions for a person
 * Called when a feedback campaign is created
 * Only resolves exceptions from rules with type 'feedback_360'
 */
export async function resolveFeedback360Exceptions(
  organizationId: string,
  personId: string
): Promise<void> {
  // Find all active exceptions for this person from feedback_360 rules
  const exceptions = await prisma.exception.findMany({
    where: {
      organizationId,
      entityType: 'Person',
      entityId: personId,
      status: 'active',
      rule: {
        ruleType: 'feedback_360',
      },
    },
    select: { id: true },
  })

  if (exceptions.length === 0) {
    return
  }

  const now = new Date()

  await prisma.exception.updateMany({
    where: {
      id: { in: exceptions.map(e => e.id) },
    },
    data: {
      status: 'resolved',
      resolvedAt: now,
    },
  })
}

/**
 * Resolve manager span exceptions if the manager's direct report count is below threshold
 * Called when a person's manager is updated
 * Only resolves exceptions from rules with type 'manager_span'
 */
export async function resolveManagerSpanExceptions(
  organizationId: string,
  managerId: string
): Promise<void> {
  // Get the manager's current direct report count
  const manager = await prisma.person.findUnique({
    where: { id: managerId },
    include: {
      _count: {
        select: {
          reports: {
            where: {
              status: 'active',
            },
          },
        },
      },
    },
  })

  if (!manager) {
    return
  }

  const directReportCount = manager._count.reports

  // Get all active manager_span rules for this organization
  const managerSpanRules = await prisma.organizationToleranceRule.findMany({
    where: {
      organizationId,
      ruleType: 'manager_span',
      isEnabled: true,
    },
  })

  // Check each rule to see if the manager's count is below threshold
  const exceptionsToResolve: string[] = []

  for (const rule of managerSpanRules) {
    const config = rule.config as { maxDirectReports: number }
    const maxDirectReports = config.maxDirectReports

    // If current count is at or below threshold, resolve exceptions for this rule
    if (directReportCount <= maxDirectReports) {
      // Find active exceptions for this manager and rule
      const exceptions = await prisma.exception.findMany({
        where: {
          organizationId,
          ruleId: rule.id,
          entityType: 'Person',
          entityId: managerId,
          status: 'active',
        },
        select: {
          id: true,
        },
      })

      exceptionsToResolve.push(...exceptions.map(e => e.id))
    }
  }

  if (exceptionsToResolve.length === 0) {
    return
  }

  const now = new Date()

  await prisma.exception.updateMany({
    where: {
      id: { in: exceptionsToResolve },
    },
    data: {
      status: 'resolved',
      resolvedAt: now,
    },
  })
}
