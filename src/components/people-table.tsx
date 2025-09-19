'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { MoreHorizontal, Edit, Eye, Trash2, Check, X } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  updatePersonPartial,
  deletePerson,
  getTeams,
  getPeople,
} from '@/lib/actions'
import { toast } from 'sonner'
import { Person } from '@/types/person'

interface PeopleTableProps {
  people: Person[]
  filteredPeople?: Person[]
}

interface EditingState {
  [key: string]: {
    field: string
    value: string
  }
}

export function PeopleTable({ people, filteredPeople }: PeopleTableProps) {
  const displayPeople = filteredPeople || people
  const [editing, setEditing] = useState<EditingState>({})
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([])
  const [allPeople, setAllPeople] = useState<
    Array<{ id: string; name: string }>
  >([])
  const [isPending, startTransition] = useTransition()

  // Load teams and people for dropdowns
  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamsData, peopleData] = await Promise.all([
          getTeams(),
          getPeople(),
        ])
        setTeams(teamsData)
        setAllPeople(peopleData)
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }
    loadData()
  }, [])

  const handleEdit = (
    personId: string,
    field: string,
    currentValue: string
  ) => {
    // For select fields, use the actual ID or 'none' for empty values
    let editValue = currentValue || ''
    if (field === 'team') {
      // Find the team ID from the current team name
      const person = displayPeople.find(p => p.id === personId)
      editValue = person?.team?.id || 'none'
    } else if (field === 'manager') {
      // Find the manager ID from the current manager name
      const person = displayPeople.find(p => p.id === personId)
      editValue = person?.manager?.id || 'none'
    }

    setEditing({
      ...editing,
      [personId]: { field, value: editValue },
    })
  }

  const handleCancel = (personId: string) => {
    const newEditing = { ...editing }
    delete newEditing[personId]
    setEditing(newEditing)
  }

  const handleSave = async (personId: string) => {
    const editState = editing[personId]
    if (!editState) return

    startTransition(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {}

        if (editState.field === 'role') {
          updateData.role = editState.value
        } else if (editState.field === 'team') {
          updateData.teamId =
            editState.value === 'none' ? null : editState.value
        } else if (editState.field === 'manager') {
          updateData.managerId =
            editState.value === 'none' ? null : editState.value
        }

        await updatePersonPartial(personId, updateData)

        // Remove from editing state
        const newEditing = { ...editing }
        delete newEditing[personId]
        setEditing(newEditing)

        toast.success('Person updated successfully')
        // Refresh the page to show updated data
        window.location.reload()
      } catch (error) {
        console.error('Failed to update person:', error)
        toast.error('Failed to update person')
      }
    })
  }

  const handleDelete = async (personId: string) => {
    if (confirm('Are you sure you want to delete this person?')) {
      startTransition(async () => {
        try {
          await deletePerson(personId)
          toast.success('Person deleted successfully')
        } catch (error) {
          console.error('Failed to delete person:', error)
          toast.error(
            error instanceof Error ? error.message : 'Failed to delete person'
          )
        }
      })
    }
  }

  const renderEditableCell = (
    person: Person,
    field: string,
    displayValue: string
  ) => {
    const isEditing = editing[person.id]?.field === field
    const editValue = editing[person.id]?.value

    if (!isEditing) {
      return (
        <div
          className='cursor-pointer hover:bg-neutral-800 p-1 rounded'
          onClick={() => handleEdit(person.id, field, displayValue)}
        >
          {displayValue || '—'}
        </div>
      )
    }

    if (field === 'role') {
      return (
        <div className='flex items-center gap-2'>
          <Input
            value={editValue}
            onChange={e =>
              setEditing({
                ...editing,
                [person.id]: { field, value: e.target.value },
              })
            }
            className='h-8 bg-neutral-900 border-neutral-700 text-neutral-100 placeholder:text-neutral-400 focus:border-neutral-600'
            autoFocus
          />
          <Button
            size='sm'
            variant='ghost'
            onClick={() => handleSave(person.id)}
            disabled={isPending}
          >
            <Check className='w-4 h-4' />
          </Button>
          <Button
            size='sm'
            variant='ghost'
            onClick={() => handleCancel(person.id)}
          >
            <X className='w-4 h-4' />
          </Button>
        </div>
      )
    }

    if (field === 'team') {
      return (
        <div className='flex items-center gap-2'>
          <Select
            value={editValue || 'none'}
            onValueChange={value =>
              setEditing({
                ...editing,
                [person.id]: { field, value },
              })
            }
          >
            <SelectTrigger className='h-8 w-[180px] bg-neutral-900 border-neutral-700 text-neutral-100'>
              <SelectValue placeholder='Select team' />
            </SelectTrigger>
            <SelectContent className='bg-neutral-900 border-neutral-700'>
              <SelectItem
                value='none'
                className='text-neutral-100 hover:bg-neutral-800'
              >
                No team
              </SelectItem>
              {teams.map(team => (
                <SelectItem
                  key={team.id}
                  value={team.id}
                  className='text-neutral-100 hover:bg-neutral-800'
                >
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size='sm'
            variant='ghost'
            onClick={() => handleSave(person.id)}
            disabled={isPending}
          >
            <Check className='w-4 h-4' />
          </Button>
          <Button
            size='sm'
            variant='ghost'
            onClick={() => handleCancel(person.id)}
          >
            <X className='w-4 h-4' />
          </Button>
        </div>
      )
    }

    if (field === 'manager') {
      return (
        <div className='flex items-center gap-2'>
          <Select
            value={editValue || 'none'}
            onValueChange={value =>
              setEditing({
                ...editing,
                [person.id]: { field, value },
              })
            }
          >
            <SelectTrigger className='h-8 w-[180px] bg-neutral-900 border-neutral-700 text-neutral-100'>
              <SelectValue placeholder='Select manager' />
            </SelectTrigger>
            <SelectContent className='bg-neutral-900 border-neutral-700'>
              <SelectItem
                value='none'
                className='text-neutral-100 hover:bg-neutral-800'
              >
                No manager
              </SelectItem>
              {allPeople
                .filter(p => p.id !== person.id) // Can't be their own manager
                .map(p => (
                  <SelectItem
                    key={p.id}
                    value={p.id}
                    className='text-neutral-100 hover:bg-neutral-800'
                  >
                    {p.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button
            size='sm'
            variant='ghost'
            onClick={() => handleSave(person.id)}
            disabled={isPending}
          >
            <Check className='w-4 h-4' />
          </Button>
          <Button
            size='sm'
            variant='ghost'
            onClick={() => handleCancel(person.id)}
          >
            <X className='w-4 h-4' />
          </Button>
        </div>
      )
    }

    return displayValue
  }

  if (displayPeople.length === 0) {
    return (
      <div className='text-neutral-400 text-sm text-center py-8'>
        {filteredPeople ? 'No people match your filters.' : 'No people yet.'}
      </div>
    )
  }

  return (
    <div className='rounded-md border border-neutral-800'>
      <Table>
        <TableHeader>
          <TableRow className='border-neutral-800 hover:bg-neutral-900/50'>
            <TableHead className='text-neutral-300'>Name</TableHead>
            <TableHead className='text-neutral-300'>Role</TableHead>
            <TableHead className='text-neutral-300'>Team</TableHead>
            <TableHead className='text-neutral-300'>Manager</TableHead>
            <TableHead className='text-neutral-300'>Direct Reports</TableHead>
            <TableHead className='text-neutral-300 w-[50px]'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayPeople.map(person => (
            <TableRow
              key={person.id}
              className='border-neutral-800 hover:bg-neutral-900/50'
            >
              <TableCell className='font-medium text-neutral-100'>
                <div className='flex items-center gap-2'>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      person.status === 'active'
                        ? 'bg-green-500'
                        : person.status === 'inactive'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                    }`}
                  />
                  {person.name}
                </div>
              </TableCell>
              <TableCell className='text-neutral-300'>
                {renderEditableCell(person, 'role', person.role || '')}
              </TableCell>
              <TableCell className='text-neutral-300'>
                {renderEditableCell(person, 'team', person.team?.name || '')}
              </TableCell>
              <TableCell className='text-neutral-300'>
                {renderEditableCell(
                  person,
                  'manager',
                  person.manager?.name || ''
                )}
              </TableCell>
              <TableCell className='text-neutral-300'>
                <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900 text-blue-300'>
                  {person.reports.length}
                </span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' className='h-8 w-8 p-0'>
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align='end'
                    className='bg-neutral-900 border-neutral-800'
                  >
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/people/${person.id}`}
                        className='flex items-center gap-2'
                      >
                        <Eye className='w-4 h-4' />
                        View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/people/${person.id}/edit`}
                        className='flex items-center gap-2'
                      >
                        <Edit className='w-4 h-4' />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(person.id)}
                      className='text-red-400 hover:text-red-300 hover:bg-red-900/20'
                    >
                      <Trash2 className='w-4 h-4 mr-2' />
                      Delete
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
