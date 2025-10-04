import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Team } from '@prisma/client'

interface PersonListItemProps {
  person: {
    id: string
    name: string
    email?: string | null
    avatar?: string | null
    role?: string | null
    team?: Team | { id: string; name: string } | null
  }
  showRole?: boolean
  showTeam?: boolean
  showEmail?: boolean
  roleBadge?: string
  className?: string
}

export function PersonListItem({
  person,
  showRole = false,
  showTeam = false,
  showEmail = false,
  roleBadge,
  className = '',
}: PersonListItemProps) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <Avatar className='h-8 w-8'>
        <AvatarImage src={person.avatar || undefined} />
        <AvatarFallback className='text-xs'>
          {person.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className='flex-1 min-w-0'>
        <Link
          href={`/people/${person.id}`}
          className='text-sm font-medium hover:text-primary transition-colors'
        >
          {person.name}
        </Link>
        <div className='text-xs text-muted-foreground mt-0.5 space-y-0.5'>
          {showRole && person.role && <div>{person.role}</div>}
          {showTeam && person.team && <div>{person.team.name}</div>}
          {showEmail && person.email && <div>{person.email}</div>}
        </div>
        {roleBadge && (
          <Badge variant='secondary' className='text-xs mt-1'>
            {roleBadge}
          </Badge>
        )}
      </div>
    </div>
  )
}
