'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LinkManager } from '@/components/entity-links'
import { Users } from 'lucide-react'
import Link from 'next/link'

interface Person {
  id: string
  name: string
  email?: string | null
  avatar?: string | null
  role?: string | null
}

interface InitiativeOwner {
  initiativeId: string
  personId: string
  role: string
  person: Person
}

interface Team {
  id: string
  name: string
}

interface EntityLink {
  id: string
  url: string
  title: string | null
  description: string | null
  createdAt: Date
  updatedAt: Date
  createdBy: {
    id: string
    name: string
    email: string
  }
}

interface InitiativeSidebarProps {
  team: Team | null
  owners: InitiativeOwner[]
  links: EntityLink[]
  entityType: string
  entityId: string
}

export function InitiativeSidebar({
  team,
  owners,
  links,
  entityType,
  entityId,
}: InitiativeSidebarProps) {
  return (
    <div className='w-full lg:w-80 space-y-6 px-4 lg:px-0'>
      {/* Team Section */}
      {team && (
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <Users className='h-5 w-5' />
              Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              <Link
                href={`/teams/${team.id}`}
                className='text-sm font-medium text-primary hover:underline'
              >
                {team.name}
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Associated People Section */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <Users className='h-5 w-5' />
            Associated People
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {owners.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              No people associated with this initiative yet.
            </p>
          ) : (
            owners.map(owner => (
              <div
                key={`${owner.initiativeId}-${owner.personId}`}
                className='flex items-center gap-3'
              >
                <Avatar className='h-8 w-8'>
                  <AvatarImage src={owner.person.avatar || undefined} />
                  <AvatarFallback className='text-xs'>
                    {owner.person.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className='flex-1 min-w-0'>
                  <Link
                    href={`/people/${owner.person.id}`}
                    className='text-sm font-medium hover:text-primary transition-colors'
                  >
                    {owner.person.name}
                  </Link>
                  {owner.role && owner.role !== 'owner' && (
                    <Badge variant='secondary' className='text-xs mt-1'>
                      {owner.role}
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Links Section */}
      <Card>
        <CardContent className='pt-6'>
          <LinkManager
            entityType={entityType}
            entityId={entityId}
            links={links}
          />
        </CardContent>
      </Card>
    </div>
  )
}
