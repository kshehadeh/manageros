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
  Handshake,
  User,
} from 'lucide-react'
import { PersonStatusBadge } from './person-status-badge'
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
import { FeedbackForm } from '@/components/feedback/feedback-form'
import { OneOnOneForm } from '@/components/oneonone-form'
import { DeleteModal } from '@/components/common/delete-modal'

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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
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

  const handleDeleteConfirm = async (personId: string) => {
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
          className='cursor-pointer rounded-md px-2 py-1 transition-colors hover:bg-muted hover:text-foreground'
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
            className='h-8 bg-background border-input text-foreground placeholder:text-muted-foreground'
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
            <SelectTrigger className='h-8 w-[180px] bg-background border-input text-foreground'>
              <SelectValue placeholder='Select team' />
            </SelectTrigger>
            <SelectContent className='bg-popover text-popover-foreground border'>
              <SelectItem
                value='none'
                className='hover:bg-accent hover:text-accent-foreground'
              >
                No team
              </SelectItem>
              {teams.map(team => (
                <SelectItem
                  key={team.id}
                  value={team.id}
                  className='hover:bg-accent hover:text-accent-foreground'
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
            <SelectTrigger className='h-8 w-[180px] bg-background border-input text-foreground'>
              <SelectValue placeholder='Select manager' />
            </SelectTrigger>
            <SelectContent className='bg-popover text-popover-foreground border'>
              <SelectItem
                value='none'
                className='hover:bg-accent hover:text-accent-foreground'
              >
                No manager
              </SelectItem>
              {allPeople
                .filter(p => p.id !== person.id) // Can't be their own manager
                .map(p => (
                  <SelectItem
                    key={p.id}
                    value={p.id}
                    className='hover:bg-accent hover:text-accent-foreground'
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
      <div className='text-muted-foreground text-sm text-center py-8'>
        {filteredPeople ? 'No people match your filters.' : 'No people yet.'}
      </div>
    )
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow className='hover:bg-accent/50'>
            <TableHead className='text-muted-foreground'>Name</TableHead>
            <TableHead className='text-muted-foreground'>Title</TableHead>
            <TableHead className='text-muted-foreground'>Job Role</TableHead>
            <TableHead className='text-muted-foreground'>Team</TableHead>
            <TableHead className='text-muted-foreground'>Manager</TableHead>
            <TableHead className='text-muted-foreground w-[50px]'>
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayPeople.map(person => (
            <TableRow
              key={person.id}
              className='hover:bg-accent/50 cursor-pointer'
              onDoubleClick={() => handleRowDoubleClick(person.id)}
              onContextMenu={e => handleRowRightClick(e, person.id)}
            >
              <TableCell className='font-medium text-foreground'>
                <div className='flex flex-col gap-1'>
                  <div className='flex items-center gap-2'>
                    {person.name}
                    {person.user && (
                      <div title='Linked to user account'>
                        <User className='h-3 w-3 text-blue-500' />
                      </div>
                    )}
                  </div>
                  <div className='flex items-center gap-2'>
                    <PersonStatusBadge status={person.status} size='sm' />
                    <span className='text-xs text-muted-foreground'>
                      {person.reports.length} report
                      {person.reports.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {renderEditableCell(person, 'role', person.role || '')}
              </TableCell>
              <TableCell className='text-muted-foreground'>
                <div className='space-y-1'>
                  <div>{person.jobRole?.title || '—'}</div>
                  {person.jobRole && (
                    <div className='text-xs text-muted-foreground'>
                      {person.jobRole.level.name} • {person.jobRole.domain.name}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {renderEditableCell(person, 'team', person.team?.name || '')}
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {renderEditableCell(
                  person,
                  'manager',
                  person.manager?.name || ''
                )}
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
          className='fixed z-50 bg-popover text-popover-foreground border rounded-md shadow-lg py-1 min-w-[160px]'
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className='w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2'
            onClick={() => {
              router.push(`/people/${contextMenu.personId}`)
              setContextMenu(prev => ({ ...prev, visible: false }))
            }}
          >
            <Eye className='w-4 h-4' />
            View
          </button>
          <button
            className='w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2'
            onClick={() => {
              router.push(`/people/${contextMenu.personId}/edit`)
              setContextMenu(prev => ({ ...prev, visible: false }))
            }}
          >
            <Edit className='w-4 h-4' />
            Edit
          </button>
          <button
            className='w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2'
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
            className='w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2'
            onClick={() => {
              const person = displayPeople.find(
                p => p.id === contextMenu.personId
              )
              if (person) {
                handleAddOneOnOne(person.id, person.name)
              }
            }}
          >
            <Handshake className='w-4 h-4' />
            Add 1:1
          </button>
          <button
            className='w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors flex items-center gap-2'
            onClick={() => {
              setContextMenu(prev => ({ ...prev, visible: false }))
              setDeleteTargetId(contextMenu.personId)
              setShowDeleteModal(true)
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
          <div className='bg-popover text-popover-foreground border rounded-xl p-6 max-w-md w-full mx-4'>
            <h4 className='font-medium mb-4'>
              Add Feedback for {feedbackModal.personName}
            </h4>
            <FeedbackForm
              person={{
                id: feedbackModal.personId,
                name: feedbackModal.personName,
                birthday: null,
                email: null,
                role: null,
                avatar: null,
                organizationId: '',
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'active',
                teamId: null,
                managerId: null,
                jobRoleId: null,
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
          <div className='bg-popover text-popover-foreground border rounded-xl p-6 max-w-lg w-full mx-4'>
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

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteTargetId(null)
        }}
        onConfirm={() => {
          if (deleteTargetId) {
            return handleDeleteConfirm(deleteTargetId)
          }
        }}
        title='Delete Person'
        entityName='person'
      />
    </div>
  )
}
