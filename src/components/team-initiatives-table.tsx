'use client'

import { useRouter } from 'next/navigation'
import { MoreHorizontal, Eye, Edit, Target } from 'lucide-react'
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
import { Rag } from '@/components/rag'
import { Badge } from '@/components/ui/badge'

interface InitiativeWithRelations {
  id: string
  title: string
  summary: string | null
  status: string
  rag: string
  confidence: number
  objectives: Array<{
    id: string
    title: string
    keyResult: string | null
    sortIndex: number
  }>
  owners: Array<{
    personId: string
    role: string
    person: {
      id: string
      name: string
    }
  }>
  _count: {
    checkIns: number
    tasks: number
  }
}

interface TeamInitiativesTableProps {
  initiatives: InitiativeWithRelations[]
}

export function TeamInitiativesTable({
  initiatives,
}: TeamInitiativesTableProps) {
  const router = useRouter()

  const handleRowClick = (initiativeId: string) => {
    router.push(`/initiatives/${initiativeId}`)
  }

  if (initiatives.length === 0) {
    return (
      <div className='text-muted-foreground text-sm text-center py-8'>
        No initiatives yet.
      </div>
    )
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>RAG</TableHead>
            <TableHead>Owners</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead className='w-[50px]'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initiatives.map(initiative => (
            <TableRow
              key={initiative.id}
              className='hover:bg-accent/50 cursor-pointer'
              onClick={() => handleRowClick(initiative.id)}
            >
              <TableCell className='font-medium'>
                <div>
                  <div className='font-medium text-foreground'>
                    {initiative.title}
                  </div>
                  {initiative.summary && (
                    <div className='text-sm text-muted-foreground mt-1 line-clamp-2'>
                      {initiative.summary}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant='secondary' className='text-xs'>
                  {initiative.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className='flex items-center gap-2'>
                  <Rag rag={initiative.rag} />
                  <span className='text-xs text-muted-foreground'>
                    {initiative.confidence}%
                  </span>
                </div>
              </TableCell>
              <TableCell className='text-muted-foreground'>
                <div className='flex flex-wrap gap-1'>
                  {initiative.owners.slice(0, 2).map(owner => (
                    <Badge
                      key={owner.personId}
                      variant='outline'
                      className='text-xs'
                    >
                      {owner.person.name}
                    </Badge>
                  ))}
                  {initiative.owners.length > 2 && (
                    <Badge variant='outline' className='text-xs'>
                      +{initiative.owners.length - 2}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className='text-muted-foreground'>
                <div className='flex items-center gap-1 text-xs'>
                  <Target className='h-3 w-3' />
                  {initiative._count.tasks} tasks
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
                        onClick={() =>
                          router.push(`/initiatives/${initiative.id}`)
                        }
                      >
                        <Eye className='h-4 w-4 mr-2' />
                        View
                      </Button>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Button
                        variant='ghost'
                        className='w-full justify-start p-0 h-auto'
                        onClick={() =>
                          router.push(`/initiatives/${initiative.id}/edit`)
                        }
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
