import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAllFeedbackCampaignsForOrganization } from '@/lib/actions/feedback-campaign'
import { FeedbackCampaignList } from '@/components/feedback/feedback-campaign-list'
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

export default async function FeedbackCampaignsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user.organizationId) {
    redirect('/organization/create')
  }

  // Get all feedback campaigns for the organization
  const campaigns = await getAllFeedbackCampaignsForOrganization()

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
    <div className='page-container'>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold'>Feedback Campaigns</h1>
            <p className='text-gray-600'>
              Manage feedback campaigns across your organization
            </p>
          </div>
          <Button asChild>
            <Link href='/people' className='flex items-center gap-2'>
              <Plus className='h-4 w-4' />
              Create Campaign
            </Link>
          </Button>
        </div>

        <div className='grid gap-6 lg:grid-cols-3'>
          <div className='lg:col-span-2'>
            {typedCampaigns.length > 0 ? (
              <FeedbackCampaignList campaigns={typedCampaigns} />
            ) : (
              <Card>
                <CardContent className='flex flex-col items-center justify-center py-12'>
                  <div className='text-center'>
                    <h3 className='text-lg font-semibold mb-2'>
                      No feedback campaigns yet
                    </h3>
                    <p className='text-gray-600 mb-4'>
                      Get started by creating your first feedback campaign for a
                      team member.
                    </p>
                    <Button asChild>
                      <Link href='/people' className='flex items-center gap-2'>
                        <Plus className='h-4 w-4' />
                        Create Campaign
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
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
    </div>
  )
}
