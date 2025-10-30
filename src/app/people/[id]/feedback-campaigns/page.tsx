import { prisma } from '@/lib/db'
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

interface FeedbackCampaignsPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function FeedbackCampaignsPage({
  params,
}: FeedbackCampaignsPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const { id } = await params

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  // Get the person
  const person = await prisma.person.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    select: {
      id: true,
      name: true,
      email: true,
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
  const isManager = await checkIfManagerOrSelf(currentPerson.id, person.id)

  if (!isManager) {
    redirect('/people')
  }

  // Get feedback campaigns for this person created by the current user
  const campaigns = await prisma.feedbackCampaign.findMany({
    where: {
      targetPersonId: person.id,
      userId: session.user.id,
    },
    include: {
      targetPerson: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      template: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      responses: {
        select: {
          id: true,
          responderEmail: true,
          submittedAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Type the campaigns with proper status typing
  const typedCampaigns = campaigns.map(campaign => ({
    ...campaign,
    status: campaign.status as 'draft' | 'active' | 'completed' | 'cancelled',
    inviteLink: campaign.inviteLink || undefined,
    template: campaign.template
      ? {
          id: campaign.template.id,
          name: campaign.template.name,
          description: campaign.template.description || undefined,
        }
      : undefined,
  }))

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
