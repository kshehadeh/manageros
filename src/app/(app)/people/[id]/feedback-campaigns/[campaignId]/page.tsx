import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { FeedbackCampaignDetailBreadcrumbClient } from '@/components/feedback/feedback-campaign-detail-breadcrumb-client'
import { FeedbackCampaignActionsDropdown } from '@/components/feedback/feedback-campaign-actions-dropdown'
import { FeedbackResponseLink } from '@/components/feedback/feedback-response-link'
import { FeedbackInviteeList } from '@/components/feedback/feedback-invitee-list'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Mail,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { checkIfManagerOrSelf } from '@/lib/utils/people-utils'

interface FeedbackCampaignDetailPageProps {
  params: Promise<{
    id: string
    campaignId: string
  }>
}

export default async function FeedbackCampaignDetailPage({
  params,
}: FeedbackCampaignDetailPageProps) {
  const session = await getServerSession(authOptions)

  const { id, campaignId } = await params

  if (!session?.user.organizationId) {
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

  // Get the feedback campaign
  const campaign = await prisma.feedbackCampaign.findFirst({
    where: {
      id: campaignId,
      targetPersonId: id,
      userId: session.user.id,
    },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
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
  })

  if (!campaign) {
    notFound()
  }

  // Create a meaningful campaign title
  const campaignTitle = campaign.name || `${person.name} Feedback Campaign`

  // Calculate response statistics
  const totalInvites = campaign.inviteEmails.length
  const totalResponses = campaign.responses.length
  const responseRate =
    totalInvites > 0 ? Math.round((totalResponses / totalInvites) * 100) : 0

  // Get status badge variant and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'draft':
        return { variant: 'secondary' as const, icon: Clock, label: 'Draft' }
      case 'active':
        return {
          variant: 'default' as const,
          icon: AlertCircle,
          label: 'Active',
        }
      case 'completed':
        return {
          variant: 'success' as const,
          icon: CheckCircle,
          label: 'Completed',
        }
      case 'cancelled':
        return { variant: 'error' as const, icon: XCircle, label: 'Cancelled' }
      default:
        return { variant: 'secondary' as const, icon: Clock, label: status }
    }
  }

  const statusInfo = getStatusInfo(campaign.status)
  const StatusIcon = statusInfo.icon

  return (
    <FeedbackCampaignDetailBreadcrumbClient
      personName={person.name}
      personId={person.id}
      campaignTitle={campaignTitle}
      campaignId={campaign.id}
    >
      <div className='page-container'>
        <div className='page-header'>
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-2'>
                <h1 className='page-title'>{campaignTitle}</h1>
                <Badge
                  variant={statusInfo.variant}
                  className='flex items-center gap-1'
                >
                  <StatusIcon className='h-3 w-3' />
                  {statusInfo.label}
                </Badge>
              </div>
              <div className='page-section-subtitle'>
                Feedback campaign for {person.name}
              </div>

              {/* Basic Information with Icons */}
              <div className='flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground'>
                <div className='flex items-center gap-1'>
                  <Calendar className='w-4 h-4' />
                  <span>
                    {format(campaign.startDate, 'MMM d, yyyy')} -{' '}
                    {format(campaign.endDate, 'MMM d, yyyy')}
                  </span>
                </div>
                <div className='flex items-center gap-1'>
                  <Mail className='w-4 h-4' />
                  <span>Created by {campaign.user.name}</span>
                </div>
                <div className='flex items-center gap-1'>
                  <Users className='w-4 h-4' />
                  <span>
                    {totalInvites} invited,{' '}
                    <Link
                      href={`/people/${person.id}/feedback-campaigns/${campaign.id}/responses`}
                      className='hover:underline text-foreground'
                    >
                      {totalResponses} responses
                    </Link>{' '}
                    ({responseRate}%)
                  </span>
                </div>
              </div>
            </div>
            <FeedbackCampaignActionsDropdown
              campaignId={campaign.id}
              campaign={campaign}
              personId={person.id}
              campaignName={campaignTitle}
              targetPersonName={person.name}
              totalResponses={totalResponses}
            />
          </div>
        </div>

        <div className='flex flex-col lg:flex-row gap-6'>
          {/* Main Content */}
          <div className='flex-1 space-y-6'>
            {/* Campaign Details */}
            <div className='page-section'>
              <h2 className='page-section-title'>Campaign Details</h2>
              <div className='card-grid'>
                <div className='space-y-4'>
                  {campaign.template && (
                    <div>
                      <span className='text-sm font-medium text-muted-foreground'>
                        Template:
                      </span>
                      <div className='mt-1'>
                        <span className='text-sm font-medium'>
                          {campaign.template.name}
                        </span>
                        {campaign.template.description && (
                          <p className='text-sm text-muted-foreground mt-1'>
                            {campaign.template.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className='text-sm font-medium text-muted-foreground'>
                      Campaign Period:
                    </span>
                    <div className='mt-1 flex items-center gap-2'>
                      <Calendar className='h-4 w-4' />
                      <span className='text-sm'>
                        {format(campaign.startDate, 'MMM d, yyyy')} -{' '}
                        {format(campaign.endDate, 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className='text-sm font-medium text-muted-foreground'>
                      Created By:
                    </span>
                    <div className='mt-1 flex items-center gap-2'>
                      <Mail className='h-4 w-4' />
                      <span className='text-sm'>{campaign.user.name}</span>
                    </div>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div>
                    <span className='text-sm font-medium text-muted-foreground'>
                      Created:
                    </span>
                    <div className='mt-1 text-sm'>
                      {format(campaign.createdAt, 'MMM d, yyyy')}
                    </div>
                  </div>

                  {campaign.updatedAt && (
                    <div>
                      <span className='text-sm font-medium text-muted-foreground'>
                        Last Updated:
                      </span>
                      <div className='mt-1 text-sm'>
                        {format(campaign.updatedAt, 'MMM d, yyyy')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Feedback Response Link */}
            {campaign.inviteLink && campaign.status === 'active' && (
              <div className='page-section'>
                <h2 className='page-section-title'>Feedback Response Link</h2>
                <FeedbackResponseLink
                  inviteLink={campaign.inviteLink}
                  startDate={campaign.startDate}
                  endDate={campaign.endDate}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className='w-full lg:w-80 space-y-6'>
            {/* Invited People */}
            <div className='page-section'>
              <h2 className='page-section-title'>
                Invited People ({campaign.inviteEmails.length})
              </h2>
              <FeedbackInviteeList
                inviteEmails={campaign.inviteEmails}
                responses={campaign.responses}
              />
            </div>
          </div>
        </div>
      </div>
    </FeedbackCampaignDetailBreadcrumbClient>
  )
}
