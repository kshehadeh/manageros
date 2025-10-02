import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FeedbackCampaignForm } from '@/components/feedback/feedback-campaign-form'
import { EditFeedbackCampaignBreadcrumbClient } from '@/components/feedback/edit-feedback-campaign-breadcrumb-client'

interface EditFeedbackCampaignPageProps {
  params: Promise<{
    id: string
    campaignId: string
  }>
}

export default async function EditFeedbackCampaignPage({
  params,
}: EditFeedbackCampaignPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const { id, campaignId } = await params

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  // Get the person
  const person = await prisma.person.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
  })

  if (!person) {
    notFound()
  }

  // Get the current user's person record
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: session.user.id,
      },
    },
  })

  if (!currentPerson) {
    redirect('/people')
  }

  // Check if the current user is a manager (direct or indirect) of the target person
  const isManager = await checkIfManager(currentPerson.id, person.id)

  if (!isManager) {
    redirect('/people')
  }

  // Get the feedback campaign
  const campaign = await prisma.feedbackCampaign.findFirst({
    where: {
      id: campaignId,
      targetPersonId: id,
      userId: session.user.id, // Only allow editing campaigns created by the current user
    },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  })

  if (!campaign) {
    notFound()
  }

  // Only allow editing draft campaigns
  if (campaign.status !== 'draft') {
    redirect(`/people/${id}/feedback-campaigns`)
  }

  // Format the campaign data for the form
  const campaignData = {
    id: campaign.id,
    name: campaign.name || '',
    targetPersonId: campaign.targetPersonId,
    templateId: campaign.templateId || '',
    startDate: campaign.startDate.toISOString().split('T')[0],
    endDate: campaign.endDate.toISOString().split('T')[0],
    inviteEmails: campaign.inviteEmails,
  }

  return (
    <EditFeedbackCampaignBreadcrumbClient
      personName={person.name}
      personId={person.id}
      campaignId={campaign.id}
    >
      <div className='space-y-6'>
        <div>
          <h1 className='text-2xl font-bold'>Edit Feedback Campaign</h1>
          <p className='text-neutral-400'>
            Update campaign details for {person.name}
          </p>
        </div>

        <FeedbackCampaignForm
          person={person}
          campaign={campaignData}
          redirectTo={`/people/${person.id}/feedback-campaigns`}
        />
      </div>
    </EditFeedbackCampaignBreadcrumbClient>
  )
}

// Helper function to check if a person is a direct or indirect manager of another person
async function checkIfManager(
  managerId: string,
  reportId: string
): Promise<boolean> {
  // First check if it's a direct manager relationship
  const directReport = await prisma.person.findFirst({
    where: {
      id: reportId,
      managerId: managerId,
    },
  })

  if (directReport) {
    return true
  }

  // If not direct, check if it's an indirect relationship by traversing up the hierarchy
  let currentPerson = await prisma.person.findUnique({
    where: { id: reportId },
    select: { managerId: true },
  })

  while (currentPerson?.managerId) {
    if (currentPerson.managerId === managerId) {
      return true
    }

    currentPerson = await prisma.person.findUnique({
      where: { id: currentPerson.managerId },
      select: { managerId: true },
    })
  }

  return false
}
