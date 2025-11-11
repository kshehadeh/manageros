import { Link } from '@/components/ui/link'
import { prisma } from '@/lib/db'
import { ExpandableSection } from '@/components/expandable-section'

interface DashboardRecentFeedbackSectionProps {
  userId: string
  organizationId: string
}

export async function DashboardRecentFeedbackSection({
  userId,
  organizationId,
}: DashboardRecentFeedbackSectionProps) {
  const recentFeedback = await prisma.feedback.findMany({
    where: {
      OR: [
        { from: { user: { id: userId } } },
        { about: { user: { id: userId } }, isPrivate: false },
      ],
      about: { organizationId },
    },
    include: {
      about: { select: { id: true, name: true } },
      from: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  if (!recentFeedback || recentFeedback.length === 0) return null

  return (
    <ExpandableSection title='Recent Feedback' viewAllHref='/people'>
      <div className='space-y-3'>
        {recentFeedback.map(feedback => (
          <Link
            key={feedback.id}
            href={`/people/${feedback.about.id}#feedback`}
            className='block card hover:bg-accent/50 transition-colors'
          >
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='text-sm font-medium text-card-foreground'>
                  {feedback.kind === 'praise' && '✨ '}
                  {feedback.kind === 'constructive' && '💡 '}
                  {feedback.kind === 'general' && '💬 '}
                  {feedback.body.length > 100
                    ? feedback.body.substring(0, 100) + '...'
                    : feedback.body}
                </div>
                <div className='flex items-center gap-2 mt-1'>
                  <span className='text-xs text-muted-foreground'>
                    About{' '}
                    <span className='text-primary'>{feedback.about.name}</span>
                  </span>
                  {feedback.from.id !== feedback.about.id && (
                    <span className='text-xs text-muted-foreground'>
                      • From{' '}
                      <span className='text-primary'>{feedback.from.name}</span>
                    </span>
                  )}
                  <span className='text-xs text-muted-foreground'>
                    • {new Date(feedback.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {feedback.isPrivate && (
                <span className='text-xs text-muted-foreground italic'>
                  Private
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </ExpandableSection>
  )
}
