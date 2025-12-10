'use client'

import React from 'react'
import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import type { ColumnDef } from '@tanstack/react-table'
import type { NoteWithAttachments } from '@/types/notes'
import { format, formatDistanceToNow } from 'date-fns'
import { deleteNote } from '@/lib/actions/notes'
import type { DataTableConfig } from '@/components/common/generic-data-table'
import {
  DeleteMenuItem,
  ContextMenuItem,
} from '@/components/common/context-menu-items'
import { toast } from 'sonner'
import { useNotes } from '@/hooks/use-notes'
import { useNotesTableSettings } from '@/hooks/use-notes-table-settings'
import { MoreHorizontal, Edit } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { MultiSelect } from '@/components/ui/multi-select'
import type { MultiSelectOption } from '@/components/ui/multi-select'

type NoteFilters = {
  search?: string
  entityType?: string[]
}

const ENTITY_TYPE_OPTIONS: MultiSelectOption[] = [
  { value: 'Initiative', label: 'Initiative' },
  { value: 'Task', label: 'Task' },
  { value: 'Meeting', label: 'Meeting' },
  { value: 'MeetingInstance', label: 'Meeting Instance' },
  { value: 'Person', label: 'Person' },
  { value: 'Standalone', label: 'Standalone' },
]

function NoteFilterContent({
  settings,
  updateFilters,
}: {
  settings: { filters: NoteFilters } & Record<string, unknown>
  updateFilters: (filters: Partial<NoteFilters>) => void
}) {
  return (
    <div className='space-y-3'>
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Entity Type</label>
        <MultiSelect
          options={ENTITY_TYPE_OPTIONS}
          selected={
            Array.isArray(settings.filters.entityType)
              ? settings.filters.entityType
              : settings.filters.entityType
                ? [settings.filters.entityType]
                : []
          }
          onChange={selected => updateFilters({ entityType: selected })}
          placeholder='All types'
        />
      </div>
    </div>
  )
}

function getEntityTypeLabel(entityType: string | null | undefined): string {
  if (!entityType) return 'Standalone'
  return entityType
}

function getEntityLink(
  entityType: string | null | undefined,
  entityId: string | null | undefined
): string | null {
  if (!entityType || !entityId) return null

  const basePath = entityType.toLowerCase()
  if (entityType === 'MeetingInstance') {
    // MeetingInstance needs special handling - we'd need the meeting ID
    // For now, return null as we'd need more context
    return null
  }
  return `/${basePath}s/${entityId}`
}

export const notesDataTableConfig: DataTableConfig<
  NoteWithAttachments,
  NoteFilters
