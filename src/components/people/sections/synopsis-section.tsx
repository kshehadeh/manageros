import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SynopsisSectionClient } from './synopsis-section-client'
import { canAccessSynopsesForPerson } from '@/lib/auth-utils'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import Link from 'next/link'

interface SynopsisSectionProps {
  personId: string
}

export async function SynopsisSection({ personId }: SynopsisSectionProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.organizationId) {
    return null
  }

  // Check if user can access synopses for this person
  const canAccessSynopses = await canAccessSynopsesForPerson(personId)

  if (!canAccessSynopses) {
    return null
  }

  // Get person name for the modal
  const person = await prisma.person.findFirst({
    where: { id: personId },
    select: { name: true },
  })

  if (!person) {
    return null
  }

  // Get recent synopses directly in the server component
  const synopses = await prisma.personSynopsis.findMany({
    where: { personId },
    orderBy: { createdAt: 'desc' },
    take: 5, // Only load the 5 most recent for sidebar view
  })

  return (
    <section>
      <SynopsisSectionClient
        personId={personId}
        personName={person.name}
        canGenerate={canAccessSynopses}
      >
        {synopses.length === 0 ? (
          <div className='text-sm text-muted-foreground'>No synopses yet.</div>
        ) : (
          <div className='space-y-3'>
            {synopses.map(synopsis => (
              <div key={synopsis.id} className='border rounded-lg p-3'>
                <div className='flex items-start justify-between'>
                  <div className='text-xs text-muted-foreground space-y-1 flex-1'>
                    <div>
                      Generated{' '}
                      {new Date(synopsis.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      Period: {new Date(synopsis.fromDate).toLocaleDateString()}{' '}
                      - {new Date(synopsis.toDate).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    asChild
                    title='View Synopsis'
                  >
                    <Link href={`/people/${personId}/synopses/${synopsis.id}`}>
                      <Eye className='w-4 h-4' />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SynopsisSectionClient>
    </section>
  )
}
