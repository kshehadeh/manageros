'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { MeetingInstanceForm } from '@/components/meeting-instance-form'
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
  instanceId,
  meetingTitle,
  people,
  initialData,
  meetingInstanceId,
}: MeetingInstanceEditClientProps) {
  const router = useRouter()

  const handleSuccess = () => {
    // Navigate back to the meeting instance detail page
    router.push(`/meetings/${meetingId}/instances/${instanceId}`)
  }

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
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  )
}
