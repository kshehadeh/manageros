import type { Appearance } from '@clerk/types'

/**
 * Global Clerk component appearance configuration
 * This is applied to all Clerk components via ClerkProvider
 * Uses ManagerOS CSS variables to inherit from the site's theme system
 * Reference: https://clerk.com/docs/guides/customizing-clerk/appearance-prop/variables
 */
export const clerkAppearance: Appearance = {
  variables: {
    // Core colors - inherit from ManagerOS theme
    colorBackground: 'transparent',
    colorForeground: 'var(--color-foreground)',

    colorPrimary: 'var(--color-primary)',
    colorPrimaryForeground: 'var(--color-primary-foreground)',

    colorMuted: 'transparent',

    spacing: 'var(--spacing-xl)',

    // Input colors
    colorInput: 'var(--color-input)',
    colorInputForeground: 'var(--color-foreground)',
    colorInputBackground: 'var(--color-card)',

    fontFamilyButtons: 'var(--font-geist-mono)',
    fontFamily: 'var(--font-geist-mono)',

    // Text colors
    colorMutedForeground: 'var(--color-muted-foreground)',

    // State colors
    colorDanger: 'var(--color-destructive)',
    colorSuccess: 'var(--color-badge-success)',
    colorWarning: 'var(--color-badge-warning)',
    colorNeutral: 'var(--color-muted)',

    // Border and ring
    colorBorder: 'var(--color-border)',
    colorRing: 'var(--color-ring)',

    // Border radius - using ManagerOS radius tokens
    borderRadius: 'var(--radius-md)',
  },
  elements: {
    // Layout adjustments
    rootBox: 'mx-auto',
  },
}
