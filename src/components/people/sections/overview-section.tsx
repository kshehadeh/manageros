import { getLatestPersonOverview } from '@/lib/actions/person-overview'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'
import { OverviewSectionClient } from './overview-section-client'
import { PageSection } from '@/components/ui/page-section'
import { getPersonById } from '@/lib/data/people'
import Markdown from 'react-markdown'

interface OverviewSectionProps {
  personId: string
  organizationId: string
}

function truncateToSentences(text: string, maxSentences: number = 2): string {
  // Match sentences ending with period, exclamation, or question mark
  const sentenceRegex = /[^.!?]+[.!?]+/g
  const sentences = text.match(sentenceRegex)

  if (!sentences || sentences.length <= maxSentences) {
    return text
  }

  return sentences.slice(0, maxSentences).join(' ').trim() + '...'
}

export async function OverviewSection({
  personId,
  organizationId,
}: OverviewSectionProps) {
  const user = await getCurrentUser()

  if (
    !user?.managerOSOrganizationId ||
    user.managerOSOrganizationId !== organizationId
  ) {
    return null
  }

  // Check if user can access overviews for this person (same as synopses)
  const canAccessOverview = await getActionPermission(
    user,
    'person.overview.view',
    personId
  )

  if (!canAccessOverview) {
    return null
  }

  // Get person name
  const person = await getPersonById(personId, organizationId)

  if (!person) {
    return null
  }

  // Get the latest overview
  let overview = null
  try {
    overview = await getLatestPersonOverview(personId)
  } catch (error) {
    // If no overview exists or access denied, overview remains null
    console.error('Error fetching overview:', error)
  }

  const truncatedContent = overview
    ? truncateToSentences(overview.content, 2)
    : null

  return (
    <PageSection>
      <OverviewSectionClient
        personId={personId}
        personName={person.name}
        canGenerate={canAccessOverview}
        hasOverview={!!overview}
        overviewContent={overview?.content}
        overviewUpdatedAt={overview?.updatedAt}
        overviewFromDate={overview?.fromDate}
        overviewToDate={overview?.toDate}
        overviewLookbackDays={overview?.lookbackDays}
      >
        {!overview ? (
          <div className='text-sm text-muted-foreground'>
            No overview generated yet. Click the + button to generate one.
          </div>
        ) : (
          <div
            className='space-y-3 cursor-pointer hover:bg-muted/50 rounded-lg p-3 -m-3 transition-colors'
            role='button'
            tabIndex={0}
          >
            <div className='prose prose-sm dark:prose-invert max-w-none'>
              <div className='text-sm whitespace-pre-wrap leading-relaxed'>
                <Markdown>{truncatedContent}</Markdown>
              </div>
            </div>
            <div className='text-xs text-muted-foreground'>
              Click to read full overview
            </div>
          </div>
        )}
      </OverviewSectionClient>
    </PageSection>
  )
}
