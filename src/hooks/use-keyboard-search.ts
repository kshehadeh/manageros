import { useEffect, useState, useCallback } from 'react'

interface KeyboardSearchOptions<T> {
  items: T[]
  getItemText: (_item: T) => string
  onSelect: (_item: T) => void
  isOpen: boolean
  searchTimeoutMs?: number
}

export function useKeyboardSearch<T>({
  items,
  getItemText,
  onSelect,
  isOpen,
  searchTimeoutMs = 1000,
}: KeyboardSearchOptions<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  )

  // Filter items based on search query
  const filteredItems = items.filter((item: T) => {
    if (!searchQuery) return true
    return getItemText(item).toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Clear search query after timeout
  const clearSearch = useCallback(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    const timeout = setTimeout(() => {
      setSearchQuery('')
    }, searchTimeoutMs)
    setSearchTimeout(timeout)
  }, [searchTimeout, searchTimeoutMs])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      // Only handle printable characters
      if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault()

        // Clear existing timeout
        if (searchTimeout) {
          clearTimeout(searchTimeout)
        }

        // Update search query
        const newQuery = searchQuery + event.key
        setSearchQuery(newQuery)

        // Find first matching item
        const matchingItem = items.find(item =>
          getItemText(item).toLowerCase().startsWith(newQuery.toLowerCase())
        )

        if (matchingItem) {
          onSelect(matchingItem)
        }

        // Clear search query after timeout
        clearSearch()
      }

      // Handle backspace
      if (event.key === 'Backspace' && searchQuery) {
        event.preventDefault()
        const newQuery = searchQuery.slice(0, -1)
        setSearchQuery(newQuery)

        if (newQuery) {
          const matchingItem = items.find(item =>
            getItemText(item).toLowerCase().startsWith(newQuery.toLowerCase())
          )
          if (matchingItem) {
            onSelect(matchingItem)
          }
        }

        // Clear timeout and set new one
        clearSearch()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [
    isOpen,
    searchQuery,
    items,
    getItemText,
    onSelect,
    searchTimeout,
    clearSearch,
  ])

  return {
    searchQuery,
    filteredItems,
  }
}
