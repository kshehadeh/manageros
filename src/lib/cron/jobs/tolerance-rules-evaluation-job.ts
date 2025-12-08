/**
 * Tolerance rules evaluation job - evaluates all enabled tolerance rules
 * and creates exceptions when thresholds are exceeded
 */

import { CronJob, CronJobResult, CronJobExecutionContext } from '../types'
import { evaluateAllRules } from '@/lib/tolerance-rules/evaluator'
import type { Prisma } from '@/generated/prisma'

type InputJsonValue = Prisma.InputJsonValue

export class ToleranceRulesEvaluationJob extends CronJob {
  readonly id = 'tolerance-rules-evaluation'
  readonly name = 'Tolerance Rules Evaluation'
  readonly description =
    'Evaluates all enabled tolerance rules and creates exceptions when thresholds are exceeded'
  readonly schedule = '0 8 * * *' // Daily at 8 AM

  async execute(context: CronJobExecutionContext): Promise<CronJobResult> {
    const { organizationId } = context
    let exceptionsCreated = 0
    const metadata: Record<string, InputJsonValue> = {}

    try {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      // Evaluate all enabled rules for the organization
      const result = await evaluateAllRules(organizationId)

      exceptionsCreated = result.exceptionsCreated
      metadata.exceptionsCreated = result.exceptionsCreated
      metadata.errors = result.errors
      metadata.errorCount = result.errors.length

      return {
        success: result.errors.length === 0,
        notificationsCreated: exceptionsCreated, // Exceptions create notifications
        metadata,
        error:
          result.errors.length > 0
            ? `Some rules failed: ${result.errors.join('; ')}`
            : undefined,
      }
    } catch (error) {
      return {
        success: false,
        notificationsCreated: exceptionsCreated,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata,
      }
    }
  }

  validateConfig(_config: Record<string, unknown>): boolean {
    // This job doesn't require any specific configuration
    return true
  }

  getDefaultConfig(): Record<string, unknown> {
    return {}
  }
}
