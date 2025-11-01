# PageSection Component

The `PageSection` component provides a standardized way to create page sections across ManagerOS. It ensures consistent styling and spacing for all sections.

## Overview

All page sections should use the `PageSection` component instead of manually applying the `page-section` CSS class. This provides a single source of truth for section styling and makes it easy to update the UI globally.

## Usage

### Basic Usage (Without Header)

```tsx
import { PageSection } from '@/components/ui/page-section'

;<PageSection>{/* Your content here */}</PageSection>
```

### With Section Header

```tsx
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { FileText } from 'lucide-react'

;<PageSection header={<SectionHeader icon={FileText} title='Section Title' />}>
  {/* Your content here */}
</PageSection>
```

### With Header and Actions

```tsx
<PageSection
  header={
    <SectionHeader
      icon={FileText}
      title='Section Title'
      action={<Button onClick={handleAction}>Action</Button>}
    />
  }
>
  {/* Your content here */}
</PageSection>
```

### With Custom Class Names

```tsx
<PageSection className='space-y-6'>{/* Your content here */}</PageSection>
```

## Component Props

- `header` (optional): ReactNode - Typically a `SectionHeader` component for section titles
- `children`: ReactNode - The main content of the section
- `className` (optional): string - Additional CSS classes for custom styling

## Benefits

1. **Consistency**: All sections have the same spacing and styling
2. **Maintainability**: Update all sections by modifying a single component
3. **Simplicity**: No need to remember CSS class names
4. **Type Safety**: TypeScript ensures correct prop usage

## Migration

When updating existing code:

**Before:**

```tsx
<div className='page-section'>
  <SectionHeader icon={FileText} title='Title' />
  {/* Content */}
</div>
```

**After:**

```tsx
<PageSection header={<SectionHeader icon={FileText} title='Title' />}>
  {/* Content */}
</PageSection>
```

## Related Components

- `SectionHeader`: Standard component for section titles with icons and optional actions
- `page-container`: Wrapper class for page layouts
- `page-header`: Header section for pages

## See Also

- [Entity Detail Page Standards](./entity-detail-page-standards.md)
- [Theming Guide](./theming.md)
- [User Interface Rules](../.cursor/rules/user-interface.mdc)
