import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FeedbackCampaignList } from '@/components/feedback/feedback-campaign-list'
import { FeedbackCampaignsBreadcrumbClient } from '@/components/feedback/feedback-campaigns-breadcrumb-client'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { checkIfManagerOrSelf } from '@/lib/utils/people-utils'
import { HelpIcon } from '@/components/help-icon'
import { getPersonById, getPersonByUserId } from '@/lib/data/people'
import { getFeedbackCampaignsForPerson } from '@/lib/data/feedback-campaigns'

interface FeedbackCampaignsPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function FeedbackCampaignsPage({
  params,
}: FeedbackCampaignsPageProps) {
  const session = await getServerSession(authOptions)

  const { id } = await params

  if (!session?.user.organizationId) {
    redirect('/organization/create')
  }

  // Get the person
  const person = await getPersonById(id, session.user.organizationId)

  if (!person || !('id' in person) || typeof person.id !== 'string') {
    notFound()
  }

  // Get the current user's person record
  const currentPerson = await getPersonByUserId(session.user.id)

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
    session.user.id,
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
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div className='flex flex-col gap-1'>
            <div className='flex items-center gap-2'>
              <h1 className='text-2xl font-bold'>Feedback Campaigns</h1>
              <HelpIcon helpId='feedback-campaigns' size='md' />
            </div>
            <p className='text-gray-600'>
              Manage feedback campaigns for {person.name}
            </p>
          </div>
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
        <div>
          <FeedbackCampaignList campaigns={typedCampaigns} />
        </div>
      </div>
    </FeedbackCampaignsBreadcrumbClient>
  )
}
