'use server'

import type { z } from 'zod'
import type { ReportDefinition, ReportSummaryMeta } from './types'

// Use a more flexible type that can handle any report definition
type AnyReportDefinition = ReportDefinition<z.ZodTypeAny, unknown> & {
  renderers: Partial<
    Record<string, (_output: unknown) => string | Promise<string>>
  >
}

const registry = new Map<string, AnyReportDefinition>()

export async function registerReport<
  InputSchema extends z.ZodTypeAny,
  OutputJson,
>(def: ReportDefinition<InputSchema, OutputJson>) {
  registry.set(def.codeId, def as unknown as AnyReportDefinition)
}

export async function getReport(
  codeId: string
): Promise<AnyReportDefinition | undefined> {
  return registry.get(codeId)
}

export async function listReports(): Promise<ReportSummaryMeta[]> {
  return Array.from(registry.values()).map(def => ({
    codeId: def.codeId,
    name: def.name,
    description: def.description,
    supportedRenderers: def.supportedRenderers,
  }))
}
