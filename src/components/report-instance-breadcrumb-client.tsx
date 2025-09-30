'use client'

import { useEffect } from 'react'
import { useBreadcrumb } from './breadcrumb-provider'

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
  const { setBreadcrumbs } = useBreadcrumb()

  useEffect(() => {
    setBreadcrumbs([
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Reports', href: '/reports' },
      { name: reportName, href: `/reports/instances/${instanceId}` },
    ])
  }, [setBreadcrumbs, reportName, instanceId])

  return <>{children}</>
}
