'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'
import { z } from 'zod'
import { evaluateAllRules } from '@/lib/tolerance-rules/evaluator'
import { getRuleConfigSchema } from '@/lib/tolerance-rules/registry'
import type {
  ToleranceRule,
  ToleranceRuleType,
  ToleranceRuleConfig,
  CreateToleranceRuleInput,
  UpdateToleranceRuleInput,
} from '@/types/tolerance-rule'

// Validation schemas
const toleranceRuleTypeSchema = z.enum([
  'one_on_one_frequency',
  'initiative_checkin',
  'feedback_360',
  'manager_span',
  'max_reports',
])

// Create a union schema for all config types
const toleranceRuleConfigSchema = z.union([
  getRuleConfigSchema('one_on_one_frequency'),
  getRuleConfigSchema('initiative_checkin'),
  getRuleConfigSchema('feedback_360'),
  getRuleConfigSchema('manager_span'),
  getRuleConfigSchema('max_reports'),
])

const createToleranceRuleSchema = z.object({
  ruleType: toleranceRuleTypeSchema,
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  isEnabled: z.boolean().optional(),
  config: toleranceRuleConfigSchema,
})

const updateToleranceRuleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  isEnabled: z.boolean().optional(),
  config: toleranceRuleConfigSchema.optional(),
})

/**
 * Create a new tolerance rule
 * Only admins can create rules
 */
export async function createToleranceRule(
  input: CreateToleranceRuleInput
): Promise<ToleranceRule> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to create tolerance rules'
    )
  }

  if (!isAdminOrOwner(user)) {
    throw new Error('Only administrators can create tolerance rules')
  }

  const validatedData = createToleranceRuleSchema.parse(input)

  // Validate config matches rule type
  validateConfigForRuleType(
    validatedData.ruleType,
    validatedData.config as unknown as ToleranceRuleConfig
  )

  const rule = await prisma.organizationToleranceRule.create({
    data: {
      organizationId: user.managerOSOrganizationId,
      ruleType: validatedData.ruleType,
      name: validatedData.name,
      description: validatedData.description || null,
      isEnabled: validatedData.isEnabled ?? true,
      config: validatedData.config as object,
    },
  })

  revalidatePath('/settings/tolerance-rules')
  return {
    ...rule,
    ruleType: rule.ruleType as ToleranceRuleType,
    config: rule.config as unknown as ToleranceRuleConfig,
  } as ToleranceRule
}

/**
 * Update an existing tolerance rule
 * Only admins can update rules
 */
export async function updateToleranceRule(
  id: string,
  input: UpdateToleranceRuleInput
): Promise<ToleranceRule> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to update tolerance rules'
    )
  }

  if (!isAdminOrOwner(user)) {
    throw new Error('Only administrators can update tolerance rules')
  }

  // Verify rule exists and belongs to user's organization
  const existingRule = await prisma.organizationToleranceRule.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!existingRule) {
    throw new Error('Tolerance rule not found or access denied')
  }

  const validatedData = updateToleranceRuleSchema.parse(input)

  // If config is being updated, validate it matches rule type
  if (validatedData.config) {
    if (!existingRule) {
      throw new Error('Rule not found')
    }
    validateConfigForRuleType(
      existingRule.ruleType as ToleranceRuleType,
      validatedData.config as unknown as ToleranceRuleConfig
    )
  }

  const updateData: {
    name?: string
    description?: string | null
    isEnabled?: boolean
    config?: object
  } = {}

  if (validatedData.name !== undefined) {
    updateData.name = validatedData.name
  }
  if (validatedData.description !== undefined) {
    updateData.description = validatedData.description
  }
  if (validatedData.isEnabled !== undefined) {
    updateData.isEnabled = validatedData.isEnabled
  }
  if (validatedData.config) {
    updateData.config = validatedData.config as object
  }

  const rule = await prisma.organizationToleranceRule.update({
    where: { id },
    data: updateData,
  })

  revalidatePath('/settings/tolerance-rules')
  revalidatePath(`/settings/tolerance-rules/${id}`)
  return {
    ...rule,
    ruleType: rule.ruleType as ToleranceRuleType,
    config: rule.config as unknown as ToleranceRuleConfig,
  } as ToleranceRule
}

/**
 * Delete a tolerance rule
 * Only admins can delete rules
 */
export async function deleteToleranceRule(id: string): Promise<void> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to delete tolerance rules'
    )
  }

  if (!isAdminOrOwner(user)) {
    throw new Error('Only administrators can delete tolerance rules')
  }

  // Verify rule exists and belongs to user's organization
  const existingRule = await prisma.organizationToleranceRule.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!existingRule) {
    throw new Error('Tolerance rule not found or access denied')
  }

  await prisma.organizationToleranceRule.delete({
    where: { id },
  })

  revalidatePath('/settings/tolerance-rules')
}

/**
 * Get all tolerance rules for the current user's organization
 */
export async function getToleranceRules(): Promise<ToleranceRule[]> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to view tolerance rules'
    )
  }

  const rules = await prisma.organizationToleranceRule.findMany({
    where: {
      organizationId: user.managerOSOrganizationId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return rules.map(rule => ({
    ...rule,
    ruleType: rule.ruleType as ToleranceRuleType,
    config: rule.config as unknown as ToleranceRuleConfig,
  })) as ToleranceRule[]
}

/**
 * Get a single tolerance rule by ID
 */
export async function getToleranceRuleById(
  id: string
): Promise<ToleranceRule | null> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to view tolerance rules'
    )
  }

  const rule = await prisma.organizationToleranceRule.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!rule) {
    return null
  }

  return {
    ...rule,
    ruleType: rule.ruleType as ToleranceRuleType,
    config: rule.config as unknown as ToleranceRuleConfig,
  } as ToleranceRule
}

/**
 * Toggle a tolerance rule's enabled status
 * Only admins can toggle rules
 */
export async function toggleToleranceRule(
  id: string,
  isEnabled: boolean
): Promise<ToleranceRule> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to toggle tolerance rules'
    )
  }

  if (!isAdminOrOwner(user)) {
    throw new Error('Only administrators can toggle tolerance rules')
  }

  // Verify rule exists and belongs to user's organization
  const existingRule = await prisma.organizationToleranceRule.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!existingRule) {
    throw new Error('Tolerance rule not found or access denied')
  }

  const rule = await prisma.organizationToleranceRule.update({
    where: { id },
    data: { isEnabled },
  })

  revalidatePath('/settings/tolerance-rules')
  return {
    ...rule,
    ruleType: rule.ruleType as ToleranceRuleType,
    config: rule.config as unknown as ToleranceRuleConfig,
  } as ToleranceRule
}

/**
 * Manually trigger tolerance check evaluation for all enabled rules
 * Only admins can trigger manual checks
 */
export async function runToleranceCheck(): Promise<{
  exceptionsCreated: number
  errors: string[]
}> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to run tolerance checks'
    )
  }

  if (!isAdminOrOwner(user)) {
    throw new Error('Only administrators can run tolerance checks')
  }

  const result = await evaluateAllRules(user.managerOSOrganizationId)

  // Revalidate relevant paths to show new exceptions
  revalidatePath('/exceptions')
  revalidatePath('/organization/settings/tolerance-rules')

  return result
}

/**
 * Validate that config matches the rule type
 */
function validateConfigForRuleType(
  ruleType: ToleranceRuleType,
  config: ToleranceRuleConfig
): void {
  const schema = getRuleConfigSchema(ruleType)
  schema.parse(config)
}
