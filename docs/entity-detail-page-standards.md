# Entity Detail Page Standards

This document defines the look and feel standards for entity detail pages in ManagerOS. These standards ensure consistency across all detail views and provide a cohesive user experience.

## Overview

Entity detail pages follow a standardized layout pattern with a header section, main content area, and optional sidebar. The design emphasizes clarity, hierarchy, and efficient use of space.

## Layout Structure

All entity detail pages should use the shared layout components instead of CSS classes directly. This ensures consistency and enables centralized layout management.

### 1. Page Container

**Component**: `PageContainer` from `@/components/ui/page-container`

```tsx
import { PageContainer } from '@/components/ui/page-container'

;<PageContainer>
  {/* Header */}
  {/* Main Content */}
</PageContainer>
```

- Provides consistent spacing between major sections
- Acts as the main wrapper for all detail page content
- **Always use the component** instead of the `page-container` CSS class

### 2. Header Section

**Component**: `PageHeader` from `@/components/ui/page-header`

**Simple Header**:

```tsx
import { PageHeader } from '@/components/ui/page-header'
import { Rocket } from 'lucide-react'

;<PageHeader
  title={entity.name}
  titleIcon={Rocket}
  subtitle={entity.description}
  actions={<EntityActionsDropdown entityId={entity.id} />}
/>
```

**Complex Header** (for custom layouts):

```tsx
<PageHeader>
  <div className='flex items-start justify-between'>
    <div className='flex-1'>{/* Custom header content */}</div>
    <EntityActionsDropdown entityId={entity.id} />
  </div>
</PageHeader>
```

- Provides bottom margin for separation from content
- Contains the entity title, status, and key information
- Includes action buttons/dropdowns on the right
- **Always use the component** instead of the `page-header` CSS class

#### Header Components

**Title Section**:

```tsx
<div className='title-section'>
  <h1 className='page-title'>{entityName}</h1>
  <StatusBadge status={entity.status} />
</div>
<div className='page-section-subtitle'>
  {entity.role ?? ''}
</div>
<div className='entity-email'>
  {entity.email}
</div>
```

**CSS Classes**:

- `.page-title`: Large bold title styling with bottom margin
- `.page-section-subtitle`: Small muted text, hidden on mobile

**Basic Information with Icons**:

```tsx
<div className='entity-info-row'>
  {entity.team && (
    <div className='info-item'>
      <Building2 className='info-icon' />
      <Link href={`/teams/${entity.team.id}`} className='info-link'>
        {entity.team.name}
      </Link>
    </div>
  )}
  {/* Additional info items */}
</div>
```

**Icon Guidelines**:

- Use Lucide React icons consistently
- Standard size: 16px
- Icons should be semantic and intuitive
- Use muted foreground color for icon color
- Links use blue hover state

### 3. Main Content Layout

#### Two-Column Layout

**Components**: `PageContent`, `PageMain`, `PageSidebar` from `@/components/ui/`

```tsx
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'

;<PageContent>
  <PageMain>{/* Main content sections */}</PageMain>

  <PageSidebar>{/* Sidebar sections */}</PageSidebar>
</PageContent>
```

**Layout Guidelines**:

- `PageContent` handles the two-column flex layout
- `PageMain` applies `flex-1 min-w-0` for proper flex behavior
- `PageSidebar` applies responsive width (`w-full lg:w-80 lg:shrink-0`)
- Gap between columns: 24px (handled by `PageContent`)
- Vertical spacing within sections: 24px
- **Always use these components** instead of CSS classes

#### Main Content Sections

```tsx
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
;<PageSection
  header={
    <SectionHeader icon={FileText} title={`Section Title (${items.length})`} />
  }
>
  <div className='section-content'>{/* Section content */}</div>
</PageSection>
```

**Section Guidelines**:

- **Always use `PageSection` component** for all page sections
- Use `SectionHeader` component for section titles via the `header` prop
- Include count in parentheses when applicable in the title
- Content spacing: Automatically handled by `PageSection` component
- The component applies consistent spacing and styling

