'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface ReportRunBreadcrumbClientProps {
  reportName: string
  codeId: string
  children: React.ReactNode
}

export function ReportRunBreadcrumbClient({
  reportName,
  codeId,
  children,
}: ReportRunBreadcrumbClientProps) {
  usePageBreadcrumbs([
    { name: 'Reports', href: '/reports' },
    { name: `Run ${reportName}`, href: `/reports/${codeId}/run` },
  ])

  return <>{children}</>
}
