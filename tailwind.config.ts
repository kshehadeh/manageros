import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'
import typography from '@tailwindcss/typography'

export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        card: {
          DEFAULT: 'var(--color-card)',
          foreground: 'var(--color-card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--color-popover)',
          foreground: 'var(--color-popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: 'var(--color-secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: 'var(--color-accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)',
          foreground: 'var(--color-destructive-foreground)',
        },
        highlight: {
          DEFAULT: 'var(--color-highlight)',
          bg: 'var(--color-highlight-bg)',
        },
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',
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
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': 'var(--color-foreground)',
            '--tw-prose-headings': 'var(--color-foreground)',
            '--tw-prose-lead': 'var(--color-muted-foreground)',
            '--tw-prose-links': 'var(--color-primary)',
            '--tw-prose-bold': 'var(--color-foreground)',
            '--tw-prose-counters': 'var(--color-muted-foreground)',
            '--tw-prose-bullets': 'var(--color-muted-foreground)',
            '--tw-prose-hr': 'var(--color-border)',
            '--tw-prose-quotes': 'var(--color-foreground)',
            '--tw-prose-quote-borders': 'var(--color-border)',
            '--tw-prose-captions': 'var(--color-muted-foreground)',
            '--tw-prose-code': 'var(--color-foreground)',
            '--tw-prose-pre-code': 'var(--color-foreground)',
            '--tw-prose-pre-bg': 'var(--color-muted)',
            '--tw-prose-th-borders': 'var(--color-border)',
            '--tw-prose-td-borders': 'var(--color-border)',
            color: 'var(--color-foreground)',
            maxWidth: 'none',
          },
        },
        invert: {
          css: {
            '--tw-prose-body': 'var(--color-foreground)',
            '--tw-prose-headings': 'var(--color-foreground)',
            '--tw-prose-lead': 'var(--color-muted-foreground)',
            '--tw-prose-links': 'var(--color-primary)',
            '--tw-prose-bold': 'var(--color-foreground)',
            '--tw-prose-counters': 'var(--color-muted-foreground)',
            '--tw-prose-bullets': 'var(--color-muted-foreground)',
            '--tw-prose-hr': 'var(--color-border)',
            '--tw-prose-quotes': 'var(--color-foreground)',
            '--tw-prose-quote-borders': 'var(--color-border)',
            '--tw-prose-captions': 'var(--color-muted-foreground)',
            '--tw-prose-code': 'var(--color-foreground)',
            '--tw-prose-pre-code': 'var(--color-foreground)',
            '--tw-prose-pre-bg': 'var(--color-muted)',
            '--tw-prose-th-borders': 'var(--color-border)',
            '--tw-prose-td-borders': 'var(--color-border)',
            color: 'var(--color-foreground)',
          },
        },
      },
    },
  },
  plugins: [animate, typography],
} satisfies Config
