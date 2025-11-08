import type { Appearance } from '@clerk/types'

/**
 * Global Clerk component appearance configuration
 * This is applied to all Clerk components via ClerkProvider
 */
export const clerkAppearance: Appearance = {
  elements: {
    rootBox: 'mx-auto',
    card: 'bg-transparent shadow-none',
    headerTitle: 'text-white',
    headerSubtitle: 'text-white/70',
    socialButtonsBlockButton:
      'bg-white/10 border-white/20 text-white hover:bg-white/20',
    formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    formFieldInput:
      'bg-white/10 border-white/20 text-white placeholder:text-white/50',
    formFieldLabel: 'text-white',
    footerActionLink: 'text-primary hover:text-primary/80',
    identityPreviewText: 'text-white',
    identityPreviewEditButton: 'text-white hover:text-white/80',
    formResendCodeLink: 'text-primary hover:text-primary/80',
  },
}
