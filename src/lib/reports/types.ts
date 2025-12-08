'use server'

import type { z } from 'zod'
import type { PrismaClient } from '@/generated/prisma'

export type ReportRendererId = 'markdown' | 'web'

export interface ReportExecutionContext {
  prisma: PrismaClient
  user: {
    id: string
    role: string
    organizationId: string
    personId: string | null
  }
}

export interface ReportIdentifierField {
  fieldName: string
  displayName: string
  resolveToName: (
    _value: string,
    _ctx: ReportExecutionContext
  ) => Promise<string>
}

export interface ReportDefinition<
  InputSchema extends z.ZodTypeAny,
  OutputJson,
> {
  codeId: string
  name: string
  description?: string
  supportedRenderers: ReportRendererId[]
  inputSchema: InputSchema
  identifierFields?: ReportIdentifierField[]
  authorize: (
    _ctx: ReportExecutionContext,
    _parsedInput: z.infer<InputSchema>
  ) => Promise<void>
  execute: (
    _ctx: ReportExecutionContext,
    _parsedInput: z.infer<InputSchema>
  ) => Promise<OutputJson>
  renderers: Partial<
    Record<ReportRendererId, (_output: OutputJson) => string | Promise<string>>
  >
}

export interface ReportSummaryMeta {
  codeId: string
  name: string
  description?: string
  supportedRenderers: ReportRendererId[]
}
