'use client'

/**
 * Custom sign out function that ensures proper cleanup
 */
export async function signOutWithCleanup() {
  // Clear any user-specific settings from localStorage
  if (typeof window !== 'undefined') {
    // We can't access the user ID here since we're signing out,
    // but we can clear all user settings by clearing localStorage
    // This is a fallback - the main cleanup happens in the signOut callback
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('user-settings-')) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Failed to clear user settings during sign out:', error)
    }
  }
}
