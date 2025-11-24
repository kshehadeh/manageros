'use client'

import { useState, useEffect } from 'react'
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
import { getTeams } from '@/lib/actions/team'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Team {
  id: string
  name: string
}

interface ChangeTeamModalProps {
  initiativeId: string
  currentTeam: Team | null
}

export function ChangeTeamModal({
  initiativeId,
  currentTeam,
}: ChangeTeamModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState(
    currentTeam?.id || 'none'
  )

  // Fetch teams when dialog opens
  useEffect(() => {
    if (isOpen && teams.length === 0) {
      setIsLoadingTeams(true)
      getTeams()
        .then(fetchedTeams => {
          setTeams(fetchedTeams)
        })
        .catch(error => {
          console.error('Failed to fetch teams:', error)
          toast.error('Failed to load teams')
        })
        .finally(() => {
          setIsLoadingTeams(false)
        })
    }
  }, [isOpen, teams.length])

  // Sync selectedTeamId when currentTeam prop changes (only when dialog is closed)
  useEffect(() => {
    if (!isOpen) {
      setSelectedTeamId(currentTeam?.id || 'none')
    }
  }, [currentTeam, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const teamId = selectedTeamId === 'none' ? null : selectedTeamId
      await updateInitiativeTeam(initiativeId, teamId)

      toast.success('Team updated successfully')
      setIsOpen(false)
      router.refresh()
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
        <Button variant='default' size='sm'>
          <Edit2 className='h-4 w-4 mr-2' />
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent>
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
              disabled={isLoading || isLoadingTeams}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingTeams ? 'Loading teams...' : 'Select a team'
                  }
                />
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
