'use client'

import {
  useState,
  useTransition,
  useEffect,
  useMemo,
  useOptimistic,
} from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Check,
  X,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  User as UserIcon,
  Calendar,
  Target,
  Flag,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge, BadgeVariant } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  updateTaskStatus,
  deleteTask,
  updateTaskTitle,
  updateTaskAssignee,
  updateTaskPriority,
} from '@/lib/actions/task'
import {
  taskStatusUtils,
  type TaskStatus,
  TASK_STATUS,
  ALL_TASK_STATUSES,
} from '@/lib/task-status'
import {
  taskPriorityUtils,
  type TaskPriority,
  ALL_TASK_PRIORITIES,
} from '@/lib/task-priority'
import { toast } from 'sonner'
import type { Person, Initiative } from '@prisma/client'
import type { TaskListItem } from '@/lib/task-list-select'
import { TaskQuickEditDialog } from '@/components/tasks/task-quick-edit-dialog'
import { DeleteModal } from '@/components/common/delete-modal'

interface FilterState {
  keyword: string
  assigneeId: string
  initiativeId: string
  status: string
  priority: string
  dateRange: string
  startDate: string
  endDate: string
}

interface TaskTableProps {
  tasks: TaskListItem[]
  people: Person[]
  initiatives?: Initiative[]
  showInitiative?: boolean
  showDueDate?: boolean
  hideFilters?: boolean
  onTaskUpdate?: () => void
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  taskId: string
  triggerType: 'rightClick' | 'button'
}

interface EditingState {
  [taskId: string]: {
    field: 'title' | 'assignee' | 'status' | 'priority' | null
    value: string | number | null
  }
}

interface SortState {
  column: string | null
  direction: 'asc' | 'desc'
}

