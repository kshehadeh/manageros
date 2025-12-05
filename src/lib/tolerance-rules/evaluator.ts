/**
 * Exception evaluation logic for tolerance rules
 */

import { prisma } from '@/lib/db'
import {
  createException,
  linkExceptionToNotification,
} from '@/lib/actions/exceptions'
import { createSystemNotification } from '@/lib/actions/notification'
import { InputJsonValue } from '@prisma/client/runtime/library'
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
 * Batch check existing exceptions for multiple entities
 * Returns a Set of entityIds that already have active exceptions
 */
async function getExistingExceptions(
  ruleId: string,
  organizationId: string,
  entityType: string,
  entityIds: string[]
): Promise<Set<string>> {
  if (entityIds.length === 0) {
    return new Set()
  }

  const existingExceptions = await prisma.exception.findMany({
    where: {
      ruleId,
      organizationId,
      entityType,
      entityId: {
        in: entityIds,
      },
      status: 'active',
    },
    select: {
      entityId: true,
    },
  })

  return new Set(existingExceptions.map(e => e.entityId))
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
  // If onlyFullTimeEmployees is enabled, filter reports to only full-time employees
  const managers = await prisma.person.findMany({
    where: {
      organizationId: rule.organizationId,
      status: 'active',
      reports: {
        some: {
          status: 'active',
          ...(config.onlyFullTimeEmployees
            ? { employeeType: 'FULL_TIME' }
            : {}),
        },
      },
    },
    select: {
      id: true,
      reports: {
        where: {
          status: 'active',
          ...(config.onlyFullTimeEmployees
            ? { employeeType: 'FULL_TIME' }
            : {}),
        },
        select: {
          id: true,
        },
      },
    },
  })

  // Build list of all manager-report pairs
  const managerReportPairs: Array<{ managerId: string; reportId: string }> = []
  for (const manager of managers) {
    for (const report of manager.reports) {
      managerReportPairs.push({
        managerId: manager.id,
        reportId: report.id,
      })
    }
  }

  if (managerReportPairs.length === 0) {
    return 0
  }

  // Batch fetch last 1:1 dates for all manager-report pairs
  // We need to check both directions (manager->report and report->manager)
  const managerIds = managerReportPairs.map(p => p.managerId)
  const reportIds = managerReportPairs.map(p => p.reportId)
  const allPersonIds = Array.from(new Set([...managerIds, ...reportIds]))

  const allOneOnOnes = await prisma.oneOnOne.findMany({
    where: {
      OR: [
        {
          managerId: { in: allPersonIds },
          reportId: { in: allPersonIds },
        },
      ],
    },
    select: {
      managerId: true,
      reportId: true,
      scheduledAt: true,
    },
    orderBy: {
      scheduledAt: 'desc',
    },
  })

  // Create a map of managerId-reportId -> lastScheduledAt
  // Only store the actual direction (managerId-reportId), not both directions
  const lastOneOnOneMap = new Map<string, Date>()
  for (const oneOnOne of allOneOnOnes) {
    // Skip if scheduledAt is null
    if (!oneOnOne.scheduledAt) {
      continue
    }

    // Only update the key that matches the actual direction of the record
    const key = `${oneOnOne.managerId}-${oneOnOne.reportId}`
    const existing = lastOneOnOneMap.get(key)

    if (!existing || oneOnOne.scheduledAt > existing) {
      lastOneOnOneMap.set(key, oneOnOne.scheduledAt)
    }
  }

  // Batch check existing exceptions
  const entityIds = managerReportPairs.map(p => `${p.managerId}-${p.reportId}`)
  const existingExceptions = await getExistingExceptions(
    rule.id,
    rule.organizationId,
    'OneOnOne',
    entityIds
  )

  const now = Date.now()

  // Process pairs in batches
  const BATCH_SIZE = 100
  for (let i = 0; i < managerReportPairs.length; i += BATCH_SIZE) {
    const batch = managerReportPairs.slice(i, i + BATCH_SIZE)

    for (const pair of batch) {
      const entityId = `${pair.managerId}-${pair.reportId}`

      // Skip if exception already exists
      if (existingExceptions.has(entityId)) {
        continue
      }

      // Check both directions since a one-on-one might be stored with reversed roles
      const key1 = `${pair.managerId}-${pair.reportId}`
      const key2 = `${pair.reportId}-${pair.managerId}`
      const date1 = lastOneOnOneMap.get(key1)
      const date2 = lastOneOnOneMap.get(key2)

      // Use the most recent date from either direction
      const lastOneOnOne =
        date1 && date2 ? (date1 > date2 ? date1 : date2) : date1 || date2

      if (!lastOneOnOne) {
        // No 1:1 ever recorded - create urgent exception if threshold is exceeded
        const daysSince = Infinity
        if (daysSince > config.urgentThresholdDays) {
          const created = await createExceptionForOneOnOneSafely(
            rule,
            pair.managerId,
            pair.reportId,
            'urgent',
            config.urgentThresholdDays,
            Infinity
          )
          if (created) {
            exceptionsCreated++
          }
        }
        continue
      }

      const daysSince = Math.floor(
        (now - lastOneOnOne.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Check if we need to create an exception
      // Use a transaction to atomically check and create to prevent race conditions
      if (daysSince > config.urgentThresholdDays) {
        const created = await createExceptionForOneOnOneSafely(
          rule,
          pair.managerId,
          pair.reportId,
          'urgent',
          config.urgentThresholdDays,
          daysSince
        )
        if (created) {
          exceptionsCreated++
        }
      } else if (daysSince > config.warningThresholdDays) {
        const created = await createExceptionForOneOnOneSafely(
          rule,
          pair.managerId,
          pair.reportId,
          'warning',
          config.warningThresholdDays,
          daysSince
        )
        if (created) {
          exceptionsCreated++
        }
      }
    }
  }

  return exceptionsCreated
}

/**
 * Safely create exception for one-on-one frequency issue with transaction-based duplicate prevention
 * Returns true if exception was created, false if it already existed
 */
async function createExceptionForOneOnOneSafely(
  rule: ToleranceRule,
  managerId: string,
  reportId: string,
  severity: 'warning' | 'urgent',
  thresholdDays: number,
  daysSince: number
): Promise<boolean> {
  const entityId = `${managerId}-${reportId}`

  try {
    // Use a transaction to atomically check and create
    const result = await prisma.$transaction(
      async tx => {
        // Check for existing active exception within the transaction
        const existingException = await tx.exception.findFirst({
          where: {
            ruleId: rule.id,
            organizationId: rule.organizationId,
            entityType: 'OneOnOne',
            entityId,
            status: 'active',
          },
        })

        // If exception already exists, skip creation
        if (existingException) {
          return false
        }

        // Get manager and report names for message
        const [manager, report] = await Promise.all([
          tx.person.findUnique({ where: { id: managerId } }),
          tx.person.findUnique({ where: { id: reportId } }),
        ])

        const managerName = manager?.name || 'Unknown'
        const reportName = report?.name || 'Unknown'

        const message =
          daysSince === Infinity
            ? `${managerName} has never had a one on one with ${reportName} (threshold: ${thresholdDays} days)`
            : `${managerName} has not had a 1:1 with ${reportName} in ${daysSince} days (threshold: ${thresholdDays} days)`

        // Create the exception within the transaction
        await tx.exception.create({
          data: {
            ruleId: rule.id,
            organizationId: rule.organizationId,
            severity,
            entityType: 'OneOnOne',
            entityId,
            message,
            metadata: {
              managerId,
              reportId,
              managerName,
              reportName,
              thresholdDays,
              daysSince: daysSince === Infinity ? null : daysSince,
            } as InputJsonValue,
            status: 'active',
          },
        })

        return true
      },
      {
        isolationLevel: 'Serializable', // Highest isolation level to prevent race conditions
      }
    )

    // If exception was created, create notification outside transaction
    if (result) {
      await createNotificationForOneOnOneException(
        rule,
        managerId,
        reportId,
        severity,
        entityId
      )
    }

    return result
  } catch (error) {
    // Handle unique constraint violations (P2002 is Prisma's unique constraint error code)
    // This can happen if a unique constraint is added to the database
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      // Duplicate exception detected - another process created it concurrently
      return false
    }
    // Re-throw other errors
    throw error
  }
}

/**
 * Create notification for one-on-one exception (extracted for reuse)
 */
async function createNotificationForOneOnOneException(
  rule: ToleranceRule,
  managerId: string,
  reportId: string,
  severity: 'warning' | 'urgent',
  entityId: string
): Promise<void> {
  // Get the exception that was just created
  const exception = await prisma.exception.findFirst({
    where: {
      ruleId: rule.id,
      organizationId: rule.organizationId,
      entityType: 'OneOnOne',
      entityId,
      status: 'active',
    },
  })

  if (!exception) {
    return
  }

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
      message: exception.message,
      type: severity === 'urgent' ? 'error' : 'warning',
      organizationId: rule.organizationId,
      userId: managerWithUser.user.id,
      metadata: {
        exceptionId: exception.id,
        entityType: 'OneOnOne',
        entityId,
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
    select: {
      id: true,
    },
  })

  if (initiatives.length === 0) {
    return 0
  }

  const initiativeIds = initiatives.map(i => i.id)

  // Batch fetch last check-in date for all initiatives
  const allCheckIns = await prisma.checkIn.findMany({
    where: {
      initiativeId: {
        in: initiativeIds,
      },
    },
    select: {
      initiativeId: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Create a map of initiativeId -> lastCheckInDate (most recent per initiative)
  const lastCheckInMap = new Map<string, Date>()
  for (const checkIn of allCheckIns) {
    if (!lastCheckInMap.has(checkIn.initiativeId)) {
      lastCheckInMap.set(checkIn.initiativeId, checkIn.createdAt)
    }
  }

  // Batch check existing exceptions
  const existingExceptions = await getExistingExceptions(
    rule.id,
    rule.organizationId,
    'Initiative',
    initiativeIds
  )

  const now = Date.now()

  // Process initiatives in batches
  const BATCH_SIZE = 100
  for (let i = 0; i < initiatives.length; i += BATCH_SIZE) {
    const batch = initiatives.slice(i, i + BATCH_SIZE)

    for (const initiative of batch) {
      // Skip if exception already exists
      if (existingExceptions.has(initiative.id)) {
        continue
      }

      const lastCheckIn = lastCheckInMap.get(initiative.id)

      if (!lastCheckIn) {
        // No check-in ever recorded - create exception if threshold is exceeded
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
        (now - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24)
      )

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
  }

  return exceptionsCreated
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
    select: {
      id: true,
    },
  })

  if (people.length === 0) {
    return 0
  }

  const personIds = people.map(p => p.id)

  // Batch fetch all feedback campaigns for these people
  // We'll group by personId in memory to get the most recent one per person
  const allCampaigns = await prisma.feedbackCampaign.findMany({
    where: {
      targetPersonId: {
        in: personIds,
      },
    },
    select: {
      targetPersonId: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Create a map of personId -> lastCampaignDate (most recent per person)
  const lastCampaignMap = new Map<string, Date>()
  for (const campaign of allCampaigns) {
    if (!lastCampaignMap.has(campaign.targetPersonId)) {
      lastCampaignMap.set(campaign.targetPersonId, campaign.createdAt)
    }
  }

  // Batch check existing exceptions
  const existingExceptions = await getExistingExceptions(
    rule.id,
    rule.organizationId,
    'Person',
    personIds
  )

  const now = Date.now()

  // Process people in batches to avoid memory issues
  const BATCH_SIZE = 100
  for (let i = 0; i < people.length; i += BATCH_SIZE) {
    const batch = people.slice(i, i + BATCH_SIZE)

    for (const person of batch) {
      // Skip if exception already exists
      if (existingExceptions.has(person.id)) {
        continue
      }

      const lastCampaign = lastCampaignMap.get(person.id)
      let monthsSince: number

      if (!lastCampaign) {
        // No feedback campaign ever recorded
        monthsSince = Infinity
      } else {
        monthsSince = Math.floor(
          (now - lastCampaign.getTime()) / (1000 * 60 * 60 * 24 * 30)
        )
      }

      if (monthsSince > config.warningThresholdMonths) {
        await createExceptionForFeedback360(
          rule,
          person.id,
          'warning',
          config.warningThresholdMonths,
          monthsSince === Infinity ? 0 : monthsSince
        )
        exceptionsCreated++
      }
    }
  }

  return exceptionsCreated
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

  if (managers.length === 0) {
    return 0
  }

  // Filter managers that exceed threshold
  const managersExceedingThreshold = managers.filter(
    m => m._count.reports > config.maxDirectReports
  )

  if (managersExceedingThreshold.length === 0) {
    return 0
  }

  // Batch check existing exceptions
  const managerIds = managersExceedingThreshold.map(m => m.id)
  const existingExceptions = await getExistingExceptions(
    rule.id,
    rule.organizationId,
    'Person',
    managerIds
  )

  // Process managers that need exceptions
  for (const manager of managersExceedingThreshold) {
    // Skip if exception already exists
    if (existingExceptions.has(manager.id)) {
      continue
    }

    await createExceptionForManagerSpan(
      rule,
      manager.id,
      'warning',
      config.maxDirectReports,
      manager._count.reports
    )
    exceptionsCreated++
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
