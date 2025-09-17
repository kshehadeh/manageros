'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { FeedbackForm } from './feedback-form'
import { type Person, type Team } from '@prisma/client'
import {
  Plus,
  FileText,
  CheckSquare,
  Calendar,
  MessageSquare,
  BarChart3,
  ChevronDown,
} from 'lucide-react'

interface PersonActionPanelProps {
  person: Person & {
    team?: Team | null
    reports?: Person[]
    manager?: Person | null
  }
  currentPerson?: Person | null
  isAdmin: boolean
  onFeedbackAdded?: () => void
}

export function PersonActionPanel({
  person,
  currentPerson,
  isAdmin,
  onFeedbackAdded,
}: PersonActionPanelProps) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleFeedbackSuccess = () => {
    setShowFeedbackForm(false)
    onFeedbackAdded?.()
  }

  const handleFeedbackCancel = () => {
    setShowFeedbackForm(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  // Determine if current user can create a 1:1 with this person
  const canCreateOneOnOne =
    // Current user is viewing their own profile and has reports
    (currentPerson?.id === person.id && (person.reports?.length ?? 0) > 0) ||
    // Current user is viewing their manager's profile
    currentPerson?.managerId === person.id ||
    // Current user is viewing one of their reports' profiles
    person.managerId === currentPerson?.id

  return (
    <>
      {/* Actions Dropdown */}
      <div className='relative' ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className='btn text-sm flex items-center gap-2'
        >
          <span>Actions</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isDropdownOpen && (
          <div className='absolute top-full right-0 mt-2 bg-neutral-800 border border-neutral-700 rounded-xl shadow-lg z-10 min-w-48'>
            <div className='py-2'>
              {/* Add Report - Only show if current user is admin */}
              {isAdmin && (
                <Link
                  href={`/people/new?managerId=${person.id}`}
                  className='flex items-center gap-3 px-4 py-2 text-sm hover:bg-neutral-700 transition-colors'
                  onClick={() => setIsDropdownOpen(false)}
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
                  className='flex items-center gap-3 px-4 py-2 text-sm hover:bg-neutral-700 transition-colors'
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <FileText className='w-4 h-4' />
                  New Initiative
                </Link>
              )}

              {/* New Task - Only show if current user is admin */}
              {isAdmin && (
                <Link
                  href='/initiatives/new'
                  className='flex items-center gap-3 px-4 py-2 text-sm hover:bg-neutral-700 transition-colors'
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <CheckSquare className='w-4 h-4' />
                  New Task
                </Link>
              )}

              {/* Add Feedback - Show for all users */}
              {!showFeedbackForm ? (
                <button
                  onClick={() => {
                    setShowFeedbackForm(true)
                    setIsDropdownOpen(false)
                  }}
                  className='w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-neutral-700 transition-colors text-left'
                >
                  <MessageSquare className='w-4 h-4' />
                  Add Feedback
                </button>
              ) : null}

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
                  className='flex items-center gap-3 px-4 py-2 text-sm hover:bg-neutral-700 transition-colors'
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <Calendar className='w-4 h-4' />
                  Add a 1:1
                </Link>
              )}

              {/* View All Initiatives - Show for all users */}
              <Link
                href='/initiatives'
                className='flex items-center gap-3 px-4 py-2 text-sm hover:bg-neutral-700 transition-colors'
                onClick={() => setIsDropdownOpen(false)}
              >
                <BarChart3 className='w-4 h-4' />
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