#### Content Cards

```tsx
<Link href={`/entities/${item.id}`} className='content-card'>
  <div className='card-content'>
    <div>
      <div className='card-title'>{item.title}</div>
      <div className='card-description'>{item.description}</div>
      <div className='card-metadata'>Additional metadata</div>
    </div>
    <div className='card-actions'>{/* Status badges, actions */}</div>
  </div>
</Link>
```

**Card Guidelines**:

- Border radius: 12px
- Padding: 12px
- Hover state: accent background with transition
- Use border for subtle definition
- Content hierarchy: title → description → metadata

### 4. Sidebar Sections

#### Sidebar Structure

**Component**: `PageSidebar` from `@/components/ui/page-sidebar`

```tsx
import { PageSidebar } from '@/components/ui/page-sidebar'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'

;<PageSidebar>
  <PageSection header={<SectionHeader icon={Users} title='Related Items' />}>
    {/* Sidebar content */}
  </PageSection>
</PageSidebar>
```

**Sidebar Guidelines**:

- Use `PageSidebar` component for sidebar wrapper
- Fixed width: 320px on desktop, full width on mobile
- Vertical spacing: 24px between sections
- Same section structure as main content (use `PageSection` and `SectionHeader`)
- Typically contains secondary information, actions, or related entities
- **Always use the component** instead of the `sidebar` CSS class

#### Sidebar Content Types

- **Related Entities**: Direct reports, team members, etc.
- **Administrative Actions**: Account linking, integrations
- **Quick Actions**: Edit, delete, share
- **Metadata**: Creation date, last updated, etc.

## Content Guidelines

### 1. Conditional Rendering

Only show sections when they have meaningful content:

```tsx
{
  entity.items.length > 0 && (
    <section>
      <h3 className='section-title'>Items ({entity.items.length})</h3>
      {/* Content */}
    </section>
  )
}
```

### 2. Empty States

Handle empty states gracefully:

```tsx
{items.length === 0 ? (
  <div className='empty-state'>
    <p className='empty-message'>No items found</p>
  </div>
) : (
  /* Content */
)}
```

### 3. Loading States

Provide loading feedback:

```tsx
{isLoading ? (
  <div className='loading-state'>
    <div className='loading-message'>
      Loading...
    </div>
  </div>
) : (
  /* Content */
)}
```

### 4. Error States

Display errors clearly:

```tsx
{
  error && <div className='error-state'>{error}</div>
}
```

## Typography

### Text Hierarchy

- **Page Title**: Large bold text (24px, bold)
- **Section Titles**: Semibold font (600 weight)
- **Content Titles**: Medium font (500 weight)
- **Body Text**: Default weight
- **Metadata**: Small text (14px)
- **Small Text**: Extra small text (12px)

### Color Usage

- **Primary Text**: Foreground color
- **Secondary Text**: Muted foreground color
- **Links**: Blue hover state
- **Errors**: Destructive color
- **Success**: Success badge text color

## Spacing

### Vertical Spacing

- **Page sections**: 24px spacing
- **Section content**: 12px spacing
- **Card content**: 8px spacing
- **Form elements**: 16px spacing

### Horizontal Spacing

- **Column gap**: 24px
- **Icon spacing**: 4px
- **Button groups**: 8px
- **Content padding**: 12px

## Interactive Elements

### Buttons

```tsx
<Button variant='outline' size='sm'>
  Action
</Button>
```

### Links

```tsx
<Link href='/path' className='hover-link'>
  Link Text
</Link>
```

### Form Elements

```tsx
<input className='input' />
<select className='input' />
```

## Responsive Design

### Breakpoints

- **Mobile**: Default styles
- **Tablet**: Medium breakpoint (768px+)
- **Desktop**: Large breakpoint (1024px+)

### Responsive Patterns

- Hide secondary information on mobile
- Stack sidebar below main content on mobile
- Adjust text sizes for readability

## Accessibility

### Semantic HTML

