'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { MeetingInstanceTable } from '@/components/meetings/meeting-instance-table'
import { MeetingInstanceForm } from '@/components/meetings/meeting-instance-form'
import { MeetingInstance, Person } from '@prisma/client'
import { Plus, Calendar } from 'lucide-react'

type MeetingInstanceWithRelations = MeetingInstance & {
  participants: {
    id: string
    personId: string
    status: string
    createdAt: Date
    updatedAt: Date
    meetingInstanceId: string
    person: Person
  }[]
}

interface MeetingInstanceListProps {
  instances: MeetingInstanceWithRelations[]
  meetingId: string
  parentParticipants?: Array<{
    personId: string
    status: string
  }>
}

export function MeetingInstanceList({
  instances,
  meetingId,
  parentParticipants = [],
}: MeetingInstanceListProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSuccess = () => {
    setOpen(false)
    router.refresh() // Refresh the page data
  }

  // Transform parent participants to initial data format (reset status to invited)
  const initialParticipants = parentParticipants.map(p => ({
    personId: p.personId,
    status: 'invited' as const,
  }))

  return (
    <div className='space-y-6'>
      <SectionHeader
        icon={Calendar}
        title='Meeting Instances'
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className='flex items-center gap-2'>
                <Plus className='h-4 w-4' />
                Add Instance
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-2xl'>
              <DialogHeader>
                <DialogTitle>Create New Instance</DialogTitle>
              </DialogHeader>
              <MeetingInstanceForm
                meetingId={meetingId}
                initialData={{ participants: initialParticipants }}
                onSuccess={handleSuccess}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {instances.length === 0 ? (
        <div className='text-center py-8'>
          <Calendar className='h-8 w-8 text-muted-foreground mx-auto mb-2' />
          <p className='text-sm text-muted-foreground mb-4'>
            No meeting instances yet
          </p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className='flex items-center gap-2'>
                <Plus className='h-4 w-4' />
                Create First Instance
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-2xl'>
              <DialogHeader>
                <DialogTitle>Create New Instance</DialogTitle>
              </DialogHeader>
              <MeetingInstanceForm
                meetingId={meetingId}
                initialData={{ participants: initialParticipants }}
                onSuccess={handleSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <MeetingInstanceTable instances={instances} meetingId={meetingId} />
      )}
    </div>
  )
}
