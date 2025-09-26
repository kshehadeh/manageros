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

- Provides consistent spacing between major sections (`space-y-6`)
- Acts as the main wrapper for all detail page content

### 2. Header Section

```tsx
<div className='page-header'>
  <div className='flex items-start justify-between'>
    <div className='flex-1'>{/* Title and basic info */}</div>
    {/* Actions dropdown */}
  </div>
</div>
```

**CSS Class**: `.page-header`

- Provides bottom margin (`mb-6`) for separation from content
- Contains the entity title, status, and key information
- Includes action buttons/dropdowns on the right

#### Header Components

**Title Section**:

```tsx
<div className='flex items-center gap-3 mb-2'>
  <h1 className='page-title'>{entityName}</h1>
  <StatusBadge status={entity.status} />
</div>
<div className='page-section-subtitle'>
  {entity.role ?? ''}
</div>
<div className='text-xs text-muted-foreground'>
  {entity.email}
</div>
```

**CSS Classes**:

- `.page-title`: `text-2xl font-bold text-foreground mb-2`
- `.page-section-subtitle`: `text-sm text-muted-foreground hidden md:block`

**Basic Information with Icons**:

```tsx
<div className='flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground'>
  {entity.team && (
    <div className='flex items-center gap-1'>
      <Building2 className='w-4 h-4' />
      <Link href={`/teams/${entity.team.id}`} className='hover:text-blue-400'>
        {entity.team.name}
      </Link>
    </div>
  )}
  {/* Additional info items */}
</div>
```

**Icon Guidelines**:

- Use Lucide React icons consistently
- Standard size: `w-4 h-4` (16px)
- Icons should be semantic and intuitive
- Use `text-muted-foreground` for icon color
- Links use `hover:text-blue-400` for hover state

### 3. Main Content Layout

#### Two-Column Layout

```tsx
<div className='flex gap-6'>
  {/* Main Content */}
  <div className='flex-1 space-y-6'>{/* Content sections */}</div>

  {/* Right Sidebar */}
  <div className='w-80 space-y-6'>{/* Sidebar sections */}</div>
</div>
```

**Layout Guidelines**:

- Main content uses `flex-1` to take remaining space
- Sidebar has fixed width `w-80` (320px)
- Gap between columns: `gap-6` (24px)
- Vertical spacing within sections: `space-y-6`

#### Main Content Sections

```tsx
<section>
  <h3 className='font-semibold mb-4'>Section Title ({items.length})</h3>
  <div className='space-y-3'>{/* Section content */}</div>
</section>
```

**Section Guidelines**:

- Use `<section>` elements for semantic structure
- Section titles: `font-semibold mb-4`
- Include count in parentheses when applicable
- Content spacing: `space-y-3` (12px)

#### Content Cards

```tsx
<Link
  href={`/entities/${item.id}`}
  className='block border rounded-xl p-3 hover:bg-accent/50 transition-colors'
>
  <div className='flex items-center justify-between'>
    <div>
      <div className='font-medium'>{item.title}</div>
      <div className='text-sm text-muted-foreground'>{item.description}</div>
      <div className='text-xs text-muted-foreground mt-1'>
        Additional metadata
      </div>
    </div>
    <div className='flex items-center gap-2'>
      {/* Status badges, actions */}
    </div>
  </div>
</Link>
```

**Card Guidelines**:

- Border radius: `rounded-xl` (12px)
- Padding: `p-3` (12px)
- Hover state: `hover:bg-accent/50 transition-colors`
- Use `border` for subtle definition
- Content hierarchy: title → description → metadata

### 4. Sidebar Sections

#### Sidebar Structure

```tsx
<div className='w-80 space-y-6'>
  <section>
    <h3 className='font-semibold mb-4'>Section Title</h3>
    {/* Section content */}
  </section>
</div>
```

**Sidebar Guidelines**:

- Fixed width: `w-80` (320px)
- Vertical spacing: `space-y-6` between sections
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
      <h3 className='font-semibold mb-4'>Items ({entity.items.length})</h3>
      {/* Content */}
    </section>
  )
}
```

### 2. Empty States

Handle empty states gracefully:

```tsx
{items.length === 0 ? (
  <div className='text-center py-8'>
    <p className='text-muted-foreground'>No items found</p>
  </div>
) : (
  /* Content */
)}
```

### 3. Loading States

Provide loading feedback:

```tsx
{isLoading ? (
  <div className='flex justify-center py-4'>
    <div className='text-sm text-muted-foreground'>
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
  error && (
    <div className='bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded'>
      {error}
    </div>
  )
}
```

## Typography

### Text Hierarchy

- **Page Title**: `text-2xl font-bold` (24px, bold)
- **Section Titles**: `font-semibold` (600 weight)
- **Content Titles**: `font-medium` (500 weight)
- **Body Text**: Default weight
- **Metadata**: `text-sm` (14px)
- **Small Text**: `text-xs` (12px)

### Color Usage

- **Primary Text**: `text-foreground`
- **Secondary Text**: `text-muted-foreground`
- **Links**: `hover:text-blue-400`
- **Errors**: `text-destructive`
- **Success**: `text-badge-success-text`

## Spacing

### Vertical Spacing

- **Page sections**: `space-y-6` (24px)
- **Section content**: `space-y-3` (12px)
- **Card content**: `space-y-2` (8px)
- **Form elements**: `space-y-4` (16px)

### Horizontal Spacing

- **Column gap**: `gap-6` (24px)
- **Icon spacing**: `gap-1` (4px)
- **Button groups**: `gap-2` (8px)
- **Content padding**: `p-3` (12px)

## Interactive Elements

### Buttons

```tsx
<Button variant='outline' size='sm'>
  Action
</Button>
```

### Links

```tsx
<Link href='/path' className='hover:text-blue-400'>
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
- **Tablet**: `md:` prefix (768px+)
- **Desktop**: `lg:` prefix (1024px+)

### Responsive Patterns

- Hide secondary information on mobile: `hidden md:block`
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
                      className='hover:text-blue-400'
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

        <div className='flex gap-6'>
          {/* Main Content */}
          <div className='flex-1 space-y-6'>
            {entity.items.length > 0 && (
              <section>
                <h3 className='font-semibold mb-4'>
                  Items ({entity.items.length})
                </h3>
                <div className='space-y-3'>
                  {entity.items.map(item => (
                    <Link
                      key={item.id}
                      href={`/items/${item.id}`}
                      className='block border rounded-xl p-3 hover:bg-accent/50 transition-colors'
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <div className='font-medium'>{item.title}</div>
                          <div className='text-sm text-muted-foreground'>
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
          <div className='w-80 space-y-6'>
            {entity.relatedItems.length > 0 && (
              <section>
                <h3 className='font-semibold mb-4'>
                  Related Items ({entity.relatedItems.length})
                </h3>
                <div className='space-y-3'>{/* Sidebar content */}</div>
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
