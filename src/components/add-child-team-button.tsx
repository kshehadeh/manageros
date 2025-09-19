import Link from 'next/link'
import { Users, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AddChildTeamButtonProps {
  parentTeamId: string
  size?: 'sm' | 'default' | 'lg' | 'icon'
  variant?: 'default' | 'secondary' | 'outline'
  className?: string
}

export function AddChildTeamButton({
  parentTeamId,
  size = 'icon',
  variant = 'outline',
  className = '',
}: AddChildTeamButtonProps) {
  return (
    <Button asChild size={size} variant={variant} className={className}>
      <Link href={`/teams/new?parentId=${parentTeamId}`}>
        <Users className='w-4 h-4' />
        <Plus className='w-3 h-3' />
        <span className='sr-only'>Add Child Team</span>
      </Link>
    </Button>
  )
}
