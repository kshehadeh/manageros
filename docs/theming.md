## Theming (Tailwind + shadcn + next-themes)

This app uses CSS variables with Tailwind and `next-themes` to support light/dark themes and future theme customization without touching component code.

### How it works
- Tailwind is configured for class-based dark mode and shadcn tokens in `tailwind.config.ts`.
- Theme design tokens are defined as CSS variables in `src/app/globals.css` under `:root` (light) and `.dark` (dark).
- The `ThemeProvider` from `next-themes` sets the `class` attribute on `<html>` for seamless theme switching.
- Components reference tokens like `bg-background`, `text-foreground`, `bg-card`, `border`, `ring`, and semantic colors (`primary`, `secondary`, `accent`, `muted`, `destructive`).

### Files
- `tailwind.config.ts`: adds `darkMode: ['class']`, color tokens, radius, and `tailwindcss-animate`.
- `src/app/globals.css`: defines CSS variables for light/dark and base styles.
- `src/components/theme-provider.tsx`: wraps the app with `next-themes`.
- `src/components/mode-toggle.tsx`: small client component to toggle theme.
- `src/app/layout.tsx`: wires the provider and sets defaults.

### Usage
- Use shadcn classes/tokens in components:
  - Surface: `bg-card text-card-foreground border`
  - Page: `bg-background text-foreground`
  - Inputs: `border-input bg-background focus-visible:ring-ring`
  - Colors: `bg-primary text-primary-foreground`, `bg-secondary`, `bg-accent`, etc.
- Avoid hard-coded palette classes (e.g. `bg-neutral-900`). Prefer tokenized classes above.

### Toggle the theme
Use `ModeToggle` anywhere (already added to the TopBar):

```tsx
import { ModeToggle } from '@/components/mode-toggle'
```

### Adding a new theme later
1) Create a CSS class with your theme token values in `globals.css`, e.g. `.ocean`:
```css
.ocean {
  --background: 210 20% 10%;
  --foreground: 210 40% 98%;
  --card: 210 20% 14%;
  --card-foreground: 210 40% 98%;
  /* ...same set of variables as :root/.dark... */
}
```
2) Apply that class at the root using `next-themes` by setting `setTheme('ocean')`.
3) All components using tokens will adopt the new look without code changes.

### Notes
- Default theme is dark to match current look. Light theme is fully defined and can be enabled.
- Keep using shadcn UI primitives; they are token-aware by default.

