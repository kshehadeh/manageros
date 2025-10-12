import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAllFeedback } from '@/lib/actions/feedback'
import FeedbackViewClient from '@/components/feedback/feedback-view-client'
import { prisma } from '@/lib/db'
import { MessageCircle } from 'lucide-react'

export default async function FeedbackPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const [feedback, currentPerson] = await Promise.all([
    getAllFeedback(),
    prisma.person.findFirst({
      where: {
        user: {
          id: session.user.id,
        },
      },
    }),
  ])

  return (
    <div className='page-container'>
      <div className='page-header'>
        <div className='flex items-center gap-3 mb-2'>
          <MessageCircle className='h-6 w-6 text-muted-foreground' />
          <h1 className='page-title'>Feedback</h1>
        </div>
        <p className='page-subtitle'>
          View and filter feedback across your organization. You can see all
          public feedback and any private feedback you&apos;ve written.
        </p>
      </div>

      <FeedbackViewClient
        initialFeedback={feedback}
        currentUserId={currentPerson?.id}
      />
    </div>
  )
}
