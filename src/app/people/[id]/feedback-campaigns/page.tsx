import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FeedbackCampaignList } from '@/components/feedback/feedback-campaign-list'
import { FeedbackCampaignsBreadcrumbClient } from '@/components/feedback/feedback-campaigns-breadcrumb-client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { checkIfManagerOrSelf } from '@/lib/utils/people-utils'

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
          <div className='flex items-center gap-4'>
            <div>
              <h1 className='text-2xl font-bold'>Feedback Campaigns</h1>
              <p className='text-gray-600'>
                Manage feedback campaigns for {person.name}
              </p>
            </div>
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

        <div className='grid gap-6 lg:grid-cols-3'>
          <div className='lg:col-span-2'>
            <FeedbackCampaignList campaigns={typedCampaigns} />
          </div>

          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>About Feedback Campaigns</CardTitle>
                <CardDescription>
                  Learn how feedback campaigns work
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <h4 className='font-medium mb-2'>
                    What are feedback campaigns?
                  </h4>
                  <p className='text-sm text-gray-600'>
                    Feedback campaigns allow you to collect structured feedback
                    from external stakeholders about a person in your
                    organization. This is useful for performance reviews,
                    360-degree feedback, or gathering input from customers and
                    partners.
                  </p>
                </div>

                <div>
                  <h4 className='font-medium mb-2'>How it works</h4>
                  <ol className='text-sm text-gray-600 space-y-1'>
                    <li>1. Create a campaign with start/end dates</li>
                    <li>2. Add email addresses of people to invite</li>
                    <li>3. Activate the campaign to send invitations</li>
                    <li>4. Invitees receive email links to provide feedback</li>
                    <li>5. Review responses and complete the campaign</li>
                  </ol>
                </div>

                <div>
                  <h4 className='font-medium mb-2'>
                    Who can create campaigns?
                  </h4>
                  <p className='text-sm text-gray-600'>
                    Only managers (direct or indirect) of the target person can
                    create feedback campaigns for them.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </FeedbackCampaignsBreadcrumbClient>
  )
}
