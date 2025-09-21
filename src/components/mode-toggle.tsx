'use client'

import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/hooks/use-theme'
import { useEffect, useState } from 'react'

export function ModeToggle() {
  const { theme, setTheme, isLoaded } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted || !isLoaded) return null

  const isDark = theme === 'dark'

  return (
    <Button
      variant='outline'
      size='icon'
      aria-label='Toggle theme'
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
