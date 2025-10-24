'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function EditFormNavigator() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    function handleOpenEditForm() {
      // Don't handle the shortcut if we're on a creation page (/new) or already on an edit page (/edit)
      if (pathname.endsWith('/new') || pathname.endsWith('/edit')) {
        return
      }

      // Determine the edit URL based on the current pathname
      let editUrl: string | null = null

      // People detail page: /people/[id] -> /people/[id]/edit
      if (pathname.match(/^\/people\/[^/]+$/)) {
        editUrl = `${pathname}/edit`
      }
      // Initiative detail page: /initiatives/[id] -> /initiatives/[id]/edit
      else if (pathname.match(/^\/initiatives\/[^/]+$/)) {
        editUrl = `${pathname}/edit`
      }
      // Meeting detail page: /meetings/[id] -> /meetings/[id]/edit
      else if (pathname.match(/^\/meetings\/[^/]+$/)) {
        editUrl = `${pathname}/edit`
      }
      // Task detail page: /tasks/[id] -> /tasks/[id]/edit
      else if (pathname.match(/^\/tasks\/[^/]+$/)) {
        editUrl = `${pathname}/edit`
      }
      // One-on-one detail page: /oneonones/[id] -> /oneonones/[id]/edit
      else if (pathname.match(/^\/oneonones\/[^/]+$/)) {
        editUrl = `${pathname}/edit`
      }
      // Feedback detail page: /feedback/[id] -> /feedback/[id]/edit
      else if (pathname.match(/^\/feedback\/[^/]+$/)) {
        editUrl = `${pathname}/edit`
      }
      // Team detail page: /teams/[id] -> /teams/[id]/edit
      else if (pathname.match(/^\/teams\/[^/]+$/)) {
        editUrl = `${pathname}/edit`
      }
      // Meeting instance detail page: /meetings/[id]/instances/[instanceId] -> /meetings/[id]/instances/[instanceId]/edit
      else if (pathname.match(/^\/meetings\/[^/]+\/instances\/[^/]+$/)) {
        editUrl = `${pathname}/edit`
      }
      // Person feedback detail page: /people/[id]/feedback/[feedbackId] -> /people/[id]/feedback/[feedbackId]/edit
      else if (pathname.match(/^\/people\/[^/]+\/feedback\/[^/]+$/)) {
        editUrl = `${pathname}/edit`
      }
      // Feedback campaign detail page: /people/[id]/feedback-campaigns/[campaignId] -> /people/[id]/feedback-campaigns/[campaignId]/edit
      else if (pathname.match(/^\/people\/[^/]+\/feedback-campaigns\/[^/]+$/)) {
        editUrl = `${pathname}/edit`
      }

      // Navigate to the edit page if we found a valid edit URL
      if (editUrl) {
        router.push(editUrl)
      }
    }

    window.addEventListener('command:openEditForm', handleOpenEditForm)
    return () =>
      window.removeEventListener('command:openEditForm', handleOpenEditForm)
  }, [router, pathname])

  // This component doesn't render anything
  return null
}