> = {
  entityType: 'note',
  entityName: 'Note',
  entityNamePlural: 'Notes',

  useDataHook: useNotes,

  useSettingsHook: useNotesTableSettings,

  columnProps: {},

  onRowClick: (router, noteId) => {
    router.push(`/notes/${noteId}`)
  },

  deleteAction: async (noteId: string) => {
    await deleteNote({ id: noteId })
    toast.success('Note deleted successfully')
  },

  createColumns: ({ onButtonClick }) => {
    return [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => {
          const note = row.original
          return (
            <div className='space-y-0.5 flex-1'>
              <Link
                href={`/notes/${note.id}`}
                className='font-medium text-primary hover:text-highlight/90 transition-colors'
                onClick={e => e.stopPropagation()}
              >
                {note.title || 'Untitled'}
              </Link>
              <div className='text-xs text-muted-foreground flex items-center gap-2'>
                <span className='truncate'>
                  {getEntityTypeLabel(note.entityType)}
                </span>
                <span>•</span>
                <span className='truncate'>{note.createdBy.name}</span>
                <span>•</span>
                <span>
                  Updated{' '}
                  {formatDistanceToNow(new Date(note.updatedAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          )
        },
        size: 400,
        minSize: 200,
        maxSize: 600,
      },
      {
        id: 'entityType',
        header: 'Entity',
        accessorFn: row => getEntityTypeLabel(row.entityType),
        cell: ({ row }) => {
          const note = row.original
          const entityLink = getEntityLink(note.entityType, note.entityId)
          const label = getEntityTypeLabel(note.entityType)

          if (entityLink) {
            return (
              <Link
                href={entityLink}
                className='text-primary hover:text-highlight/90 transition-colors'
                onClick={e => e.stopPropagation()}
              >
                {label}
              </Link>
            )
          }

          return <span className='text-muted-foreground'>{label}</span>
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
        meta: {
          hidden: true,
        },
      },
      {
        id: 'createdBy',
        header: 'Creator',
        accessorFn: row => row.createdBy.name,
        cell: ({ row }) => {
          const note = row.original
          return (
            <Link
              href={`/people/${note.createdBy.id}`}
              className='text-primary hover:text-highlight/90 transition-colors'
              onClick={e => e.stopPropagation()}
            >
              {note.createdBy.name}
            </Link>
          )
        },
        size: 200,
        minSize: 150,
        maxSize: 300,
        meta: {
          hidden: true,
        },
      },
      {
        id: 'updatedAt',
        header: 'Last Updated',
        accessorKey: 'updatedAt',
        cell: ({ row }) => {
          const note = row.original
          return (
            <span className='text-muted-foreground'>
              {format(new Date(note.updatedAt), 'MMM dd, yyyy h:mm a')}
            </span>
          )
        },
        size: 200,
        minSize: 150,
        maxSize: 250,
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.original.updatedAt).getTime()
          const dateB = new Date(rowB.original.updatedAt).getTime()
          return dateA - dateB
        },
        meta: {
          hidden: true,
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const note = row.original
          return (
            <div className='flex items-center justify-end'>
              <Button
                variant='ghost'
                size='sm'
                onClick={e => {
                  e.stopPropagation()
                  onButtonClick(e, note.id)
                }}
              >
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </div>
          )
        },
        size: 50,
        minSize: 50,
        maxSize: 50,
        enableSorting: false,
        enableHiding: false,
        meta: {
          hidden: false,
        },
      },
    ] as ColumnDef<NoteWithAttachments>[]
  },

  searchPlaceholder: 'Search notes...',
  emptyMessage: 'No notes found',
  loadingMessage: 'Loading notes...',

  groupingOptions: [
    { value: 'none', label: 'None' },
    { value: 'entityType', label: 'Entity Type' },
    { value: 'createdBy', label: 'Creator' },
  ],

  getGroupLabel: (groupValue: string, groupingColumn: string) => {
    if (groupingColumn === 'entityType') {
      return getEntityTypeLabel(groupValue)
    }
    return groupValue
  },

  sortOptions: [
    { value: 'updatedAt:desc', label: 'Last Updated (Newest)' },
    { value: 'updatedAt:asc', label: 'Last Updated (Oldest)' },
    { value: 'createdAt:desc', label: 'Created (Newest)' },
    { value: 'createdAt:asc', label: 'Created (Oldest)' },
    { value: 'title:asc', label: 'Title (A-Z)' },
    { value: 'title:desc', label: 'Title (Z-A)' },
  ],

  filterContent: ({ settings, updateFilters }) => (
    <NoteFilterContent settings={settings} updateFilters={updateFilters} />
  ),

  hasActiveFiltersFn: filters => {
    return (
      Boolean(filters.search && filters.search !== '') ||
      Boolean(filters.entityType && filters.entityType.length > 0)
    )
  },

  clearFiltersFn: () => ({
    search: '',
    entityType: undefined,
  }),

  contextMenuItems: ({ entityId, close, onDelete }) => {
    const NotesContextMenuItems = () => {
      const router = useRouter()

      const handleEdit = () => {
        router.push(`/notes/${entityId}`)
        close()
      }

      return (
        <>
          <ContextMenuItem
            onClick={handleEdit}
            icon={<Edit className='h-4 w-4' />}
          >
            Edit
          </ContextMenuItem>
          <DeleteMenuItem onDelete={onDelete} close={close} />
        </>
      )
    }

    return <NotesContextMenuItems />
  },
}
