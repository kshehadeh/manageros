import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FeedbackCampaignDetailBreadcrumbClient } from '@/components/feedback-campaign-detail-breadcrumb-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Mail,
  Users,
  Edit,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

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
  const isManager = await checkIfManager(currentPerson.id, person.id)

  if (!isManager) {
    redirect('/people')
  }

  // Get the feedback campaign
  const campaign = await prisma.feedbackCampaign.findFirst({
    where: {
      id: campaignId,
      targetPersonId: id,
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
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold'>{campaignTitle}</h1>
            <p className='text-neutral-400 mt-1'>
              Feedback campaign for {person.name}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Badge
              variant={statusInfo.variant}
              className='flex items-center gap-1'
            >
              <StatusIcon className='h-3 w-3' />
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex items-center gap-3'>
          {campaign.status === 'draft' && (
            <Button asChild>
              <Link
                href={`/people/${person.id}/feedback-campaigns/${campaign.id}/edit`}
              >
                <Edit className='h-4 w-4 mr-2' />
                Edit Campaign
              </Link>
            </Button>
          )}
          <Button asChild variant='outline'>
            <Link
              href={`/people/${person.id}/feedback-campaigns/${campaign.id}/responses`}
            >
              <Eye className='h-4 w-4 mr-2' />
              View Responses
            </Link>
          </Button>
        </div>

        <div className='grid gap-6 lg:grid-cols-3'>
          {/* Campaign Details */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Campaign Information */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Information</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                      <Calendar className='h-4 w-4' />
                      <span>Campaign Period</span>
                    </div>
                    <p className='font-medium'>
                      {format(campaign.startDate, 'MMM d, yyyy')} -{' '}
                      {format(campaign.endDate, 'MMM d, yyyy')}
                    </p>
                  </div>

                  <div className='space-y-2'>
                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                      <Mail className='h-4 w-4' />
                      <span>Created by</span>
                    </div>
                    <p className='font-medium'>{campaign.user.name}</p>
                  </div>

                  {campaign.template && (
                    <div className='space-y-2'>
                      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                        <span>Template</span>
                      </div>
                      <p className='font-medium'>{campaign.template.name}</p>
                      {campaign.template.description && (
                        <p className='text-sm text-muted-foreground'>
                          {campaign.template.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Response Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Response Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-foreground'>
                      {totalInvites}
                    </div>
                    <div className='text-sm text-muted-foreground'>Invited</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-foreground'>
                      {totalResponses}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Responses
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-foreground'>
                      {responseRate}%
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Response Rate
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {campaign.status === 'draft' && (
                  <Button asChild className='w-full justify-start'>
                    <Link
                      href={`/people/${person.id}/feedback-campaigns/${campaign.id}/edit`}
                    >
                      <Edit className='h-4 w-4 mr-2' />
                      Edit Campaign
                    </Link>
                  </Button>
                )}
                <Button
                  asChild
                  variant='outline'
                  className='w-full justify-start'
                >
                  <Link
                    href={`/people/${person.id}/feedback-campaigns/${campaign.id}/responses`}
                  >
                    <Eye className='h-4 w-4 mr-2' />
                    View Responses
                  </Link>
                </Button>
                <Button
                  asChild
                  variant='outline'
                  className='w-full justify-start'
                >
                  <Link href={`/people/${person.id}/feedback-campaigns`}>
                    <Users className='h-4 w-4 mr-2' />
                    All Campaigns
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Campaign Status */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>
                      Status
                    </span>
                    <Badge
                      variant={statusInfo.variant}
                      className='flex items-center gap-1'
                    >
                      <StatusIcon className='h-3 w-3' />
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>
                      Created
                    </span>
                    <span className='text-sm font-medium'>
                      {format(campaign.createdAt, 'MMM d, yyyy')}
                    </span>
                  </div>
                  {campaign.updatedAt && (
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-muted-foreground'>
                        Last Updated
                      </span>
                      <span className='text-sm font-medium'>
                        {format(campaign.updatedAt, 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </FeedbackCampaignDetailBreadcrumbClient>
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
