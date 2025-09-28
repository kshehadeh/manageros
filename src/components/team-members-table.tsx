'use client'

import { useRouter } from 'next/navigation'
import { MoreHorizontal, Eye, Edit } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PersonStatusBadge } from '@/components/person-status-badge'
import { Person } from '@prisma/client'

interface PersonWithManager extends Person {
  manager: {
    id: string
    name: string
  } | null
}

interface TeamMembersTableProps {
  people: PersonWithManager[]
}

export function TeamMembersTable({ people }: TeamMembersTableProps) {
  const router = useRouter()

  const handleRowClick = (personId: string) => {
    router.push(`/people/${personId}`)
  }

  if (people.length === 0) {
    return (
      <div className='text-muted-foreground text-sm text-center py-8'>
        No team members yet.
      </div>
    )
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='w-[50px]'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {people.map(person => (
            <TableRow
              key={person.id}
              className='hover:bg-accent/50 cursor-pointer'
              onClick={() => handleRowClick(person.id)}
            >
              <TableCell className='font-medium'>{person.name}</TableCell>
              <TableCell className='text-muted-foreground'>
                {person.role || '—'}
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {person.manager?.name || '—'}
              </TableCell>
              <TableCell>
                <PersonStatusBadge status={person.status} size='sm' />
              </TableCell>
              <TableCell onClick={e => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem asChild>
                      <Button
                        variant='ghost'
                        className='w-full justify-start p-0 h-auto'
                        onClick={() => router.push(`/people/${person.id}`)}
                      >
                        <Eye className='h-4 w-4 mr-2' />
                        View
                      </Button>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Button
                        variant='ghost'
                        className='w-full justify-start p-0 h-auto'
                        onClick={() => router.push(`/people/${person.id}/edit`)}
                      >
                        <Edit className='h-4 w-4 mr-2' />
                        Edit
                      </Button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
