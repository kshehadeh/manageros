'use client'

import React from 'react'
import { MeetingInstanceForm } from '@/components/meetings/meeting-instance-form'
import { Person } from '@prisma/client'
import { type MeetingInstanceFormData } from '@/lib/validations'

interface MeetingInstanceEditClientProps {
  meetingId: string
  instanceId: string
  meetingTitle: string
  people: Person[]
  initialData: Partial<MeetingInstanceFormData>
  meetingInstanceId: string
}

export function MeetingInstanceEditClient({
  meetingId,
  instanceId: _instanceId,
  meetingTitle,
  people,
  initialData,
  meetingInstanceId,
}: MeetingInstanceEditClientProps) {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold'>Edit Meeting Instance</h1>
        <p className='text-muted-foreground'>
          Update instance details for &ldquo;{meetingTitle}&rdquo;
        </p>
      </div>

      <div className='max-w-2xl'>
        <MeetingInstanceForm
          meetingId={meetingId}
          people={people}
          initialData={initialData}
          isEditing={true}
          instanceId={meetingInstanceId}
        />
      </div>
    </div>
  )
}
