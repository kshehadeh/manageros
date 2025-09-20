import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

export default {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        badge: {
          success: 'hsl(var(--badge-success))',
          'success-foreground': 'hsl(var(--badge-success-foreground))',
          'success-text': 'hsl(var(--badge-success-text))',
          warning: 'hsl(var(--badge-warning))',
          'warning-foreground': 'hsl(var(--badge-warning-foreground))',
          'warning-text': 'hsl(var(--badge-warning-text))',
          error: 'hsl(var(--badge-error))',
          'error-foreground': 'hsl(var(--badge-error-foreground))',
          'error-text': 'hsl(var(--badge-error-text))',
          info: 'hsl(var(--badge-info))',
          'info-foreground': 'hsl(var(--badge-info-foreground))',
          'info-text': 'hsl(var(--badge-info-text))',
          neutral: 'hsl(var(--badge-neutral))',
          'neutral-foreground': 'hsl(var(--badge-neutral-foreground))',
          'neutral-text': 'hsl(var(--badge-neutral-text))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [animate],
} satisfies Config
