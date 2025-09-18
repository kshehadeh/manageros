import { prisma } from '@/lib/db'
import { Rag } from '@/components/rag'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DeleteInitiativeButton } from '@/components/delete-initiative-button'
import { CheckInList } from '@/components/checkin-list'

export default async function InitiativeDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const { id } = await params
  const init = await prisma.initiative.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      objectives: { include: { tasks: true } },
      checkIns: {
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: true,
        },
      },
      team: true,
      owners: {
        include: {
          person: true,
        },
      },
    },
  })

  if (!init) return <div>Not found</div>

  return (
    <div className='space-y-6'>
      <div className='card'>
        <div className='flex items-center justify-between'>
          <div className='flex-1'>
            <div className='flex items-center gap-3 mb-2'>
              <h2 className='text-lg font-semibold'>{init.title}</h2>
              <div className='flex items-center gap-2'>
                <Rag rag={init.rag} />
                <span className='badge'>{init.confidence}%</span>
              </div>
            </div>
            <p className='text-neutral-400 mb-4'>{init.summary ?? ''}</p>

            {/* Team and Owner Details */}
            <div className='space-y-3'>
              {init.team && (
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium text-neutral-300'>
                    Team:
                  </span>
                  <Link
                    href={`/teams/${init.team.id}`}
                    className='text-blue-400 hover:text-blue-300 font-medium'
                  >
                    {init.team.name}
                  </Link>
                </div>
              )}

              {init.owners.length > 0 && (
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium text-neutral-300'>
                    Owners:
                  </span>
                  <div className='flex items-center gap-2'>
                    {init.owners.map((owner, index) => (
                      <span
                        key={owner.person.id}
                        className='flex items-center gap-1'
                      >
                        <Link
                          href={`/people/${owner.person.id}`}
                          className='text-blue-400 hover:text-blue-300 font-medium'
                        >
                          {owner.person.name}
                        </Link>
                        <span className='text-xs text-neutral-500'>
                          ({owner.role})
                        </span>
                        {index < init.owners.length - 1 && (
                          <span className='text-neutral-500'>,</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex items-center gap-2'>
            <Link
              href={`/initiatives/${init.id}/edit`}
              className='btn bg-blue-600 hover:bg-blue-700 text-sm'
            >
              Edit
            </Link>
            <DeleteInitiativeButton initiativeId={init.id} />
          </div>
        </div>
      </div>

      <section className='card'>
        <h3 className='font-semibold mb-3'>Objectives & Tasks</h3>
        <div className='space-y-4'>
          {init.objectives.map(o => (
            <div key={o.id} className='space-y-2'>
              <div className='font-medium'>{o.title}</div>
              <ul className='text-sm list-disc ml-5'>
                {o.tasks.map(t => (
                  <li key={t.id}>
                    {t.title}{' '}
                    <span className='text-neutral-500'>({t.status})</span>
                  </li>
                ))}
                {o.tasks.length === 0 && (
                  <li className='text-neutral-500'>No tasks</li>
                )}
              </ul>
            </div>
          ))}
          {init.objectives.length === 0 && (
            <div className='text-neutral-400 text-sm'>No objectives yet.</div>
          )}
        </div>
      </section>

      <section className='card'>
        <CheckInList
          initiativeId={init.id}
          initiativeTitle={init.title}
          checkIns={init.checkIns.map(ci => ({
            id: ci.id,
            weekOf: ci.weekOf.toISOString(),
            rag: ci.rag,
            confidence: ci.confidence,
            summary: ci.summary,
            blockers: ci.blockers,
            nextSteps: ci.nextSteps,
            createdAt: ci.createdAt.toISOString(),
            createdBy: {
              id: ci.createdBy.id,
              name: ci.createdBy.name,
            },
          }))}
        />
      </section>
    </div>
  )
}
