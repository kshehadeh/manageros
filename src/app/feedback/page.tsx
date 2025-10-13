import { requireAuth } from '@/lib/auth-utils'
import { FeedbackPageClient } from '@/components/feedback/feedback-page-client'

export default async function FeedbackPage() {
  await requireAuth({ requireOrganization: true })

  return <FeedbackPageClient />
}
