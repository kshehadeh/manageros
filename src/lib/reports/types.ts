'use server'

import type { z } from 'zod'
import type { PrismaClient } from '@prisma/client'

export type ReportRendererId = 'markdown'

export interface ReportExecutionContext {
  prisma: PrismaClient
  user: {
    id: string
    role: string
    organizationId: string
    personId: string | null
  }
}

export interface ReportDefinition<InputSchema extends z.ZodTypeAny, OutputJson> {
  codeId: string
  name: string
  description?: string
  supportedRenderers: ReportRendererId[]
  inputSchema: InputSchema
  authorize: (
    ctx: ReportExecutionContext,
    parsedInput: z.infer<InputSchema>
  ) => Promise<void>
  execute: (
    ctx: ReportExecutionContext,
    parsedInput: z.infer<InputSchema>
  ) => Promise<OutputJson>
  renderers: Partial<Record<ReportRendererId, (output: OutputJson) => string>>
}

export interface ReportSummaryMeta {
  codeId: string
  name: string
  description?: string
  supportedRenderers: ReportRendererId[]
}

