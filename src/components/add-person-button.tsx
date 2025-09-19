import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AddPersonButtonProps {
  teamId: string
  size?: 'sm' | 'default' | 'lg' | 'icon'
  variant?: 'default' | 'secondary' | 'outline'
  className?: string
}

export function AddPersonButton({
  teamId,
  size = 'icon',
  variant = 'outline',
  className = '',
}: AddPersonButtonProps) {
  return (
    <Button asChild size={size} variant={variant} className={className}>
      <Link href={`/people/new?teamId=${teamId}`}>
        <UserPlus className='w-4 h-4' />
        <span className='sr-only'>Add Person</span>
      </Link>
    </Button>
  )
}
