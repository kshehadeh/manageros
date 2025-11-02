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
import { TeamAvatar } from './team-avatar'
import { Users, Target } from 'lucide-react'
import { deleteTeam } from '@/lib/actions/team'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { SimpleListContainer } from '@/components/common/simple-list-container'
import { SimpleListItem } from '@/components/common/simple-list-item'
import { SimpleListItemsContainer } from '@/components/common/simple-list-items-container'

export interface Team {
  id: string
  name: string
  description?: string | null
  avatar?: string | null
  updatedAt?: Date
  people?: Array<{
    id: string
    name: string
  }>
  initiatives?: Array<{
    id: string
    title: string
  }>
}

export interface TeamListProps {
  teams: Team[]
  title?: string
  variant?: 'compact' | 'full'
  showAddButton?: boolean
  addButtonHref?: string
  addButtonLabel?: string
  viewAllHref?: string
  viewAllLabel?: string
  emptyStateText?: string
  onTeamUpdate?: () => void
  className?: string
  immutableFilters?: Record<string, unknown>
  showDescription?: boolean
  showMembers?: boolean
  showInitiatives?: boolean
  showUpdatedAt?: boolean
}

export function SimpleTeamList({
  teams,
  variant = 'compact',
  emptyStateText = 'No teams found.',
  onTeamUpdate,
  className = '',
  immutableFilters,
  showDescription = true,
  showMembers = true,
  showInitiatives = true,
  showUpdatedAt = true,
}: TeamListProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const { handleButtonClick, ContextMenuComponent } = useDataTableContextMenu()

  const handleDeleteTeam = async () => {
    if (!deleteTargetId) return

    try {
      await deleteTeam(deleteTargetId)
      toast.success('Team deleted successfully')
      onTeamUpdate?.()
    } catch (error) {
      console.error('Error deleting team:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete team'
      )
    }
  }

  // Filter teams based on immutable filters
  const filterTeams = (teamsToFilter: Team[]) => {
    if (!immutableFilters || Object.keys(immutableFilters).length === 0) {
      return teamsToFilter
    }

    return teamsToFilter.filter(team => {
      return Object.entries(immutableFilters).every(([key, value]) => {
        switch (key) {
          case 'parentId':
            return (
              (team as unknown as Record<string, unknown>).parentId === value
            )
          case 'organizationId':
            return (
              (team as unknown as Record<string, unknown>).organizationId ===
              value
            )
          default:
            // For any other filters, try to match against team properties
            return (team as unknown as Record<string, unknown>)[key] === value
        }
      })
    })
  }

  // Apply filters to teams
  const visibleTeams = filterTeams(teams)

  const renderTeamItem = (team: Team) => {
    const memberCount = team.people?.length || 0
    const initiativeCount = team.initiatives?.length || 0

    const subheaderItems: React.ReactNode[] = []

    if (showDescription && team.description && variant === 'full') {
      subheaderItems.push(
        <span key='description' className='truncate'>
          {team.description}
        </span>
      )
    }

    if (showMembers) {
      subheaderItems.push(
        <span key='members' className='flex items-center gap-1'>
          <Users className='h-3 w-3' />
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </span>
      )
    }

    if (showInitiatives) {
      subheaderItems.push(
        <span key='initiatives' className='flex items-center gap-1'>
          <Target className='h-3 w-3' />
          {initiativeCount}{' '}
          {initiativeCount === 1 ? 'initiative' : 'initiatives'}
        </span>
      )
    }

    if (showUpdatedAt && team.updatedAt) {
      subheaderItems.push(
        <span key='updated'>
          Updated {formatDistanceToNow(team.updatedAt, { addSuffix: true })}
        </span>
      )
    }

    return (
      <SimpleListItem key={team.id}>
        <Link
          href={`/teams/${team.id}`}
          className='flex items-start gap-3 flex-1 min-w-0'
        >
          <TeamAvatar
            name={team.name}
            avatar={team.avatar}
            size='sm'
            className='shrink-0'
          />
          <div className='flex-1 min-w-0'>
            <h3 className='font-medium text-sm truncate mb-1'>{team.name}</h3>

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
          onClick={e => handleButtonClick(e, team.id)}
        >
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </SimpleListItem>
    )
  }

  return (
    <>
      <SimpleListContainer className={className}>
        <SimpleListItemsContainer
          isEmpty={visibleTeams.length === 0}
          emptyStateText={emptyStateText}
        >
          {visibleTeams.map(renderTeamItem)}
        </SimpleListItemsContainer>
      </SimpleListContainer>

      {/* Context Menu */}
      <ContextMenuComponent>
        {({ entityId, close }) => {
          const team = teams.find(t => t.id === entityId)
          if (!team) return null

          return (
            <>
              <ViewDetailsMenuItem
                entityId={entityId}
                entityType='teams'
                close={close}
              />
              <EditMenuItem
                entityId={entityId}
                entityType='teams'
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
        onConfirm={handleDeleteTeam}
        title='Delete Team'
        entityName='team'
      />
    </>
  )
}
