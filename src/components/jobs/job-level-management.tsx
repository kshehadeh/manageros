'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'

import {
  type JobLevelFormData,
  createJobLevel,
  updateJobLevel,
  updateJobLevelOrder,
  deleteJobLevel,
} from '@/lib/actions/job-roles'
import { GripVertical, Edit2, Trash2 } from 'lucide-react'

interface JobLevel {
  id: string
  name: string
  order: number
  createdAt: Date
  updatedAt: Date
}

interface JobLevelManagementProps {
  levels: JobLevel[]
}

interface SortableItemProps {
  level: JobLevel
  editingId: string | null
  formData: JobLevelFormData
  isSubmitting: boolean
  onEdit: (_level: JobLevel) => void
  onDelete: (_id: string) => void
  onSubmit: (_e: React.FormEvent, _id?: string) => void
  onCancel: () => void
  onFormDataChange: (_data: JobLevelFormData) => void
}

function SortableItem({
  level,
  editingId,
  formData,
  isSubmitting,
  onEdit,
  onDelete,
  onSubmit,
  onCancel,
  onFormDataChange,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: level.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-2 transition-all bg-background hover:bg-muted/50 ${isDragging ? 'shadow-lg' : ''}`}
    >
      {editingId === level.id ? (
        // Edit Form
        <form onSubmit={e => onSubmit(e, level.id)} className='space-y-2'>
          <div>
            <label className='block text-sm font-medium mb-1'>Level Name</label>
            <input
              type='text'
              value={formData.name}
              onChange={e =>
                onFormDataChange({ ...formData, name: e.target.value })
              }
              className='input'
              required
            />
          </div>
          <div className='flex gap-2'>
            <Button
              type='submit'
              size='sm'
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting ? 'Updating...' : 'Update'}
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        // Display Mode
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div
              {...attributes}
              {...listeners}
              className='text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing'
              style={{ touchAction: 'none' }}
            >
              <GripVertical className='h-4 w-4' />
            </div>
            <div>
              <span className='font-medium text-sm'>{level.name}</span>
              <span className='text-xs text-muted-foreground ml-2'>
                #{level.order}
              </span>
            </div>
          </div>
          <div className='flex gap-1'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => onEdit(level)}
              className='h-8 w-8 p-0'
              title='Edit level'
            >
              <Edit2 className='h-3 w-3' />
            </Button>
            <Button
              size='sm'
              variant='destructive'
              onClick={() => onDelete(level.id)}
              className='h-8 w-8 p-0'
              title='Delete level'
            >
              <Trash2 className='h-3 w-3' />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function JobLevelManagement({ levels }: JobLevelManagementProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<JobLevelFormData>({
    name: '',
    order: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localLevels, setLocalLevels] = useState<JobLevel[]>(levels)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Update local levels when props change
  useEffect(() => {
    setLocalLevels(levels)
  }, [levels])

  const handleSubmit = async (e: React.FormEvent, id?: string) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (id) {
        await updateJobLevel(id, formData)
        setEditingId(null)
      } else {
        await createJobLevel(formData)
      }
      setFormData({ name: '', order: 0 })
    } catch (error) {
      console.error('Error submitting job level:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (level: JobLevel) => {
    setEditingId(level.id)
    setFormData({ name: level.name, order: level.order })
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({ name: '', order: 0 })
  }

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this job level? This action cannot be undone.'
      )
    ) {
      return
    }

    try {
      await deleteJobLevel(id)
    } catch (error) {
      console.error('Error deleting job level:', error)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = localLevels.findIndex(item => item.id === active.id)
      const newIndex = localLevels.findIndex(item => item.id === over?.id)

      const newLevels = arrayMove(localLevels, oldIndex, newIndex)
      setLocalLevels(newLevels)

      // Update order values
      const updatedLevels = newLevels.map((level, index) => ({
        id: level.id,
        order: index,
      }))

      try {
        await updateJobLevelOrder(updatedLevels)
        console.log('Successfully updated job level order')
      } catch (error) {
        console.error('Error updating job level order:', error)
        // Revert on error
        setLocalLevels(levels)
      }
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Job Levels</h3>
      </div>

      {/* Levels List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localLevels.map(level => level.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className='space-y-1'>
            {localLevels.length === 0 ? (
              <p className='text-muted-foreground text-center py-8'>
                No job levels configured. Add levels to organize job roles.
              </p>
            ) : (
              localLevels.map(level => (
                <SortableItem
                  key={level.id}
                  level={level}
                  editingId={editingId}
                  formData={formData}
                  isSubmitting={isSubmitting}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  onFormDataChange={setFormData}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      {localLevels.length > 1 && (
        <p className='text-sm text-muted-foreground'>
          💡 Drag and drop levels to reorder them. Lower numbers appear first in
          job role selections.
        </p>
      )}
    </div>
  )
}
