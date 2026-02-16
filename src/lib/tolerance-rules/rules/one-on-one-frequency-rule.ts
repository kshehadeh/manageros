/**
 * One-on-One Frequency Tolerance Rule
 * Checks if managers have had 1:1s with their direct reports within thresholds
 */

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getExistingExceptions } from '../base-rule'
import type { ToleranceRule } from '@/types/tolerance-rule'
import type { ToleranceRuleModule } from '../base-rule'
import type { Prisma } from '@/generated/prisma'

type InputJsonValue = Prisma.InputJsonValue

/**
 * Configuration for one-on-one frequency rule
 */
export interface OneOnOneFrequencyConfig {
  warningThresholdDays: number
  urgentThresholdDays: number
  onlyFullTimeEmployees?: boolean
}

/**
 * Zod schema for one-on-one frequency config
 */
const oneOnOneFrequencyConfigSchema = z.object({
  warningThresholdDays: z.number().int().positive(),
  urgentThresholdDays: z.number().int().positive(),
  onlyFullTimeEmployees: z.boolean().optional(),
})

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
 * Evaluate one-on-one frequency rule
 */
async function evaluateOneOnOneFrequency(rule: ToleranceRule): Promise<number> {
  const config = rule.config as OneOnOneFrequencyConfig
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
  // Query only for the specific pairs we care about to avoid fetching irrelevant records
  const QUERY_BATCH_SIZE = 100 // Limit OR conditions to avoid query size issues
  const allOneOnOnes: Array<{
    managerId: string
    reportId: string
    scheduledAt: Date | null
  }> = []

  // Query in batches to avoid creating overly large OR conditions
  for (let i = 0; i < managerReportPairs.length; i += QUERY_BATCH_SIZE) {
    const batch = managerReportPairs.slice(i, i + QUERY_BATCH_SIZE)

    // Build OR conditions for this batch - check both directions for each pair
    const orConditions = batch.flatMap(pair => [
      // Forward direction: manager->report
      {
        managerId: pair.managerId,
        reportId: pair.reportId,
      },
      // Reverse direction: report->manager (in case stored backwards)
      {
        managerId: pair.reportId,
        reportId: pair.managerId,
      },
    ])

    const batchOneOnOnes = await prisma.oneOnOne.findMany({
      where: {
        OR: orConditions,
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

    allOneOnOnes.push(...batchOneOnOnes)
  }

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
 * One-on-One Frequency Rule Module
 */
export const oneOnOneFrequencyRule: ToleranceRuleModule<OneOnOneFrequencyConfig> =
  {
    ruleType: 'one_on_one_frequency',
    configSchema: oneOnOneFrequencyConfigSchema,
    evaluate: evaluateOneOnOneFrequency,
  }
