# Entity Detail Page Standards

This document defines the look and feel standards for entity detail pages in ManagerOS. These standards ensure consistency across all detail views and provide a cohesive user experience.

## Overview

Entity detail pages follow a standardized layout pattern with a header section, main content area, and optional sidebar. The design emphasizes clarity, hierarchy, and efficient use of space.

## Layout Structure

### 1. Page Container

```tsx
<div className='page-container'>
  {/* Header */}
  {/* Main Content */}
</div>
```

**CSS Class**: `.page-container`

- Provides consistent spacing between major sections
- Acts as the main wrapper for all detail page content

### 2. Header Section

```tsx
<div className='page-header'>
  <div className='header-layout'>
    <div className='header-content'>{/* Title and basic info */}</div>
    {/* Actions dropdown */}
  </div>
</div>
```

**CSS Class**: `.page-header`

- Provides bottom margin for separation from content
- Contains the entity title, status, and key information
- Includes action buttons/dropdowns on the right

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

```tsx
<div className='main-layout'>
  {/* Main Content */}
  <div className='main-content'>{/* Content sections */}</div>

  {/* Right Sidebar */}
  <div className='sidebar'>{/* Sidebar sections */}</div>
</div>
```

**Layout Guidelines**:

- Main content uses flex-1 to take remaining space
- Sidebar has fixed width of 320px
- Gap between columns: 24px
- Vertical spacing within sections: 24px

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

```tsx
<div className='sidebar'>
  <section>
    <h3 className='section-title'>Section Title</h3>
    {/* Section content */}
  </section>
</div>
```

**Sidebar Guidelines**:

- Fixed width: 320px
- Vertical spacing: 24px between sections
- Same section structure as main content
- Typically contains secondary information, actions, or related entities

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
export default function EntityDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const entity = await getEntity(params.id)

  return (
    <EntityDetailClient entityName={entity.name} entityId={entity.id}>
      <div className='page-container'>
        <div className='page-header'>
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <div className='title-section'>
                <h1 className='page-title'>{entity.name}</h1>
                <StatusBadge status={entity.status} />
              </div>
              <div className='page-section-subtitle'>{entity.role ?? ''}</div>
              <div className='entity-email'>{entity.email}</div>

              {/* Basic Information with Icons */}
              <div className='entity-info-row'>
                {entity.team && (
                  <div className='info-item'>
                    <Building2 className='info-icon' />
                    <Link
                      href={`/teams/${entity.team.id}`}
                      className='info-link'
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
        </div>

        <div className='main-layout'>
          {/* Main Content */}
          <div className='main-content'>
            {entity.items.length > 0 && (
              <section>
                <h3 className='section-title'>Items ({entity.items.length})</h3>
                <div className='section-content'>
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
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar */}
          <div className='sidebar'>
            {entity.relatedItems.length > 0 && (
              <section>
                <h3 className='section-title'>
                  Related Items ({entity.relatedItems.length})
                </h3>
                <div className='section-content'>{/* Sidebar content */}</div>
              </section>
            )}
          </div>
        </div>
      </div>
    </EntityDetailClient>
  )
}
```

## Best Practices

1. **Consistency**: Follow the established patterns for all entity detail pages
2. **Performance**: Use conditional rendering to avoid unnecessary DOM elements
3. **Accessibility**: Ensure proper semantic structure and keyboard navigation
4. **Responsive**: Design for mobile-first with progressive enhancement
5. **Loading**: Provide clear loading and error states
6. **Empty States**: Handle cases where sections have no content
7. **Icons**: Use consistent iconography throughout
8. **Spacing**: Maintain consistent spacing using the defined scale
9. **Typography**: Follow the established text hierarchy
10. **Colors**: Use the design system color tokens consistently

## Future Considerations

This document will be expanded to include:

- Form page standards
- List page standards
- Dashboard page standards
- Modal and dialog standards
- Navigation standards
- Component library standards

The goal is to create a comprehensive design system that ensures consistency and improves developer productivity across the entire ManagerOS application.
