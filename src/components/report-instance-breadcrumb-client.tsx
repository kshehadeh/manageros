'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface ReportInstanceBreadcrumbClientProps {
  reportName: string
  instanceId: string
  children: React.ReactNode
}

export function ReportInstanceBreadcrumbClient({
  reportName,
  instanceId,
  children,
}: ReportInstanceBreadcrumbClientProps) {
  usePageBreadcrumbs([
    { name: 'Reports', href: '/reports' },
    { name: reportName, href: `/reports/instances/${instanceId}` },
  ])

  return <>{children}</>
}
