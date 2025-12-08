'use client'

import React from 'react'
import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'
import type { ColumnDef } from '@tanstack/react-table'
import type { NoteWithAttachments } from '@/types/notes'
import { format } from 'date-fns'
import { deleteStandaloneNote } from '@/lib/actions/notes'
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

type NoteFilters = {
  search?: string
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
    await deleteStandaloneNote({ id: noteId })
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
            <Link
              href={`/notes/${note.id}`}
              className='font-medium text-primary hover:text-highlight/90 transition-colors'
              onClick={e => e.stopPropagation()}
            >
              {note.title || 'Untitled'}
            </Link>
          )
        },
        size: 400,
        minSize: 200,
        maxSize: 600,
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
    { value: 'createdBy', label: 'Creator' },
  ],

  sortOptions: [
    { value: 'updatedAt:desc', label: 'Last Updated (Newest)' },
    { value: 'updatedAt:asc', label: 'Last Updated (Oldest)' },
    { value: 'createdAt:desc', label: 'Created (Newest)' },
    { value: 'createdAt:asc', label: 'Created (Oldest)' },
    { value: 'title:asc', label: 'Title (A-Z)' },
    { value: 'title:desc', label: 'Title (Z-A)' },
  ],

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
