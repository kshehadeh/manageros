'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useDataTableContextMenu } from '@/components/common/data-table-context-menu'
import {
  ViewDetailsMenuItem,
  EditMenuItem,
  DeleteMenuItem,
} from '@/components/common/context-menu-items'
import { DeleteModal } from '@/components/common/delete-modal'
import { PersonAvatar } from './person-avatar'
import type { Person } from '@/types/person'
import { deletePerson } from '@/lib/actions/person'
import { toast } from 'sonner'
import { SimpleListContainer } from '@/components/common/simple-list-container'
import { SimpleListItem } from '@/components/common/simple-list-item'
import { SimpleListItemsContainer } from '@/components/common/simple-list-items-container'

export interface PersonListProps {
  people: Person[]
  variant?: 'compact' | 'full'
  emptyStateText?: string
  onPersonUpdate?: () => void
  className?: string
  immutableFilters?: Record<string, unknown>
  showEmail?: boolean
  showRole?: boolean
  showTeam?: boolean
  showJobRole?: boolean
  showManager?: boolean
  showReportsCount?: boolean
  customSubtextMap?: Record<string, string | React.ReactNode>
}

export function SimplePeopleList({
  people,
  variant = 'compact',
  emptyStateText = 'No people found.',
  onPersonUpdate,
  className = '',
  immutableFilters,
  showEmail = true,
  showRole = true,
  showTeam = true,
  showJobRole = true,
  showManager = true,
  showReportsCount = true,
  customSubtextMap,
}: PersonListProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const { handleButtonClick, ContextMenuComponent } = useDataTableContextMenu()

  const handleDeletePerson = async () => {
    if (!deleteTargetId) return

    try {
      await deletePerson(deleteTargetId)
      toast.success('Person deleted successfully')
      onPersonUpdate?.()
    } catch (error) {
      console.error('Error deleting person:', error)
      toast.error('Failed to delete person')
    }
  }

  // Filter people based on immutable filters
  const filterPeople = (peopleToFilter: Person[]) => {
    if (!immutableFilters || Object.keys(immutableFilters).length === 0) {
      return peopleToFilter
    }

    return peopleToFilter.filter(person => {
      return Object.entries(immutableFilters).every(([key, value]) => {
        switch (key) {
          case 'teamId':
            return person.team?.id === value
          case 'managerId':
            return person.manager?.id === value
          case 'status':
            if (Array.isArray(value)) {
              return value.includes(person.status)
            }
            return person.status === value
          case 'jobRoleId':
            return person.jobRole?.id === value
          default:
            // For any other filters, try to match against person properties
            return (person as unknown as Record<string, unknown>)[key] === value
        }
      })
    })
  }

  // Apply filters to people
  const visiblePeople = filterPeople(people)

  const renderPersonItem = (person: Person) => {
    const subheaderItems: React.ReactNode[] = []

    // Custom subtext takes precedence and is added first if provided
    if (customSubtextMap && customSubtextMap[person.id]) {
      subheaderItems.push(
        <span key='custom' className='truncate'>
          {customSubtextMap[person.id]}
        </span>
      )
    }

    if (showRole && person.role) {
      subheaderItems.push(
        <span key='role' className='truncate'>
          {person.role}
        </span>
      )
    }

    if (showTeam && person.team && variant === 'compact') {
      subheaderItems.push(
        <span key='team' className='truncate'>
          {person.team.name}
        </span>
      )
    }

    if (showJobRole && variant === 'full' && person.jobRole) {
      subheaderItems.push(
        <span key='jobRole' className='truncate'>
          {person.jobRole.title}
        </span>
      )
    }

    if (showManager && variant === 'full' && person.manager) {
      subheaderItems.push(
        <span key='manager' className='truncate'>
          Manager: {person.manager.name}
        </span>
      )
    }

    if (showReportsCount && person.reports && person.reports.length > 0) {
      subheaderItems.push(
        <span key='reports'>{person.reports.length} reports</span>
      )
    }

    if (showEmail) {
      subheaderItems.push(<span key='email'>{person.email || 'No email'}</span>)
    }

    return (
      <SimpleListItem key={person.id}>
        <Link
          href={`/people/${person.id}`}
          className='flex items-start gap-3 flex-1 min-w-0'
        >
          <PersonAvatar
            name={person.name}
            avatar={person.avatar}
            size='sm'
            className='shrink-0'
          />
          <div className='flex-1 min-w-0'>
            <h3 className='font-medium text-sm truncate mb-1'>{person.name}</h3>

            {subheaderItems.length > 0 && (
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                {subheaderItems.map((item, index) => (
                  <React.Fragment key={index}>
                    {item}
                    {index < subheaderItems.length - 1 && <span>•</span>}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </Link>

        <Button
          variant='ghost'
          size='sm'
          className='h-8 w-8 p-0 hover:bg-muted shrink-0'
          onClick={e => handleButtonClick(e, person.id)}
        >
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </SimpleListItem>
    )
  }

  return (
    <>
      <SimpleListContainer withSection={false} className={className}>
        <SimpleListItemsContainer
          isEmpty={visiblePeople.length === 0}
          emptyStateText={emptyStateText}
        >
          {visiblePeople.map(renderPersonItem)}
        </SimpleListItemsContainer>
      </SimpleListContainer>

      {/* Context Menu */}
      <ContextMenuComponent>
        {({ entityId, close }) => {
          const person = people.find(p => p.id === entityId)
          if (!person) return null

          return (
            <>
              <ViewDetailsMenuItem
                entityId={entityId}
                entityType='people'
                close={close}
              />
              <EditMenuItem
                entityId={entityId}
                entityType='people'
                close={close}
              />
              <DeleteMenuItem
                onDelete={() => {
                  setDeleteTargetId(entityId)
                  setShowDeleteModal(true)
                }}
                close={close}
              />
            </>
          )
        }}
      </ContextMenuComponent>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteTargetId(null)
        }}
        onConfirm={handleDeletePerson}
        title='Delete Person'
        entityName='person'
      />
    </>
  )
}
