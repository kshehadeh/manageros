'use server'

import type { ReportDefinition, ReportSummaryMeta } from './types'

const registry = new Map<string, ReportDefinition<any, any>>()

export function registerReport(def: ReportDefinition<any, any>) {
  registry.set(def.codeId, def)
}

export function getReport(codeId: string) {
  return registry.get(codeId)
}

export function listReports(): ReportSummaryMeta[] {
  return Array.from(registry.values()).map(def => ({
    codeId: def.codeId,
    name: def.name,
    description: def.description,
    supportedRenderers: def.supportedRenderers,
  }))
}

