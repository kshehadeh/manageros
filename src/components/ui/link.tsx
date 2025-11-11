import NextLink from 'next/link'
import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

/**
 * Custom Link component that automatically applies highlight color on hover.
 * Wraps Next.js Link and adds hover:text-highlight to the className.
 *
 * You can override the hover color by passing a className that includes a different hover:text-* class.
 *
 * @example
 * <Link href="/people/123">John Doe</Link>
 * <Link href="/teams/456" className="font-bold">My Team</Link>
 */
export function Link({ className, ...props }: ComponentProps<typeof NextLink>) {
  return (
    <NextLink
      className={cn('hover:text-highlight transition-colors', className)}
      {...props}
    />
  )
}

/**
 * ExternalLink component for anchor tags that open in new tabs.
 * Automatically applies highlight color on hover and includes security attributes.
 *
 * @example
 * <ExternalLink href="https://example.com">External Site</ExternalLink>
 */
export function ExternalLink({
  className,
  target = '_blank',
  rel = 'noopener noreferrer',
  ...props
}: ComponentProps<'a'>) {
  return (
    <a
      className={cn('hover:text-highlight transition-colors', className)}
      target={target}
      rel={rel}
      {...props}
    />
  )
}
