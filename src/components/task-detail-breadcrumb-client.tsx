'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface TaskDetailBreadcrumbClientProps {
  taskTitle: string
  taskId: string
  children: React.ReactNode
}

export function TaskDetailBreadcrumbClient({
  taskTitle,
  taskId,
  children,
}: TaskDetailBreadcrumbClientProps) {
  usePageBreadcrumbs([
    { name: 'Tasks', href: '/tasks' },
    { name: taskTitle, href: `/tasks/${taskId}` },
  ])

  return <>{children}</>
}