export function TaskTable({
  tasks,
  people,
  initiatives = [],
  showInitiative = true,
  hideFilters = false,
  onTaskUpdate,
}: TaskTableProps) {
  const [_isPending, startTransition] = useTransition()
  const router = useRouter()
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    taskId: '',
    triggerType: 'rightClick',
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<EditingState>({})
  const [optimisticTasks, addOptimisticTask] = useOptimistic(
    tasks,
    (
      state,
      optimisticUpdate: {
        type: string
        taskId: string
        data: Partial<TaskListItem>
      }
    ) => {
      return state.map(task =>
        task.id === optimisticUpdate.taskId
          ? { ...task, ...optimisticUpdate.data }
          : task
      )
    }
  )
  const [filters, setFilters] = useState<FilterState>({
    keyword: '',
    assigneeId: 'all',
    initiativeId: 'all',
    status: 'all',
    priority: 'all',
    dateRange: 'all',
    startDate: '',
    endDate: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [sorting, setSorting] = useState<SortState>({
    column: null,
    direction: 'asc',
  })
  const [quickEditDialog, setQuickEditDialog] = useState<{
    open: boolean
    taskId: string | null
  }>({
    open: false,
    taskId: null,
  })

  // Handle column sorting
  const handleSort = (column: string) => {
    setSorting(prev => {
      if (prev.column === column) {
        // If clicking the same column, toggle direction
        return {
          column,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        }
      } else {
        // If clicking a different column, set to ascending
        return {
          column,
          direction: 'asc',
        }
      }
    })
  }

  // Get sort icon for column header
  const getSortIcon = (column: string) => {
    if (sorting.column !== column) {
      return <ArrowUpDown className='h-4 w-4 text-muted-foreground' />
    }
    return sorting.direction === 'asc' ? (
      <ArrowUp className='h-4 w-4 text-primary' />
    ) : (
      <ArrowDown className='h-4 w-4 text-primary' />
    )
  }

  // Filter and sort tasks based on current filter and sort state
  const filteredTasks = useMemo(() => {
    if (hideFilters) {
      return optimisticTasks
    }

    return optimisticTasks.filter(task => {
      // Keyword filter (searches title and description)
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase()
        const titleMatch = task.title.toLowerCase().includes(keyword)
        const descriptionMatch =
          task.description?.toLowerCase().includes(keyword) || false
        if (!titleMatch && !descriptionMatch) return false
      }

      // Assignee filter
      if (filters.assigneeId && filters.assigneeId !== 'all') {
        if (filters.assigneeId === 'unassigned') {
          if (task.assigneeId) return false
        } else if (task.assigneeId !== filters.assigneeId) {
          return false
        }
      }

      // Initiative filter
      if (filters.initiativeId && filters.initiativeId !== 'all') {
        if (filters.initiativeId === 'no-initiative') {
          if (task.initiativeId) return false
        } else if (task.initiativeId !== filters.initiativeId) {
          return false
        }
      }

      // Status filter
      if (
        filters.status &&
        filters.status !== 'all' &&
        task.status !== filters.status
      ) {
        return false
      }

      // Priority filter
      if (
        filters.priority &&
        filters.priority !== 'all' &&
        task.priority.toString() !== filters.priority
      ) {
        return false
      }

      // Date range filter
      if (filters.dateRange && filters.dateRange !== 'all') {
        const taskDate = new Date(task.createdAt)
        const now = new Date()

        switch (filters.dateRange) {
          case 'today': {
            const today = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            )
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
            if (taskDate < today || taskDate >= tomorrow) return false
            break
          }
          case 'this-week': {
            const startOfWeek = new Date(now)
            startOfWeek.setDate(now.getDate() - now.getDay())
            startOfWeek.setHours(0, 0, 0, 0)
            if (taskDate < startOfWeek) return false
            break
          }
          case 'this-month': {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            if (taskDate < startOfMonth) return false
            break
          }
          case 'last-30-days': {
            const thirtyDaysAgo = new Date(
              now.getTime() - 30 * 24 * 60 * 60 * 1000
            )
            if (taskDate < thirtyDaysAgo) return false
            break
          }
          case 'custom': {
            if (filters.startDate) {
              const startDate = new Date(filters.startDate)
              startDate.setHours(0, 0, 0, 0)
              if (taskDate < startDate) return false
            }
            if (filters.endDate) {
              const endDate = new Date(filters.endDate)
              endDate.setHours(23, 59, 59, 999)
              if (taskDate > endDate) return false
            }
            break
          }
        }
      }

      return true
    })
  }, [optimisticTasks, hideFilters, filters])

  const visibleTasks = useMemo(() => {
    if (!sorting.column) {
      return filteredTasks
    }

    return [...filteredTasks].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sorting.column) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'assignee':
          aValue = a.assignee?.name?.toLowerCase() || ''
          bValue = b.assignee?.name?.toLowerCase() || ''
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'priority':
          aValue = a.priority
          bValue = b.priority
          break
        case 'dueDate':
          aValue = a.dueDate
            ? new Date(a.dueDate).getTime()
            : Number.MAX_SAFE_INTEGER
          bValue = b.dueDate
            ? new Date(b.dueDate).getTime()
            : Number.MAX_SAFE_INTEGER
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'initiative':
          aValue = a.initiative?.title?.toLowerCase() || ''
          bValue = b.initiative?.title?.toLowerCase() || ''
          break
        default:
          return 0
      }

      if (aValue < bValue) {
        return sorting.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sorting.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [filteredTasks, sorting])

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

  const handleTaskComplete = async (
    taskId: string,
    currentStatus: TaskStatus
  ) => {
    const newStatus =
      currentStatus === TASK_STATUS.DONE ? TASK_STATUS.TODO : TASK_STATUS.DONE

    // Optimistic update
    addOptimisticTask({
      type: 'update-status',
      taskId,
      data: { status: newStatus },
    })

    setUpdatingTasks(prev => new Set(prev).add(taskId))

    try {
      await updateTaskStatus(taskId, newStatus)
      toast.success(
        newStatus === TASK_STATUS.DONE
          ? 'Task marked as complete'
          : 'Task marked as incomplete'
      )
      if (onTaskUpdate) {
        onTaskUpdate()
      }
    } catch (error) {
      console.error('Failed to update task status:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to update task status'
      )
    } finally {
      setUpdatingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  const handleDeleteConfirm = async (taskId: string) => {
    startTransition(async () => {
      try {
        await deleteTask(taskId)
        toast.success('Task deleted successfully')
        if (onTaskUpdate) {
          onTaskUpdate()
        }
      } catch (error) {
        console.error('Failed to delete task:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete task'
        )
      }
    })
  }

  const handleEditStart = (
    taskId: string,
    field: 'title' | 'assignee' | 'status' | 'priority',
    currentValue: string | number | null
  ) => {
    setEditing(prev => ({
      ...prev,
      [taskId]: { field, value: currentValue },
    }))
  }

  const handleEditCancel = (taskId: string) => {
    setEditing(prev => {
      const newState = { ...prev }
      delete newState[taskId]
      return newState
    })
  }

  const handleEditSave = async (taskId: string) => {
    const editState = editing[taskId]
    if (!editState?.field) return

    // Prepare optimistic update data
    const optimisticData: Partial<TaskListItem> = {}
    switch (editState.field) {
      case 'title':
        optimisticData.title = editState.value as string
        break
      case 'assignee':
        optimisticData.assigneeId = editState.value as string | null
        optimisticData.assignee = editState.value
          ? people.find(p => p.id === editState.value) || null
          : null
        break
      case 'status':
        optimisticData.status = editState.value as TaskStatus
        break
      case 'priority':
        optimisticData.priority = editState.value as number
        break
    }

    // Optimistic update
    addOptimisticTask({
      type: 'update-field',
      taskId,
      data: optimisticData,
    })

    setUpdatingTasks(prev => new Set(prev).add(taskId))

    try {
      switch (editState.field) {
        case 'title':
          await updateTaskTitle(taskId, editState.value as string)
          break
        case 'assignee':
          await updateTaskAssignee(taskId, editState.value as string | null)
          break
        case 'status':
          await updateTaskStatus(taskId, editState.value as TaskStatus)
          break
        case 'priority':
          await updateTaskPriority(taskId, editState.value as number)
          break
      }

      toast.success('Task updated successfully')
      if (onTaskUpdate) {
        onTaskUpdate()
      }
    } catch (error) {
      console.error('Failed to update task:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to update task'
      )
    } finally {
      setUpdatingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
      handleEditCancel(taskId)
    }
  }

  const handleRowDoubleClick = (taskId: string) => {
    // Don't navigate if any field is being edited
    if (editing[taskId]?.field) {
      return
    }
    router.push(`/tasks/${taskId}`)
  }

  const handleRowRightClick = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      taskId,
      triggerType: 'rightClick',
    })
  }

  const handleButtonClick = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setContextMenu({
      visible: true,
      x: rect.right - 160, // Position menu to the left of the button
      y: rect.bottom + 4, // Position menu below the button
      taskId,
      triggerType: 'button',
    })
  }

  const handleQuickEdit = (taskId: string) => {
    setQuickEditDialog({
      open: true,
      taskId,
    })
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  const getPriorityVariant = (priority: number) => {
    return taskPriorityUtils.getVariant(priority as TaskPriority)
  }

  const getPriorityLabel = (priority: number) => {
    return taskPriorityUtils.getLabel(priority as TaskPriority)
  }

  if (optimisticTasks.length === 0) {
    return (
      <div className='text-muted-foreground text-sm text-center py-8'>
        No tasks yet.
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {/* Filter Controls */}
      {!hideFilters && (
        <div>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 transition-all duration-200 ${
                  showFilters
                    ? 'rounded-b-none border-b-0 bg-background'
                    : 'rounded-lg'
                }`}
              >
                <Filter className='h-4 w-4' />
                Filters
                {Object.values(filters).some(
                  filter => filter !== '' && filter !== 'all'
                ) && <div className='h-2 w-2 bg-primary rounded-full' />}
              </Button>
            </div>
            <div className='text-sm text-muted-foreground'>
              Showing {filteredTasks.length} of {optimisticTasks.length} tasks
            </div>
          </div>

          {showFilters && (
            <div className='border border-t-0 rounded-b-lg rounded-t-none p-4 bg-muted/30'>
              <div>
                <div
                  className={`grid gap-4 md:grid-cols-2 ${showInitiative ? 'lg:grid-cols-6' : 'lg:grid-cols-5'}`}
                >
                  {/* Keyword Search */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Search</label>
                    <div className='relative'>
                      <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                      <Input
                        placeholder='Search tasks...'
                        value={filters.keyword}
                        onChange={e =>
                          setFilters(prev => ({
                            ...prev,
                            keyword: e.target.value,
                          }))
                        }
                        className='pl-8'
                      />
                    </div>
                  </div>

                  {/* Assignee Filter */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Assignee</label>
                    <Select
                      value={filters.assigneeId}
                      onValueChange={value =>
                        setFilters(prev => ({ ...prev, assigneeId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='All assignees' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All assignees</SelectItem>
                        <SelectItem value='unassigned'>Unassigned</SelectItem>
                        {people.map(person => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Initiative Filter - Only show when not already filtered by initiative */}
                  {showInitiative && (
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>Initiative</label>
                      <Select
                        value={filters.initiativeId}
                        onValueChange={value =>
                          setFilters(prev => ({ ...prev, initiativeId: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='All initiatives' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='all'>All initiatives</SelectItem>
                          <SelectItem value='no-initiative'>
                            No initiative
                          </SelectItem>
                          {initiatives.map(initiative => (
                            <SelectItem
                              key={initiative.id}
                              value={initiative.id}
                            >
                              {initiative.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Status Filter */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Status</label>
                    <Select
                      value={filters.status}
                      onValueChange={value =>
                        setFilters(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='All statuses' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All statuses</SelectItem>
                        {ALL_TASK_STATUSES.map(status => (
                          <SelectItem key={status} value={status}>
                            {taskStatusUtils.getLabel(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority Filter */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Priority</label>
                    <Select
                      value={filters.priority}
                      onValueChange={value =>
                        setFilters(prev => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='All priorities' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All priorities</SelectItem>
                        {ALL_TASK_PRIORITIES.map(priority => (
                          <SelectItem
                            key={priority}
                            value={priority.toString()}
                          >
                            {taskPriorityUtils.getLabel(priority)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range Filter */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Date Range</label>
                    <Select
                      value={filters.dateRange}
                      onValueChange={value =>
                        setFilters(prev => ({ ...prev, dateRange: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='All dates' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All dates</SelectItem>
                        <SelectItem value='today'>Today</SelectItem>
                        <SelectItem value='this-week'>This week</SelectItem>
                        <SelectItem value='this-month'>This month</SelectItem>
                        <SelectItem value='last-30-days'>
                          Last 30 days
                        </SelectItem>
                        <SelectItem value='custom'>Custom range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Custom Date Range Inputs */}
                {filters.dateRange === 'custom' && (
                  <div className='grid gap-4 md:grid-cols-2 mt-4'>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>Start Date</label>
                      <Input
                        type='date'
                        value={filters.startDate}
                        onChange={e =>
                          setFilters(prev => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>End Date</label>
                      <Input
                        type='date'
                        value={filters.endDate}
                        onChange={e =>
                          setFilters(prev => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Clear Filters Button */}
                <div className='flex justify-end mt-4'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setFilters({
                        keyword: '',
                        assigneeId: 'all',
                        initiativeId: 'all',
                        status: 'all',
                        priority: 'all',
                        dateRange: 'all',
                        startDate: '',
                        endDate: '',
                      })
                    }
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task Table */}
      <div className='md:rounded-md md:border'>
        <Table>
          <TableHeader className='md:[&_tr]:border-b'>
            <TableRow className='hover:bg-accent/50 md:border-b'>
              <TableHead className='w-4 text-muted-foreground text-center'>
                <Check className='h-4 w-4' />
              </TableHead>
              <TableHead
                className='text-muted-foreground cursor-pointer hover:text-foreground select-none w-full'
                onClick={() => handleSort('title')}
              >
                <div className='flex items-center gap-2'>
                  Summary
                  {getSortIcon('title')}
                </div>
              </TableHead>
              <TableHead
                className='hidden md:table-cell text-muted-foreground cursor-pointer hover:text-foreground select-none'
                onClick={() => handleSort('status')}
              >
                <div className='flex items-center gap-2'>
                  Status
                  {getSortIcon('status')}
                </div>
              </TableHead>
              <TableHead className='hidden md:table-cell text-muted-foreground w-[50px]'>
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className='md:[&_tr:last-child]:border-0'>
            {visibleTasks.map(task => {
              const isUpdating = updatingTasks.has(task.id)
              const isCompleted = task.status === TASK_STATUS.DONE
              const isEditing = editing[task.id]
              const editField = isEditing?.field
              const editValue = isEditing?.value

              return (
                <TableRow
                  key={task.id}
                  className={`hover:bg-accent/50 cursor-pointer md:border-b ${
                    isCompleted ? 'opacity-75' : ''
                  }`}
                  onDoubleClick={() => handleRowDoubleClick(task.id)}
                  onContextMenu={e => handleRowRightClick(e, task.id)}
                >
                  <TableCell className='py-4 pl-3 text-left w-4 align-top'>
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() =>
                        handleTaskComplete(task.id, task.status as TaskStatus)
                      }
                      disabled={isUpdating}
                      className='data-[state=checked]:bg-primary data-[state=checked]:border-primary'
                    />
                  </TableCell>
                  <TableCell className='font-medium text-foreground py-2 px-1'>
                    {editField === 'title' ? (
                      <div className='flex items-center gap-2'>
                        <Input
                          value={editValue as string}
                          onChange={e =>
                            setEditing(prev => ({
                              ...prev,
                              [task.id]: {
                                field: 'title',
                                value: e.target.value,
                              },
                            }))
                          }
                          className='h-8'
                          autoFocus
                        />
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => handleEditSave(task.id)}
                          disabled={isUpdating}
                        >
                          <Check className='w-4 h-4' />
                        </Button>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => handleEditCancel(task.id)}
                        >
                          <X className='w-4 h-4' />
                        </Button>
                      </div>
                    ) : (
                      <div className='space-y-0.5'>
                        <div
                          className={`${isCompleted ? 'line-through text-muted-foreground' : ''} cursor-pointer hover:bg-accent/50 p-1 rounded`}
                          onClick={() =>
                            handleEditStart(task.id, 'title', task.title)
                          }
                        >
                          {task.title}
                        </div>
                        {/* Task details with icons on same line */}
                        <div className='text-xs text-muted-foreground mt-1.5 flex items-center gap-2 flex-wrap'>
                          {task.assignee && (
                            <div className='flex items-center gap-1'>
                              <UserIcon className='h-3 w-3' />
                              <Link
                                href={`/people/${task.assignee.id}`}
                                className='text-primary hover:text-primary/80 transition-colors'
                                onClick={e => e.stopPropagation()}
                              >
                                {task.assignee.name}
                              </Link>
                            </div>
                          )}
                          <div className='flex items-center gap-1'>
                            <Flag className='h-3 w-3' />
                            <Badge
                              variant={
                                getPriorityVariant(
                                  task.priority
                                ) as BadgeVariant
                              }
                              className='text-xs px-1 py-0'
                            >
                              {getPriorityLabel(task.priority)}
                            </Badge>
                          </div>
                          {task.dueDate && (
                            <div className='flex items-center gap-1'>
                              <Calendar className='h-3 w-3' />
                              <span>
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {showInitiative && task.initiative && (
                            <div className='flex items-center gap-1'>
                              <Target className='h-3 w-3' />
                              <Link
                                href={`/initiatives/${task.initiative.id}`}
                                className='text-primary hover:text-primary/80 transition-colors'
                                onClick={e => e.stopPropagation()}
                              >
                                {task.initiative.title}
                              </Link>
                            </div>
                          )}
                          {/* Mobile status badge - show on mobile when status column is hidden */}
                          <div className='md:hidden flex items-center gap-1'>
                            <Badge
                              variant={taskStatusUtils.getUIVariant(
                                task.status as TaskStatus
                              )}
                              className='text-xs px-1 py-0'
                            >
                              {taskStatusUtils.getLabel(
                                task.status as TaskStatus
                              )}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className='hidden md:table-cell text-muted-foreground py-2 px-2'>
                    {editField === 'status' ? (
                      <div className='flex items-center gap-2'>
                        <Select
                          value={editValue as string}
                          onValueChange={value =>
                            setEditing(prev => ({
                              ...prev,
                              [task.id]: { field: 'status', value },
                            }))
                          }
                        >
                          <SelectTrigger className='h-8'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_TASK_STATUSES.map(status => (
                              <SelectItem key={status} value={status}>
                                {taskStatusUtils.getLabel(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => handleEditSave(task.id)}
                          disabled={isUpdating}
                        >
                          <Check className='w-4 h-4' />
                        </Button>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => handleEditCancel(task.id)}
                        >
                          <X className='w-4 h-4' />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className='cursor-pointer hover:bg-accent/50 p-1 rounded'
                        onClick={() =>
                          handleEditStart(task.id, 'status', task.status)
                        }
                      >
                        <Badge
                          variant={taskStatusUtils.getUIVariant(
                            task.status as TaskStatus
                          )}
                        >
                          {taskStatusUtils.getLabel(task.status as TaskStatus)}
                        </Badge>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className='hidden md:table-cell py-2 px-2'>
                    <Button
                      variant='ghost'
                      className='h-8 w-8 p-0'
                      onClick={e => handleButtonClick(e, task.id)}
                      disabled={isUpdating}
                    >
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
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
                router.push(`/tasks/${contextMenu.taskId}`)
                setContextMenu(prev => ({ ...prev, visible: false }))
              }}
            >
              <Eye className='w-4 h-4' />
              View
            </button>
            <button
              className='w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2'
              onClick={() => {
                handleQuickEdit(contextMenu.taskId)
              }}
            >
              <Edit className='w-4 h-4' />
              Quick Edit
            </button>
            <button
              className='w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors flex items-center gap-2'
              onClick={() => {
                setContextMenu(prev => ({ ...prev, visible: false }))
                setDeleteTargetId(contextMenu.taskId)
                setShowDeleteModal(true)
              }}
            >
              <Trash2 className='w-4 h-4' />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Quick Edit Dialog */}
      {quickEditDialog.open &&
        quickEditDialog.taskId &&
        (() => {
          const task = optimisticTasks.find(
            t => t.id === quickEditDialog.taskId
          )!
          return (
            <TaskQuickEditDialog
              open={quickEditDialog.open}
              onOpenChange={open => setQuickEditDialog({ open, taskId: null })}
              task={{
                id: task.id,
                title: task.title,
                description: task.description,
                assigneeId: task.assigneeId,
                dueDate: task.dueDate,
                priority: task.priority,
                status: task.status as TaskStatus,
              }}
              people={people}
              onTaskUpdate={onTaskUpdate}
            />
          )
        })()}

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
        title='Delete Task'
        entityName='task'
      />
    </div>
  )
}
