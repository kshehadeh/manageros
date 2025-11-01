import { prisma } from '@/lib/db'
import { PersonFeedbackCampaigns } from '@/components/people/person-feedback-campaigns'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { Button } from '@/components/ui/button'
import { MessageCircle, Eye, Plus } from 'lucide-react'
import Link from 'next/link'

interface FeedbackCampaignsSectionProps {
  personId: string
  organizationId: string
  currentUserId: string
}

export async function FeedbackCampaignsSection({
  personId,
  organizationId,
  currentUserId,
}: FeedbackCampaignsSectionProps) {
  if (!organizationId) {
    return null
  }

  // Get feedback campaigns for this person
  const feedbackCampaigns = await prisma.feedbackCampaign.findMany({
    where: {
      status: {
        in: ['active', 'draft'],
      },
      userId: currentUserId,
      targetPersonId: personId,
      targetPerson: {
        organizationId,
      },
    },
    include: {
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

  // Only show if there are active or draft campaigns
  if (feedbackCampaigns.length === 0) {
    return null
  }

  return (
    <div className='flex-1 min-w-[300px] max-w-[500px]'>
      <PageSection
        header={
          <SectionHeader
            icon={MessageCircle}
            title={`Feedback Campaigns (${feedbackCampaigns.length})`}
            action={
              <div className='flex items-center gap-2'>
                <Button
                  asChild
                  variant='outline'
                  size='sm'
                  title='View All Feedback Campaigns'
                >
                  <Link href={`/people/${personId}/feedback-campaigns`}>
                    <Eye className='w-4 h-4' />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant='outline'
                  size='sm'
                  title='Create New Feedback Campaign'
                >
                  <Link href={`/people/${personId}/feedback-campaigns/new`}>
                    <Plus className='w-4 h-4' />
                  </Link>
                </Button>
              </div>
            }
          />
        }
      >
        <PersonFeedbackCampaigns campaigns={feedbackCampaigns} />
      </PageSection>
    </div>
  )
}
