import { useEffect, useState, useRef } from 'react'

interface ViewportPosition {
  position: 'top' | 'bottom'
  maxHeight: number
}

export function useViewportPosition(
  isOpen: boolean,
  defaultMaxHeight: number = 300,
  padding: number = 16
): ViewportPosition & {
  triggerRef: React.RefObject<HTMLButtonElement | null>
} {
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom')
  const [maxHeight, setMaxHeight] = useState(defaultMaxHeight)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const calculatePosition = () => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top

        // Calculate available space
        const availableSpaceBelow = spaceBelow - padding
        const availableSpaceAbove = spaceAbove - padding

        // Determine position and max height
        if (
          availableSpaceAbove > availableSpaceBelow &&
          availableSpaceBelow < 200
        ) {
          setPosition('top')
          setMaxHeight(Math.min(defaultMaxHeight, availableSpaceAbove))
        } else {
          setPosition('bottom')
          setMaxHeight(Math.min(defaultMaxHeight, availableSpaceBelow))
        }
      }
    }

    calculatePosition()

    // Recalculate on window resize
    window.addEventListener('resize', calculatePosition)
    return () => window.removeEventListener('resize', calculatePosition)
  }, [isOpen, defaultMaxHeight, padding])

  return { position, maxHeight, triggerRef }
}
