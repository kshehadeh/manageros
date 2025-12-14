import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth-utils'

interface Props {
  params: Promise<{ id: string }>
}

export default async function OnboardingTemplateDetailPage({ params }: Props) {
  await requireAdmin()
  const { id } = await params

  // Redirect to edit page for now
  // In the future, this could be a read-only detail view
  redirect(`/organization/onboarding-templates/${id}/edit`)
}
