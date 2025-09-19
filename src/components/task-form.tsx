'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createTask, updateTask } from '@/lib/actions'
import { type TaskFormData } from '@/lib/validations'
import { Person, Initiative, Objective } from '@prisma/client'

interface TaskFormProps {
  people: Person[]
  initiatives: Initiative[]
  objectives: Objective[]
  preselectedAssigneeId?: string
  preselectedInitiativeId?: string
  preselectedObjectiveId?: string
  initialData?: Partial<TaskFormData>
  isEditing?: boolean
  taskId?: string
}

export function TaskForm({
  people,
  initiatives,
  objectives,
  preselectedAssigneeId,
  preselectedInitiativeId,
  preselectedObjectiveId,
  initialData,
  isEditing = false,
  taskId,
}: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedInitiativeId, setSelectedInitiativeId] = useState(
    preselectedInitiativeId || initialData?.initiativeId || ''
  )

  // Filter objectives based on selected initiative
  const availableObjectives = selectedInitiativeId
    ? objectives.filter(obj => obj.initiativeId === selectedInitiativeId)
    : []

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)

    try {
      const data: TaskFormData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        assigneeId: formData.get('assigneeId') as string,
        status: ((formData.get('status') as string) || 'todo') as
          | 'todo'
          | 'doing'
          | 'blocked'
          | 'done'
          | 'dropped',
        priority: parseInt(formData.get('priority') as string) || 2,
        estimate: formData.get('estimate')
          ? parseInt(formData.get('estimate') as string)
          : undefined,
        dueDate: formData.get('dueDate') as string,
        initiativeId: formData.get('initiativeId') as string,
        objectiveId: formData.get('objectiveId') as string,
      }

      if (isEditing && taskId) {
        await updateTask(taskId, data)
      } else {
        await createTask(data)
      }
    } catch (error) {
      console.error('Error submitting task:', error)
      alert('Error submitting task. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form action={handleSubmit} className='space-y-6'>
      <div className='space-y-4'>
        <div>
          <label htmlFor='title' className='block text-sm font-medium mb-2'>
            Task Title *
          </label>
          <input
            type='text'
            id='title'
            name='title'
            required
            defaultValue={initialData?.title || ''}
            className='w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Enter task title'
          />
        </div>

        <div>
          <label
            htmlFor='description'
            className='block text-sm font-medium mb-2'
          >
            Description
          </label>
          <textarea
            id='description'
            name='description'
            rows={3}
            defaultValue={initialData?.description || ''}
            className='w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Enter task description'
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label
              htmlFor='assigneeId'
              className='block text-sm font-medium mb-2'
            >
              Assignee
            </label>
            <select
              id='assigneeId'
              name='assigneeId'
              defaultValue={
                preselectedAssigneeId || initialData?.assigneeId || ''
              }
              className='w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value=''>Select assignee</option>
              {people.map(person => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor='status' className='block text-sm font-medium mb-2'>
              Status
            </label>
            <select
              id='status'
              name='status'
              defaultValue={initialData?.status || 'todo'}
              className='w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='todo'>To Do</option>
              <option value='doing'>Doing</option>
              <option value='blocked'>Blocked</option>
              <option value='done'>Done</option>
              <option value='dropped'>Dropped</option>
            </select>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label
              htmlFor='priority'
              className='block text-sm font-medium mb-2'
            >
              Priority
            </label>
            <select
              id='priority'
              name='priority'
              defaultValue={initialData?.priority || 2}
              className='w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value={1}>1 - Highest</option>
              <option value={2}>2 - High</option>
              <option value={3}>3 - Medium</option>
              <option value={4}>4 - Low</option>
              <option value={5}>5 - Lowest</option>
            </select>
          </div>

          <div>
            <label
              htmlFor='estimate'
              className='block text-sm font-medium mb-2'
            >
              Estimate (hours)
            </label>
            <input
              type='number'
              id='estimate'
              name='estimate'
              min='0'
              step='0.5'
              defaultValue={initialData?.estimate || ''}
              className='w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Hours'
            />
          </div>

          <div>
            <label htmlFor='dueDate' className='block text-sm font-medium mb-2'>
              Due Date
            </label>
            <input
              type='date'
              id='dueDate'
              name='dueDate'
              defaultValue={initialData?.dueDate || ''}
              className='w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label
              htmlFor='initiativeId'
              className='block text-sm font-medium mb-2'
            >
              Initiative
            </label>
            <select
              id='initiativeId'
              name='initiativeId'
              value={selectedInitiativeId}
              onChange={e => {
                setSelectedInitiativeId(e.target.value)
              }}
              className='w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value=''>Select initiative (optional)</option>
              {initiatives.map(initiative => (
                <option key={initiative.id} value={initiative.id}>
                  {initiative.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor='objectiveId'
              className='block text-sm font-medium mb-2'
            >
              Objective
            </label>
            <select
              id='objectiveId'
              name='objectiveId'
              defaultValue={
                preselectedObjectiveId || initialData?.objectiveId || ''
              }
              disabled={!selectedInitiativeId}
              className='w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <option value=''>Select objective (optional)</option>
              {availableObjectives.map(objective => (
                <option key={objective.id} value={objective.id}>
                  {objective.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className='flex items-center gap-3'>
        <Button type='submit' disabled={isSubmitting} variant='outline'>
          {isSubmitting
            ? 'Saving...'
            : isEditing
              ? 'Update Task'
              : 'Create Task'}
        </Button>
        <Button asChild variant='outline'>
          <Link href='/tasks'>Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
