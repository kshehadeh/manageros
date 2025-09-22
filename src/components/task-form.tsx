'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createTask, updateTask } from '@/lib/actions'
import { type TaskFormData } from '@/lib/validations'
import { Person, Initiative, Objective } from '@prisma/client'
import {
  type TaskStatus,
  taskStatusUtils,
  DEFAULT_TASK_STATUS,
} from '@/lib/task-status'

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
        status: ((formData.get('status') as string) ||
          DEFAULT_TASK_STATUS) as TaskStatus,
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
          <Input
            type='text'
            id='title'
            name='title'
            required
            defaultValue={initialData?.title || ''}
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
          <Textarea
            id='description'
            name='description'
            rows={3}
            defaultValue={initialData?.description || ''}
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
              className='input'
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
              defaultValue={initialData?.status || DEFAULT_TASK_STATUS}
              className='input'
            >
              {taskStatusUtils.getSelectOptions().map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
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
              className='input'
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
            <Input
              type='number'
              id='estimate'
              name='estimate'
              min='0'
              step='0.5'
              defaultValue={initialData?.estimate || ''}
              placeholder='Hours'
            />
          </div>

          <div>
            <label htmlFor='dueDate' className='block text-sm font-medium mb-2'>
              Due Date
            </label>
            <Input
              type='date'
              id='dueDate'
              name='dueDate'
              defaultValue={initialData?.dueDate || ''}
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
              className='input'
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
              className='input'
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
