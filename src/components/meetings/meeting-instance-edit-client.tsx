'use client'

import React from 'react'
import { MeetingInstanceForm } from '@/components/meetings/meeting-instance-form'
import { type MeetingInstanceFormData } from '@/lib/validations'

interface Participant {
  id: string
  personId: string
  status: string
  person: {
    id: string
    name: string
    avatar?: string | null
  }
}

interface MeetingInstanceEditClientProps {
  meetingId: string
  instanceId: string
  meetingTitle: string
  initialData: Partial<MeetingInstanceFormData>
  meetingInstanceId: string
  parentMeetingParticipants?: Participant[]
}

export function MeetingInstanceEditClient({
  meetingId,
  instanceId: _instanceId,
  meetingTitle,
  initialData,
  meetingInstanceId,
  parentMeetingParticipants,
}: MeetingInstanceEditClientProps) {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold'>Edit Meeting Instance</h1>
        <p className='text-muted-foreground'>
          Update instance details for &ldquo;{meetingTitle}&rdquo;
        </p>
      </div>

      <MeetingInstanceForm
        meetingId={meetingId}
        initialData={initialData}
        isEditing={true}
        instanceId={meetingInstanceId}
        parentMeetingParticipants={parentMeetingParticipants}
      />
    </div>
  )
}
