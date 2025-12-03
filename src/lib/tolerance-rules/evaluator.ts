/**
 * Exception evaluation logic for tolerance rules
 */

import { prisma } from '@/lib/db'
import {
  createException,
  linkExceptionToNotification,
} from '@/lib/actions/exceptions'
import { createSystemNotification } from '@/lib/actions/notification'
import type {
  ToleranceRule,
  ToleranceRuleType,
  ToleranceRuleConfig,
  OneOnOneFrequencyConfig,
  InitiativeCheckInConfig,
  Feedback360Config,
  ManagerSpanConfig,
} from '@/types/tolerance-rule'
import type { CreateExceptionInput } from '@/types/exception'

/**
 * Evaluate all enabled rules for an organization
 */
export async function evaluateAllRules(organizationId: string): Promise<{
  exceptionsCreated: number
  errors: string[]
}> {
  const rules = await prisma.organizationToleranceRule.findMany({
    where: {
      organizationId,
      isEnabled: true,
    },
  })

  let exceptionsCreated = 0
  const errors: string[] = []

  for (const rule of rules) {
    try {
      const count = await evaluateRule({
        ...rule,
        ruleType: rule.ruleType as ToleranceRuleType,
        config: rule.config as unknown as ToleranceRuleConfig,
      } as ToleranceRule)
      exceptionsCreated += count
    } catch (error) {
      errors.push(
        `Error evaluating rule ${rule.id} (${rule.name}): ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  return { exceptionsCreated, errors }
}

/**
 * Evaluate a single rule and create exceptions if thresholds are exceeded
 */
async function evaluateRule(rule: ToleranceRule): Promise<number> {
  switch (rule.ruleType) {
    case 'one_on_one_frequency':
      return evaluateOneOnOneFrequency(
        rule,
        rule.config as OneOnOneFrequencyConfig
      )
    case 'initiative_checkin':
      return evaluateInitiativeCheckIn(
        rule,
        rule.config as InitiativeCheckInConfig
      )
    case 'feedback_360':
      return evaluateFeedback360(rule, rule.config as Feedback360Config)
    case 'manager_span':
      return evaluateManagerSpan(rule, rule.config as ManagerSpanConfig)
    default:
      throw new Error(`Unknown rule type: ${rule.ruleType}`)
  }
}

/**
 * Evaluate one-on-one frequency rule
 * Checks if managers have had 1:1s with their direct reports within thresholds
 */
async function evaluateOneOnOneFrequency(
  rule: ToleranceRule,
  config: OneOnOneFrequencyConfig
): Promise<number> {
  let exceptionsCreated = 0

  // Get all managers with direct reports in the organization
  const managers = await prisma.person.findMany({
    where: {
      organizationId: rule.organizationId,
      status: 'active',
      reports: {
        some: {
          status: 'active',
        },
      },
    },
    include: {
      reports: {
        where: {
          status: 'active',
        },
      },
    },
  })

  for (const manager of managers) {
    for (const report of manager.reports) {
      const lastOneOnOne = await getLastOneOnOneDate(manager.id, report.id)

      if (!lastOneOnOne) {
        // No 1:1 ever recorded - create urgent exception
        const daysSince = Infinity
        if (daysSince > config.urgentThresholdDays) {
          await createExceptionForOneOnOne(
            rule,
            manager.id,
            report.id,
            'urgent',
            config.urgentThresholdDays,
            0
          )
          exceptionsCreated++
        }
        continue
      }

      const daysSince = Math.floor(
        (Date.now() - lastOneOnOne.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Check if we need to create an exception
      // Only create if there isn't already an active exception for this rule + entity
      const existingException = await prisma.exception.findFirst({
        where: {
          ruleId: rule.id,
          organizationId: rule.organizationId,
          entityType: 'OneOnOne',
          entityId: `${manager.id}-${report.id}`,
          status: 'active',
        },
      })

      if (existingException) {
        continue // Already has an active exception
      }

      if (daysSince > config.urgentThresholdDays) {
        await createExceptionForOneOnOne(
          rule,
          manager.id,
          report.id,
          'urgent',
          config.urgentThresholdDays,
          daysSince
        )
        exceptionsCreated++
      } else if (daysSince > config.warningThresholdDays) {
        await createExceptionForOneOnOne(
          rule,
          manager.id,
          report.id,
          'warning',
          config.warningThresholdDays,
          daysSince
        )
        exceptionsCreated++
      }
    }
  }

  return exceptionsCreated
}

/**
 * Get the most recent one-on-one date for a manager-report pair
 */
async function getLastOneOnOneDate(
  managerId: string,
  reportId: string
): Promise<Date | null> {
  const oneOnOne = await prisma.oneOnOne.findFirst({
    where: {
      OR: [
        { managerId, reportId },
        { managerId: reportId, reportId: managerId },
      ],
    },
    orderBy: {
      scheduledAt: 'desc',
    },
  })

  return oneOnOne?.scheduledAt || null
}

/**
 * Create exception for one-on-one frequency issue
 */
async function createExceptionForOneOnOne(
  rule: ToleranceRule,
  managerId: string,
  reportId: string,
  severity: 'warning' | 'urgent',
  thresholdDays: number,
  daysSince: number
): Promise<void> {
  // Get manager and report names for message
  const [manager, report] = await Promise.all([
    prisma.person.findUnique({ where: { id: managerId } }),
    prisma.person.findUnique({ where: { id: reportId } }),
  ])

  const managerName = manager?.name || 'Unknown'
  const reportName = report?.name || 'Unknown'

  const message =
    daysSince === Infinity
      ? `${managerName} has not had a 1:1 with ${reportName} (threshold: ${thresholdDays} days)`
      : `${managerName} has not had a 1:1 with ${reportName} in ${daysSince} days (threshold: ${thresholdDays} days)`

  const exceptionInput: CreateExceptionInput = {
    ruleId: rule.id,
    organizationId: rule.organizationId,
    severity,
    entityType: 'OneOnOne',
    entityId: `${managerId}-${reportId}`,
    message,
    metadata: {
      managerId,
      reportId,
      managerName,
      reportName,
      thresholdDays,
      daysSince: daysSince === Infinity ? null : daysSince,
    },
  }

  const exception = await createException(exceptionInput)

  // Create notification for the manager
  const managerWithUser = await prisma.person.findUnique({
    where: { id: managerId },
    include: { user: true },
  })

  if (managerWithUser?.user?.id) {
    const notification = await createSystemNotification({
      title:
        severity === 'urgent'
          ? 'Urgent: Missing 1:1 Meeting'
          : 'Warning: Missing 1:1 Meeting',
      message,
      type: severity === 'urgent' ? 'error' : 'warning',
      organizationId: rule.organizationId,
      userId: managerWithUser.user.id,
      metadata: {
        exceptionId: exception.id,
        entityType: 'OneOnOne',
        entityId: `${managerId}-${reportId}`,
        navigationPath: `/people/${managerId}`,
      },
    })

    await linkExceptionToNotification(exception.id, notification.id)
  }
}

/**
 * Evaluate initiative check-in rule
 * Checks if initiatives have had check-ins within the threshold
 */
async function evaluateInitiativeCheckIn(
  rule: ToleranceRule,
  config: InitiativeCheckInConfig
): Promise<number> {
  let exceptionsCreated = 0

  // Get all active initiatives
  const initiatives = await prisma.initiative.findMany({
    where: {
      organizationId: rule.organizationId,
      status: {
        in: ['planned', 'in_progress'],
      },
    },
  })

  for (const initiative of initiatives) {
    const lastCheckIn = await getLastCheckInDate(initiative.id)

    if (!lastCheckIn) {
      // No check-in ever recorded
      const daysSince = Infinity
      if (daysSince > config.warningThresholdDays) {
        await createExceptionForInitiative(
          rule,
          initiative.id,
          'warning',
          config.warningThresholdDays,
          0
        )
        exceptionsCreated++
      }
      continue
    }

    const daysSince = Math.floor(
      (Date.now() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Check if we need to create an exception
    const existingException = await prisma.exception.findFirst({
      where: {
        ruleId: rule.id,
        organizationId: rule.organizationId,
        entityType: 'Initiative',
        entityId: initiative.id,
        status: 'active',
      },
    })

    if (existingException) {
      continue
    }

    if (daysSince > config.warningThresholdDays) {
      await createExceptionForInitiative(
        rule,
        initiative.id,
        'warning',
        config.warningThresholdDays,
        daysSince
      )
      exceptionsCreated++
    }
  }

  return exceptionsCreated
}

/**
 * Get the most recent check-in date for an initiative
 */
async function getLastCheckInDate(initiativeId: string): Promise<Date | null> {
  const checkIn = await prisma.checkIn.findFirst({
    where: {
      initiativeId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return checkIn?.createdAt || null
}

/**
 * Create exception for initiative check-in issue
 */
async function createExceptionForInitiative(
  rule: ToleranceRule,
  initiativeId: string,
  severity: 'warning' | 'urgent',
  thresholdDays: number,
  daysSince: number
): Promise<void> {
  const initiative = await prisma.initiative.findUnique({
    where: { id: initiativeId },
  })

  const initiativeName = initiative?.title || 'Unknown Initiative'

  const message =
    daysSince === Infinity
      ? `Initiative "${initiativeName}" has no check-ins (threshold: ${thresholdDays} days)`
      : `Initiative "${initiativeName}" has not had a check-in in ${daysSince} days (threshold: ${thresholdDays} days)`

  const exceptionInput: CreateExceptionInput = {
    ruleId: rule.id,
    organizationId: rule.organizationId,
    severity,
    entityType: 'Initiative',
    entityId: initiativeId,
    message,
    metadata: {
      initiativeId,
      initiativeName,
      thresholdDays,
      daysSince: daysSince === Infinity ? null : daysSince,
    },
  }

  const exception = await createException(exceptionInput)

  // Create notifications for initiative owners
  const owners = await prisma.initiativeOwner.findMany({
    where: { initiativeId },
    include: {
      person: {
        include: {
          user: true,
        },
      },
    },
  })

  for (const owner of owners) {
    if (owner.person.user?.id) {
      const notification = await createSystemNotification({
        title: 'Warning: Missing Initiative Check-In',
        message,
        type: 'warning',
        organizationId: rule.organizationId,
        userId: owner.person.user.id,
        metadata: {
          exceptionId: exception.id,
          entityType: 'Initiative',
          entityId: initiativeId,
          navigationPath: `/initiatives/${initiativeId}`,
        },
      })

      await linkExceptionToNotification(exception.id, notification.id)
    }
  }
}

/**
 * Evaluate 360 feedback rule
 * Checks if people have had feedback campaigns within the threshold
 */
async function evaluateFeedback360(
  rule: ToleranceRule,
  config: Feedback360Config
): Promise<number> {
  let exceptionsCreated = 0

  // Get all active people in the organization
  const people = await prisma.person.findMany({
    where: {
      organizationId: rule.organizationId,
      status: 'active',
    },
  })

  for (const person of people) {
    const lastFeedbackCampaign = await getLastFeedbackCampaignDate(person.id)

    if (!lastFeedbackCampaign) {
      // No feedback campaign ever recorded
      const monthsSince = Infinity
      if (monthsSince > config.warningThresholdMonths) {
        await createExceptionForFeedback360(
          rule,
          person.id,
          'warning',
          config.warningThresholdMonths,
          0
        )
        exceptionsCreated++
      }
      continue
    }

    const monthsSince = Math.floor(
      (Date.now() - lastFeedbackCampaign.getTime()) / (1000 * 60 * 60 * 24 * 30)
    )

    // Check if we need to create an exception
    const existingException = await prisma.exception.findFirst({
      where: {
        ruleId: rule.id,
        organizationId: rule.organizationId,
        entityType: 'Person',
        entityId: person.id,
        status: 'active',
      },
    })

    if (existingException) {
      continue
    }

    if (monthsSince > config.warningThresholdMonths) {
      await createExceptionForFeedback360(
        rule,
        person.id,
        'warning',
        config.warningThresholdMonths,
        monthsSince
      )
      exceptionsCreated++
    }
  }

  return exceptionsCreated
}

/**
 * Get the most recent feedback campaign date for a person
 */
async function getLastFeedbackCampaignDate(
  personId: string
): Promise<Date | null> {
  const campaign = await prisma.feedbackCampaign.findFirst({
    where: {
      targetPersonId: personId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return campaign?.createdAt || null
}

/**
 * Create exception for 360 feedback issue
 */
async function createExceptionForFeedback360(
  rule: ToleranceRule,
  personId: string,
  severity: 'warning' | 'urgent',
  thresholdMonths: number,
  monthsSince: number
): Promise<void> {
  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: {
      manager: true,
    },
  })

  const personName = person?.name || 'Unknown'

  const message =
    monthsSince === Infinity
      ? `${personName} has not had a 360 feedback campaign (threshold: ${thresholdMonths} months)`
      : `${personName} has not had a 360 feedback campaign in ${monthsSince} months (threshold: ${thresholdMonths} months)`

  const exceptionInput: CreateExceptionInput = {
    ruleId: rule.id,
    organizationId: rule.organizationId,
    severity,
    entityType: 'Person',
    entityId: personId,
    message,
    metadata: {
      personId,
      personName,
      thresholdMonths,
      monthsSince: monthsSince === Infinity ? null : monthsSince,
    },
  }

  const exception = await createException(exceptionInput)

  // Create notification for the person's manager
  const personWithManager = await prisma.person.findUnique({
    where: { id: personId },
    include: {
      manager: {
        include: { user: true },
      },
    },
  })

  if (personWithManager?.manager?.user?.id) {
    const notification = await createSystemNotification({
      title: 'Warning: Missing 360 Feedback',
      message,
      type: 'warning',
      organizationId: rule.organizationId,
      userId: personWithManager.manager.user.id,
      metadata: {
        exceptionId: exception.id,
        entityType: 'Person',
        entityId: personId,
        navigationPath: `/people/${personId}`,
      },
    })

    await linkExceptionToNotification(exception.id, notification.id)
  }
}

/**
 * Evaluate manager span rule
 * Checks if managers have more direct reports than the threshold
 */
async function evaluateManagerSpan(
  rule: ToleranceRule,
  config: ManagerSpanConfig
): Promise<number> {
  let exceptionsCreated = 0

  // Get all managers with direct reports
  const managers = await prisma.person.findMany({
    where: {
      organizationId: rule.organizationId,
      status: 'active',
      reports: {
        some: {
          status: 'active',
        },
      },
    },
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

  for (const manager of managers) {
    const directReportCount = manager._count.reports

    if (directReportCount > config.maxDirectReports) {
      // Check if we need to create an exception
      const existingException = await prisma.exception.findFirst({
        where: {
          ruleId: rule.id,
          organizationId: rule.organizationId,
          entityType: 'Person',
          entityId: manager.id,
          status: 'active',
        },
      })

      if (existingException) {
        continue
      }

      await createExceptionForManagerSpan(
        rule,
        manager.id,
        'warning',
        config.maxDirectReports,
        directReportCount
      )
      exceptionsCreated++
    }
  }

  return exceptionsCreated
}

/**
 * Create exception for manager span issue
 */
async function createExceptionForManagerSpan(
  rule: ToleranceRule,
  managerId: string,
  severity: 'warning' | 'urgent',
  maxDirectReports: number,
  currentCount: number
): Promise<void> {
  const manager = await prisma.person.findUnique({
    where: { id: managerId },
  })

  const managerName = manager?.name || 'Unknown'

  const message = `${managerName} has ${currentCount} direct reports (threshold: ${maxDirectReports})`

  const exceptionInput: CreateExceptionInput = {
    ruleId: rule.id,
    organizationId: rule.organizationId,
    severity,
    entityType: 'Person',
    entityId: managerId,
    message,
    metadata: {
      managerId,
      managerName,
      maxDirectReports,
      currentCount,
    },
  }

  const exception = await createException(exceptionInput)

  // Create notification for the manager
  const managerWithUser = await prisma.person.findUnique({
    where: { id: managerId },
    include: { user: true },
  })

  if (managerWithUser?.user?.id) {
    const notification = await createSystemNotification({
      title: 'Warning: Manager Span of Control',
      message,
      type: 'warning',
      organizationId: rule.organizationId,
      userId: managerWithUser.user.id,
      metadata: {
        exceptionId: exception.id,
        entityType: 'Person',
        entityId: managerId,
        navigationPath: `/people/${managerId}`,
      },
    })

    await linkExceptionToNotification(exception.id, notification.id)
  }
}
