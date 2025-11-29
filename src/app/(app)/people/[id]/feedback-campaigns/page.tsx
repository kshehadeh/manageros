import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-utils'
import { FeedbackCampaignList } from '@/components/feedback/feedback-campaign-list'
import { FeedbackCampaignsBreadcrumbClient } from '@/components/feedback/feedback-campaigns-breadcrumb-client'
import { Button } from '@/components/ui/button'
import { Plus, MessageSquare, ArrowLeft } from 'lucide-react'
import { Link } from '@/components/ui/link'
import { checkIfManagerOrSelf } from '@/lib/utils/people-utils'
import { getPersonById, getPersonByUserId } from '@/lib/data/people'
import { getFeedbackCampaignsForPerson } from '@/lib/data/feedback-campaigns'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageSection } from '@/components/ui/page-section'

interface FeedbackCampaignsPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function FeedbackCampaignsPage({
  params,
}: FeedbackCampaignsPageProps) {
  const user = await getCurrentUser()

  const { id } = await params

  if (!user.managerOSOrganizationId) {
    redirect('/dashboard')
  }

  // Get the person
  const person = await getPersonById(id, user.managerOSOrganizationId)

  if (!person || !('id' in person) || typeof person.id !== 'string') {
    notFound()
  }

  // Get the current user's person record
  const currentPerson = await getPersonByUserId(user.managerOSUserId || '')

  if (
    !currentPerson ||
    !('id' in currentPerson) ||
    typeof currentPerson.id !== 'string'
  ) {
    redirect('/people')
  }

  // Check if the current user is a manager (direct or indirect) of the target person
  const isManager = await checkIfManagerOrSelf(currentPerson.id, person.id)

  if (!isManager) {
    redirect('/people')
  }

  // Get feedback campaigns for this person created by the current user
  const campaigns = await getFeedbackCampaignsForPerson(
    person.id,
    user.managerOSUserId || '',
    {
      includeTargetPerson: true,
      includeUser: true,
      includeTemplate: true,
      includeResponses: true,
    }
  )

  // Type the campaigns with proper status typing
  const typedCampaigns = campaigns.map(campaign => {
    const campaignWithTemplate = campaign as typeof campaign & {
      template?: { id: string; name: string; description: string | null } | null
      user?: { id: string; name: string; email: string } | null
      targetPerson?: { id: string; name: string; email: string | null } | null
      responses?: Array<{
        id: string
        responderEmail: string
        submittedAt: Date
      }>
    }

    return {
      ...campaignWithTemplate,
      status: campaign.status as 'draft' | 'active' | 'completed' | 'cancelled',
      inviteLink: campaign.inviteLink || undefined,
      template: campaignWithTemplate.template
        ? {
            id: campaignWithTemplate.template.id,
            name: campaignWithTemplate.template.name,
            description: campaignWithTemplate.template.description || undefined,
          }
        : undefined,
      user: campaignWithTemplate.user!,
      targetPerson: campaignWithTemplate.targetPerson!,
      responses: campaignWithTemplate.responses || [],
    }
  })

  return (
    <FeedbackCampaignsBreadcrumbClient
      personName={person.name}
      personId={person.id}
    >
      <PageContainer>
        <PageHeader
          title='Feedback 360'
          titleIcon={MessageSquare}
          helpId='feedback-campaigns'
          subtitle={`Manage Feedback 360 for ${person.name}`}
          actions={
            <div className='flex items-center gap-2'>
              <Button asChild variant='outline'>
                <Link
                  href={`/people/${person.id}`}
                  className='flex items-center gap-2'
                >
                  <ArrowLeft className='h-4 w-4' />
                  Back to Profile
                </Link>
              </Button>
              <Button asChild>
                <Link
                  href={`/people/${person.id}/feedback-campaigns/new`}
                  className='flex items-center gap-2'
                >
                  <Plus className='h-4 w-4' />
                  Create Campaign
                </Link>
              </Button>
            </div>
          }
        />

        <PageContent>
          <PageSection>
            <FeedbackCampaignList campaigns={typedCampaigns} />
          </PageSection>
        </PageContent>
      </PageContainer>
    </FeedbackCampaignsBreadcrumbClient>
  )
}
