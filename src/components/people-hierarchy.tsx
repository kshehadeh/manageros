import Link from 'next/link'
import { EditIconButton } from './edit-icon-button'
import { PersonStatusBadge } from './person-status-badge'

interface Person {
  id: string
  name: string
  email: string | null
  role: string | null
  status: string
  team: { id: string; name: string } | null
  manager: {
    id: string
    name: string
    email: string | null
    role: string | null
    status: string
  } | null
  reports: Array<{
    id: string
    name: string
    email: string | null
    role: string | null
    status: string
  }>
  level: number
}

interface PeopleHierarchyProps {
  people: Person[]
}

export function PeopleHierarchy({ people }: PeopleHierarchyProps) {
  if (people.length === 0) {
    return <div className='text-muted-foreground text-sm'>No people yet.</div>
  }

  return (
    <div className='space-y-2'>
      {people.map((person, index) => {
        const isLastAtLevel =
          index === people.length - 1 || people[index + 1].level < person.level

        return (
          <div key={person.id} className='relative'>
            {/* Vertical line for hierarchy levels */}
            {person.level > 0 && (
              <div
                className='absolute w-px bg-muted-foreground'
                style={{
                  left: `${person.level * 32 - 16}px`,
                  top: '0px',
                  height: isLastAtLevel ? '50%' : '100%',
                }}
              />
            )}

            {/* Horizontal connector line */}
            {person.level > 0 && (
              <div
                className='absolute w-4 h-px bg-muted-foreground'
                style={{
                  left: `${person.level * 32 - 16}px`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
            )}

            {/* Person card */}
            <div
              className='card relative z-10 ml-8'
              style={{ marginLeft: `${person.level * 32}px` }}
            >
              <div className='flex items-center justify-between py-2'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <Link
                      href={`/people/${person.id}`}
                      className='font-medium hover:text-primary'
                    >
                      {person.name}
                    </Link>
                    {person.reports.length > 0 && (
                      <span className='text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full'>
                        {person.reports.length} report
                        {person.reports.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className='text-sm text-muted-foreground mt-1'>
                    {person.role && <span>{person.role}</span>}
                    {person.role && person.team && <span> • </span>}
                    {person.team && (
                      <span>
                        Team:{' '}
                        <Link
                          href={`/teams/${person.team.id}`}
                          className='hover:text-primary'
                        >
                          {person.team.name}
                        </Link>
                      </span>
                    )}
                  </div>

                  <div className='text-xs text-muted-foreground mt-1'>
                    {person.email && <span>{person.email}</span>}
                    {person.manager && (
                      <span>
                        {' '}
                        • Reports to:{' '}
                        <Link
                          href={`/people/${person.manager.id}`}
                          className='hover:text-primary'
                        >
                          {person.manager.name}
                        </Link>
                      </span>
                    )}
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <PersonStatusBadge status={person.status} />
                  <EditIconButton
                    href={`/people/${person.id}/edit`}
                    variant='outline'
                    size='sm'
                  />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
