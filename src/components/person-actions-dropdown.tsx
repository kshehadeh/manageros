'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { FeedbackForm } from './feedback-form'
import { type Person, type Team } from '@prisma/client'
import {
  Plus,
  Rocket,
  ListTodo,
  MessageCircle,
  Handshake,
  Eye,
  MoreHorizontal,
  Edit,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PersonActionsDropdownProps {
  person: Person & {
    team?: Team | null
    reports?: Person[]
    manager?: Person | null
  }
  currentPerson?: Person | null
  isAdmin: boolean
  onFeedbackAdded?: () => void
  size?: 'sm' | 'default'
}

export function PersonActionsDropdown({
  person,
  currentPerson,
  isAdmin,
  onFeedbackAdded,
  size = 'default',
}: PersonActionsDropdownProps) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleFeedbackSuccess = () => {
    setShowFeedbackForm(false)
    onFeedbackAdded?.()
  }

  const handleFeedbackCancel = () => {
    setShowFeedbackForm(false)
  }

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenDropdown(!openDropdown)
  }

  const closeDropdown = () => {
    setOpenDropdown(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(false)
      }
    }

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  // Determine if current user can create a 1:1 with this person
  const canCreateOneOnOne =
    // Current user is viewing their own profile and has reports
    (currentPerson?.id === person.id && (person.reports?.length ?? 0) > 0) ||
    // Current user is viewing their manager's profile
    currentPerson?.managerId === person.id ||
    // Current user is viewing one of their reports' profiles
    person.managerId === currentPerson?.id

  // Determine if current user can create feedback campaigns for this person
  // Only managers (direct or indirect) can create feedback campaigns
  const canCreateFeedbackCampaign =
    // Current user is viewing one of their reports' profiles (direct manager)
    person.managerId === currentPerson?.id ||
    // Current user is viewing their own profile and has reports (can create for reports)
    (currentPerson?.id === person.id && (person.reports?.length ?? 0) > 0)

  return (
    <>
      {/* Actions Dropdown */}
      <div className='relative' ref={dropdownRef}>
        <Button
          variant='ghost'
          size={size}
          className={`${size === 'sm' ? 'h-8 w-8 p-0' : 'h-8 w-8 p-0'}`}
          onClick={handleDropdownClick}
        >
          <MoreHorizontal className='h-4 w-4' />
        </Button>

        {openDropdown && (
          <div
            className='absolute top-full right-0 mt-2 bg-popover text-popover-foreground border rounded-md shadow-lg z-10 min-w-48'
            onClick={e => e.stopPropagation()}
          >
            <div className='py-1'>
              {/* Edit - Only show if current user is admin */}
              {isAdmin && (
                <Link
                  href={`/people/${person.id}/edit`}
                  className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                  onClick={closeDropdown}
                >
                  <Edit className='w-4 h-4' />
                  Edit
                </Link>
              )}

              {/* Add Report - Only show if current user is admin */}
              {isAdmin && (
                <Link
                  href={`/people/new?managerId=${person.id}`}
                  className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                  onClick={closeDropdown}
                >
                  <Plus className='w-4 h-4' />
                  Add Report
                </Link>
              )}

              {/* New Initiative - Only show if current user is admin */}
              {isAdmin && (
                <Link
                  href={`/initiatives/new?ownerId=${person.id}${
                    person.team ? `&teamId=${person.team.id}` : ''
                  }`}
                  className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                  onClick={closeDropdown}
                >
                  <Rocket className='w-4 h-4' />
                  New Initiative
                </Link>
              )}

              {/* New Task - Only show if current user is admin */}
              {isAdmin && (
                <Link
                  href='/initiatives/new'
                  className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                  onClick={closeDropdown}
                >
                  <ListTodo className='w-4 h-4' />
                  New Task
                </Link>
              )}

              {/* Add Feedback - Show for all users */}
              {!showFeedbackForm && (
                <button
                  className='w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left'
                  onClick={() => {
                    setShowFeedbackForm(true)
                    closeDropdown()
                  }}
                >
                  <MessageCircle className='w-4 h-4' />
                  Add Feedback
                </button>
              )}

              {/* Add a 1:1 - Show if current user can create a meeting with this person */}
              {canCreateOneOnOne && (
                <Link
                  href={`/oneonones/new?managerId=${
                    // If viewing own profile, current user is the manager
                    currentPerson?.id === person.id
                      ? currentPerson.id
                      : person.id
                  }&reportId=${
                    // If viewing own profile, no report pre-filled (user will select)
                    // If viewing manager's profile, current user is the report
                    // If viewing report's profile, the report is the report
                    currentPerson?.id === person.id
                      ? ''
                      : currentPerson?.managerId === person.id
                        ? currentPerson?.id
                        : person.id
                  }`}
                  className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                  onClick={closeDropdown}
                >
                  <Handshake className='w-4 h-4' />
                  Add a 1:1
                </Link>
              )}

              {/* Feedback Campaigns - Show if current user can create campaigns for this person */}
              {canCreateFeedbackCampaign && (
                <Link
                  href={`/people/${person.id}/feedback-campaigns`}
                  className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                  onClick={closeDropdown}
                >
                  <MessageCircle className='w-4 h-4' />
                  Feedback Campaigns
                </Link>
              )}

              {/* View All Initiatives - Show for all users */}
              <Link
                href='/initiatives'
                className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors'
                onClick={closeDropdown}
              >
                <Eye className='w-4 h-4' />
                View All Initiatives
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Form - Show as modal when active */}
      {showFeedbackForm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-neutral-800 border border-neutral-700 rounded-xl p-6 max-w-md w-full mx-4'>
            <h4 className='font-medium mb-4'>Add New Feedback</h4>
            <FeedbackForm
              person={person}
              onSuccess={handleFeedbackSuccess}
              onCancel={handleFeedbackCancel}
            />
          </div>
        </div>
      )}
    </>
  )
}
