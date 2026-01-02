'use client'

import {
  User,
  Users,
  Briefcase,
  Mail,
  ArrowUpRight,
  CalendarDays,
  Cake,
  BadgeCheck,
  Info,
} from 'lucide-react'
import {
  PropertiesSidebar,
  type PropertyItem,
} from '@/components/ui/properties-sidebar'
import { SectionHeader } from '@/components/ui/section-header'
import { Link } from '@/components/ui/link'
import { PersonStatusBadge } from './person-status-badge'

interface PersonPropertiesSidebarProps {
  person: {
    id: string
    name: string
    email: string | null
    role?: string | null
    status: string | null
    employeeType?: string | null
    startedAt?: Date | null
    birthday?: Date | null
    team?: {
      id: string
      name: string
    } | null
    manager?: {
      id: string
      name: string
    } | null
    jobRole?: {
      id: string
      title: string
    } | null
    reportsCount?: number
  }
  showHeader?: boolean
}

export function PersonPropertiesSidebar({
  person,
  showHeader = true,
}: PersonPropertiesSidebarProps) {
  const getEmployeeTypeLabel = (type: string) => {
    switch (type) {
      case 'FULL_TIME':
        return 'Full Time'
      case 'PART_TIME':
        return 'Part Time'
      case 'INTERN':
        return 'Intern'
      case 'CONSULTANT':
        return 'Consultant'
      default:
        return type
    }
  }

  const properties: PropertyItem[] = []

  // Status
  properties.push({
    key: 'status',
    label: 'Status',
    icon: BadgeCheck,
    value: <PersonStatusBadge status={person.status || 'active'} size='sm' />,
  })

  // Job Role
  if (person.jobRole?.title || person.role) {
    properties.push({
      key: 'role',
      label: 'Role',
      icon: Briefcase,
      value: person.jobRole ? (
        <Link
          href={`/job-roles/${person.jobRole.id}`}
          className='text-sm text-primary hover:underline'
        >
          {person.jobRole.title}
        </Link>
      ) : (
        <span className='text-sm'>{person.role}</span>
      ),
    })
  }

  // Team
  if (person.team) {
    properties.push({
      key: 'team',
      label: 'Team',
      icon: Users,
      value: (
        <Link
          href={`/teams/${person.team.id}`}
          className='text-sm text-primary hover:underline'
        >
          {person.team.name}
        </Link>
      ),
    })
  }

  // Employee Type
  if (person.employeeType) {
    properties.push({
      key: 'employeeType',
      label: 'Type',
      icon: User,
      value: (
        <span className='text-sm'>
          {getEmployeeTypeLabel(person.employeeType)}
        </span>
      ),
    })
  }

  // Email
  if (person.email) {
    properties.push({
      key: 'email',
      label: 'Email',
      icon: Mail,
      value: (
        <a
          href={`mailto:${person.email}`}
          className='text-sm text-primary hover:underline'
        >
          {person.email}
        </a>
      ),
    })
  }

  // Manager
  if (person.manager) {
    properties.push({
      key: 'manager',
      label: 'Manager',
      icon: ArrowUpRight,
      value: (
        <Link
          href={`/people/${person.manager.id}`}
          className='text-sm text-primary hover:underline'
        >
          {person.manager.name}
        </Link>
      ),
    })
  }

  // Direct Reports Count
  if (person.reportsCount !== undefined && person.reportsCount > 0) {
    properties.push({
      key: 'reports',
      label: 'Reports',
      icon: Users,
      value: (
        <span className='text-sm'>
          {person.reportsCount} direct report
          {person.reportsCount !== 1 ? 's' : ''}
        </span>
      ),
    })
  }

  // Start Date
  if (person.startedAt) {
    properties.push({
      key: 'startedAt',
      label: 'Started',
      icon: CalendarDays,
      value: (
        <span className='text-sm'>
          {new Date(person.startedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    })
  }

  // Birthday
  if (person.birthday) {
    properties.push({
      key: 'birthday',
      label: 'Birthday',
      icon: Cake,
      value: (
        <span className='text-sm'>
          {new Date(person.birthday).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    })
  }

  return (
    <div>
      {showHeader && <SectionHeader icon={Info} title='Details' />}
      <PropertiesSidebar properties={properties} />
    </div>
  )
}
