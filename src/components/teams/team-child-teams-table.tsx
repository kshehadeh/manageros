'use client'

import { useRouter } from 'next/navigation'
import { MoreHorizontal, Eye, Edit, Users, Target } from 'lucide-react'
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

interface ChildTeamWithRelations {
  id: string
  name: string
  description: string | null
  people: Array<{
    id: string
    name: string
  }>
  initiatives: Array<{
    id: string
    title: string
  }>
}

interface TeamChildTeamsTableProps {
  childTeams: ChildTeamWithRelations[]
}

export function TeamChildTeamsTable({ childTeams }: TeamChildTeamsTableProps) {
  const router = useRouter()

  const handleRowClick = (teamId: string) => {
    router.push(`/teams/${teamId}`)
  }

  if (childTeams.length === 0) {
    return (
      <div className='text-muted-foreground text-sm text-center py-8'>
        No child teams yet.
      </div>
    )
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Initiatives</TableHead>
            <TableHead className='w-[50px]'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {childTeams.map(team => (
            <TableRow
              key={team.id}
              className='hover:bg-accent/50 cursor-pointer'
              onClick={() => handleRowClick(team.id)}
            >
              <TableCell className='font-medium'>{team.name}</TableCell>
              <TableCell className='text-muted-foreground'>
                {team.description || '—'}
              </TableCell>
              <TableCell className='text-muted-foreground'>
                <div className='flex items-center gap-1'>
                  <Users className='h-3 w-3' />
                  {team.people.length}
                </div>
              </TableCell>
              <TableCell className='text-muted-foreground'>
                <div className='flex items-center gap-1'>
                  <Target className='h-3 w-3' />
                  {team.initiatives.length}
                </div>
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
                        onClick={() => router.push(`/teams/${team.id}`)}
                      >
                        <Eye className='h-4 w-4 mr-2' />
                        View
                      </Button>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Button
                        variant='ghost'
                        className='w-full justify-start p-0 h-auto'
                        onClick={() => router.push(`/teams/${team.id}/edit`)}
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
