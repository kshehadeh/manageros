import Link from 'next/link'
import { Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EditIconButtonProps {
  href: string
  size?: 'sm' | 'default' | 'lg' | 'icon'
  variant?: 'default' | 'secondary' | 'outline'
  className?: string
}

export function EditIconButton({
  href,
  size = 'icon',
  variant = 'outline',
  className = '',
}: EditIconButtonProps) {
  return (
    <Button asChild size={size} variant={variant} className={className}>
      <Link href={href}>
        <Edit className='w-4 h-4' />
        <span className='sr-only'>Edit</span>
      </Link>
    </Button>
  )
}
