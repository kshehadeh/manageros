'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Edit2, Users } from 'lucide-react'
import { updateInitiativeTeam } from '@/lib/actions/initiative'
import { toast } from 'sonner'

interface Team {
  id: string
  name: string
}

interface ChangeTeamModalProps {
  initiativeId: string
  currentTeam: Team | null
  teams: Team[]
}

export function ChangeTeamModal({
  initiativeId,
  currentTeam,
  teams,
}: ChangeTeamModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState(
    currentTeam?.id || 'none'
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const teamId = selectedTeamId === 'none' ? null : selectedTeamId
      await updateInitiativeTeam(initiativeId, teamId)

      toast.success('Team updated successfully')
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to update team:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to update team'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset to current team when closing
      setSelectedTeamId(currentTeam?.id || 'none')
    }
    setIsOpen(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
          <Edit2 className='h-3 w-3' />
        </Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Change Team
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='team'>Team</Label>
            <Select
              value={selectedTeamId}
              onValueChange={setSelectedTeamId}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select a team' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>No team assigned</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Team'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