- Use proper heading hierarchy (`h1`, `h2`, `h3`)
- Use `<section>` for content areas
- Use `<nav>` for navigation elements
- Use `<main>` for primary content

### ARIA Labels

- Add `aria-label` for icon-only buttons
- Use `aria-describedby` for form help text
- Include `role` attributes where needed

### Keyboard Navigation

- Ensure all interactive elements are focusable
- Provide visible focus indicators
- Support keyboard shortcuts where appropriate

## Implementation Examples

### Complete Entity Detail Page

```tsx
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { FileText, Users, Building2 } from 'lucide-react'

export default function EntityDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const entity = await getEntity(params.id)

  return (
    <EntityDetailClient entityName={entity.name} entityId={entity.id}>
      <PageContainer>
        <PageHeader
          title={entity.name}
          titleIcon={FileText}
          subtitle={entity.role ?? ''}
          actions={<EntityActionsDropdown entity={entity} />}
        >
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-2'>
                <h1 className='page-title'>{entity.name}</h1>
                <StatusBadge status={entity.status} />
              </div>
              <div className='page-section-subtitle'>{entity.role ?? ''}</div>
              <div className='text-xs text-muted-foreground'>
                {entity.email}
              </div>

              {/* Basic Information with Icons */}
              <div className='flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground'>
                {entity.team && (
                  <div className='flex items-center gap-1'>
                    <Building2 className='w-4 h-4' />
                    <Link
                      href={`/teams/${entity.team.id}`}
                      className='hover:text-primary transition-colors'
                    >
                      {entity.team.name}
                    </Link>
                  </div>
                )}
                {/* Additional info items */}
              </div>
            </div>
            <EntityActionsDropdown entity={entity} />
          </div>
        </PageHeader>

        <PageContent>
          <PageMain>
            <div className='space-y-6'>
              {entity.items.length > 0 && (
                <PageSection
                  header={
                    <SectionHeader
                      icon={FileText}
                      title={`Items (${entity.items.length})`}
                    />
                  }
                >
                  {entity.items.map(item => (
                    <Link
                      key={item.id}
                      href={`/items/${item.id}`}
                      className='content-card'
                    >
                      <div className='card-content'>
                        <div>
                          <div className='card-title'>{item.title}</div>
                          <div className='card-description'>
                            {item.description}
                          </div>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                    </Link>
                  ))}
                </PageSection>
              )}
            </div>
          </PageMain>

          <PageSidebar>
            {entity.relatedItems.length > 0 && (
              <PageSection
                header={
                  <SectionHeader
                    icon={Users}
                    title={`Related Items (${entity.relatedItems.length})`}
                  />
                }
              >
                {/* Sidebar content */}
              </PageSection>
            )}
          </PageSidebar>
        </PageContent>
      </PageContainer>
    </EntityDetailClient>
  )
}
```

## Best Practices

1. **Use Shared Components**: Always use `PageContainer`, `PageHeader`, `PageContent`, `PageMain`, `PageSidebar` instead of CSS classes
2. **Consistency**: Follow the established patterns for all entity detail pages
3. **Performance**: Use conditional rendering to avoid unnecessary DOM elements
4. **Accessibility**: Ensure proper semantic structure and keyboard navigation
5. **Responsive**: Design for mobile-first with progressive enhancement
6. **Loading**: Provide clear loading and error states
7. **Empty States**: Handle cases where sections have no content
8. **Icons**: Use consistent iconography throughout
9. **Spacing**: Maintain consistent spacing using the defined scale
10. **Typography**: Follow the established text hierarchy
11. **Colors**: Use the design system color tokens consistently

## Related Documentation

- [Shared Layout Components](./shared-layout-components.md) - Complete guide to using shared layout components
- [PageSection Component](./page-section-component.md) - Documentation for the PageSection component

## Future Considerations

This document will be expanded to include:

- Form page standards
- List page standards
- Dashboard page standards
- Modal and dialog standards
- Navigation standards
- Component library standards

The goal is to create a comprehensive design system that ensures consistency and improves developer productivity across the entire ManagerOS application.
