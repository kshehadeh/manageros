'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Check,
  X,
  MessageCircle,
  MessageSquare,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { FeedbackForm } from '@/components/feedback-form'
import { OneOnOneForm } from '@/components/oneonone-form'

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

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  personId: string
  triggerType: 'rightClick' | 'button'
}

interface FeedbackModalState {
  visible: boolean
  personId: string
  personName: string
}

interface OneOnOneModalState {
  visible: boolean
  personId: string
  personName: string
}

export function PeopleTable({ people, filteredPeople }: PeopleTableProps) {
  const displayPeople = filteredPeople || people
  const [editing, setEditing] = useState<EditingState>({})
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([])
  const [allPeople, setAllPeople] = useState<
    Array<{ id: string; name: string }>
  >([])
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    personId: '',
    triggerType: 'rightClick',
  })
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState>({
    visible: false,
    personId: '',
    personName: '',
  })
  const [oneOnOneModal, setOneOnOneModal] = useState<OneOnOneModalState>({
    visible: false,
    personId: '',
    personName: '',
  })

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

  // Handle clicking outside context menu to close it
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(prev => ({ ...prev, visible: false }))
    }

    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu.visible])

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

  const handleRowDoubleClick = (personId: string) => {
    router.push(`/people/${personId}`)
  }

  const handleRowRightClick = (e: React.MouseEvent, personId: string) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      personId,
      triggerType: 'rightClick',
    })
  }

  const handleButtonClick = (e: React.MouseEvent, personId: string) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setContextMenu({
      visible: true,
      x: rect.right - 160, // Position menu to the left of the button
      y: rect.bottom + 4, // Position menu below the button
      personId,
      triggerType: 'button',
    })
  }

  const handleAddFeedback = (personId: string, personName: string) => {
    setContextMenu(prev => ({ ...prev, visible: false }))
    setFeedbackModal({
      visible: true,
      personId,
      personName,
    })
  }

  const handleFeedbackSuccess = () => {
    setFeedbackModal(prev => ({ ...prev, visible: false }))
    toast.success('Feedback added successfully')
    // Refresh the page to show updated data
    window.location.reload()
  }

  const handleFeedbackCancel = () => {
    setFeedbackModal(prev => ({ ...prev, visible: false }))
  }

  const handleAddOneOnOne = (personId: string, personName: string) => {
    setContextMenu(prev => ({ ...prev, visible: false }))
    setOneOnOneModal({
      visible: true,
      personId,
      personName,
    })
  }

  const handleOneOnOneCancel = () => {
    setOneOnOneModal(prev => ({ ...prev, visible: false }))
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
              className='border-neutral-800 hover:bg-neutral-900/50 cursor-pointer'
              onDoubleClick={() => handleRowDoubleClick(person.id)}
              onContextMenu={e => handleRowRightClick(e, person.id)}
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
                <Button
                  variant='ghost'
                  className='h-8 w-8 p-0'
                  onClick={e => handleButtonClick(e, person.id)}
                >
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className='fixed z-50 bg-neutral-900 border border-neutral-700 rounded-md shadow-lg py-1 min-w-[160px]'
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className='w-full px-3 py-2 text-left text-sm text-neutral-100 hover:bg-neutral-800 flex items-center gap-2'
            onClick={() => {
              router.push(`/people/${contextMenu.personId}`)
              setContextMenu(prev => ({ ...prev, visible: false }))
            }}
          >
            <Eye className='w-4 h-4' />
            View
          </button>
          <button
            className='w-full px-3 py-2 text-left text-sm text-neutral-100 hover:bg-neutral-800 flex items-center gap-2'
            onClick={() => {
              router.push(`/people/${contextMenu.personId}/edit`)
              setContextMenu(prev => ({ ...prev, visible: false }))
            }}
          >
            <Edit className='w-4 h-4' />
            Edit
          </button>
          <button
            className='w-full px-3 py-2 text-left text-sm text-neutral-100 hover:bg-neutral-800 flex items-center gap-2'
            onClick={() => {
              const person = displayPeople.find(
                p => p.id === contextMenu.personId
              )
              if (person) {
                handleAddFeedback(person.id, person.name)
              }
            }}
          >
            <MessageCircle className='w-4 h-4' />
            Add Feedback
          </button>
          <button
            className='w-full px-3 py-2 text-left text-sm text-neutral-100 hover:bg-neutral-800 flex items-center gap-2'
            onClick={() => {
              const person = displayPeople.find(
                p => p.id === contextMenu.personId
              )
              if (person) {
                handleAddOneOnOne(person.id, person.name)
              }
            }}
          >
            <MessageSquare className='w-4 h-4' />
            Add 1:1
          </button>
          <button
            className='w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 flex items-center gap-2'
            onClick={() => {
              handleDelete(contextMenu.personId)
              setContextMenu(prev => ({ ...prev, visible: false }))
            }}
          >
            <Trash2 className='w-4 h-4' />
            Delete
          </button>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal.visible && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-neutral-800 border border-neutral-700 rounded-xl p-6 max-w-md w-full mx-4'>
            <h4 className='font-medium mb-4'>
              Add Feedback for {feedbackModal.personName}
            </h4>
            <FeedbackForm
              person={{
                id: feedbackModal.personId,
                name: feedbackModal.personName,
                email: null,
                role: null,
                organizationId: '',
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'active',
                teamId: null,
                managerId: null,
                startedAt: null,
              }}
              onSuccess={handleFeedbackSuccess}
              onCancel={handleFeedbackCancel}
            />
          </div>
        </div>
      )}

      {/* 1:1 Modal */}
      {oneOnOneModal.visible && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-neutral-800 border border-neutral-700 rounded-xl p-6 max-w-lg w-full mx-4'>
            <h4 className='font-medium mb-4'>
              Add 1:1 with {oneOnOneModal.personName}
            </h4>
            <OneOnOneForm
              people={allPeople.map(p => ({
                id: p.id,
                name: p.name,
                email: null,
                role: null,
                reports: [],
              }))}
              preFilledReportId={oneOnOneModal.personId}
              onCancel={handleOneOnOneCancel}
            />
          </div>
        </div>
      )}
    </div>
  )
}
