'use client'

import { useState } from 'react'
import { MeetingList, type Meeting } from '@/components/meetings/meeting-list'
import { getMeetingsForInitiative } from '@/lib/actions/meeting'

interface MeetingListWithDataProps {
  initiativeId: string
  meetings: Meeting[]
  currentTeam?: { id: string; name: string } | null
}

export function MeetingListWithData({
  initiativeId,
  meetings: initialMeetings,
  currentTeam,
}: MeetingListWithDataProps) {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings)

  const handleMeetingUpdate = async () => {
    try {
      // Fetch updated meetings for this initiative
      const updatedMeetings = await getMeetingsForInitiative(initiativeId)
      setMeetings(updatedMeetings)
    } catch (error) {
      console.error('Error fetching updated meetings:', error)
      // Fallback to page reload if API fails
      window.location.reload()
    }
  }

  return (
    <MeetingList
      meetings={meetings}
      title='Meetings'
      variant='full'
      showAddButton={true}
      initiativeId={initiativeId}
      emptyStateText='No meetings found for this initiative.'
      onMeetingUpdate={handleMeetingUpdate}
      immutableFilters={{ initiativeId }}
      currentTeam={currentTeam}
    />
  )
}
