'use client'

import { usePageBreadcrumbs } from '@/lib/hooks/use-breadcrumb'

interface NoteDetailBreadcrumbClientProps {
  noteTitle: string
  noteId: string
  children: React.ReactNode
}

export function NoteDetailBreadcrumbClient({
  noteTitle,
  noteId,
  children,
}: NoteDetailBreadcrumbClientProps) {
  usePageBreadcrumbs([
    { name: 'Notes', href: '/notes' },
    { name: noteTitle, href: `/notes/${noteId}` },
  ])

  return <>{children}</>
}
