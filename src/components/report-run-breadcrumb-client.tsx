'use client'

import { useEffect } from 'react'
import { useBreadcrumb } from './breadcrumb-provider'

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
  const { setBreadcrumbs } = useBreadcrumb()

  useEffect(() => {
    setBreadcrumbs([
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Reports', href: '/reports' },
      { name: `Run ${reportName}`, href: `/reports/${codeId}/run` },
    ])
  }, [setBreadcrumbs, reportName, codeId])

  return <>{children}</>
}
