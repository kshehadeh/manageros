# Mobile Data Table Optimization

## Overview

All data tables in ManagerOS now automatically extend to the screen edges on mobile devices, providing maximum content visibility while maintaining proper spacing on desktop.

## Implementation

### Changes Made

#### 1. Data Table Styles

Updated the centralized data table styles in `src/components/common/data-table-styles.ts`:

```typescript
// Before
tableWrapper: 'rounded-md border overflow-hidden'
tableWrapperRelative: 'rounded-md border relative'

// After
tableWrapper: '-mx-3 md:mx-0 md:rounded-md border-y md:border overflow-hidden'
tableWrapperRelative: '-mx-3 md:mx-0 md:rounded-md border-y md:border relative'
```

#### 2. Page Header Styles

Updated the page header styles in `src/app/globals.css`:

```css
/* Before */
.page-header {
  @apply mb-6;
}

/* After */
.page-header {
  @apply mb-6 -mx-3 px-3 md:mx-0 md:px-0;
}
```

#### 3. Section Header Component

Updated the SectionHeader component in `src/components/ui/section-header.tsx`:

```typescript
// Before
className={`flex items-center justify-between border-b border-muted pb-3 mb-3 ${className}`}

// After
className={`flex items-center justify-between border-b border-muted pb-3 mb-3 -mx-3 px-3 md:mx-0 md:px-0 ${className}`}
```

#### 4. Expandable Section Component

Updated the ExpandableSection component in `src/components/expandable-section.tsx`:

```typescript
// Before
className={`rounded-xl p-4 space-y-4 ${className}`}

// After
className={`rounded-xl py-4 -mx-3 px-3 md:mx-0 md:px-4 space-y-4 ${className}`}
```

### How It Works

The implementation uses responsive Tailwind CSS classes:

#### Mobile Behavior (< 768px)

- **Negative Margins**: `-mx-3` extends elements beyond their container by 12px on each side
- **Internal Padding**: `px-3` maintains content spacing for headers and sections
- **Border Style**: `border-y` applies only top and bottom borders (tables)
- **No Rounded Corners**: Elements extend flush to screen edges

#### Desktop Behavior (≥ 768px)

- **Reset Margins**: `md:mx-0` removes negative margins
- **Reset Padding**: `md:px-0` removes padding (parent containers handle spacing)
- **Full Borders**: `md:border` applies borders on all sides (tables)
- **Rounded Corners**: `md:rounded-md` adds rounded corners (tables)

### Layout Context

The negative margin approach works because:

1. The main layout uses `p-3` padding on mobile: `<main className='flex-1 overflow-auto p-3 md:p-6'>`
2. The `-mx-3` on tables exactly counteracts this padding
3. On desktop, the padding increases to `p-6`, and tables reset to normal spacing with `md:mx-0`

## Visual Comparison

### Before

```
┌─────────────────────────┐
│  Mobile Screen          │
│ ┌───────────────────┐   │
│ │ Page Header       │   │  ← Padding on sides
│ └───────────────────┘   │
│ ┌───────────────────┐   │
│ │ Section Header    │   │  ← Padding on sides
│ └───────────────────┘   │
│  ┌─┬─────────────────┬─┐│
│  │ │                 │ ││
│  │ │   Data Table    │ ││  ← Padding on sides
│  │ │                 │ ││
│  └─┴─────────────────┴─┘│
└─────────────────────────┘
```

### After

```
┌─────────────────────────┐
│  Mobile Screen          │
│┌───────────────────────┐│
││ Page Header           ││  ← Edge-to-edge
│└───────────────────────┘│
│┌───────────────────────┐│
││ Section Header        ││  ← Edge-to-edge
│└───────────────────────┘│
│  ┌─────────────────────┐│
│  │                     ││
│  │    Data Table       ││  ← Edge-to-edge
│  │                     ││
│  └─────────────────────┘│
└─────────────────────────┘
```

## Benefits

1. **Maximum Content Visibility**: Tables, headers, and sections use full screen width on mobile
2. **Better UX**: More data visible without horizontal scrolling
3. **Modern Mobile Pattern**: Follows common mobile app design patterns (similar to native apps)
4. **Automatic**: No changes needed to individual components
5. **Consistent**: All data tables, page headers, and section headers benefit from this change
6. **Professional Look**: All elements align visually edge-to-edge on mobile
7. **Visual Hierarchy**: Clear separation between sections with edge-to-edge borders

## Affected Components

### Data Tables

All data table components automatically benefit:

- People Data Table
- Tasks Data Table
- One-on-Ones Data Table
- Meetings Data Table
- Feedback Data Table
- Initiatives Data Table
- Teams Data Table
- Shared Meetings Table
- Meeting Instance Table

### Page Headers

All page headers using the `.page-header` class automatically benefit:

- People page
- Tasks page
- Meetings page
- Initiatives page
- Teams page
- One-on-ones page
- Feedback page
- And all other pages using the standard page header pattern

### Section Headers & Expandable Sections

All section headers using the `SectionHeader` component automatically benefit:

- Active Tasks Section
- Owned Initiatives Section
- One-on-One Meetings Section
- Jira Activity Section
- GitHub PR Activity Section
- Meeting Participants Section
- Check-in lists
- And all other sections using the SectionHeader component

All dashboard sections using the `ExpandableSection` component also automatically benefit:

- Dashboard Assigned Tasks
- Dashboard Open Initiatives
- Dashboard Recent 1:1s
- Dashboard Upcoming Meetings
- Dashboard Direct Reports
- Dashboard Related Teams
- Dashboard Feedback Campaigns

## Testing

### Manual Testing Checklist

- [ ] Test each data table page on mobile viewport (< 768px)
- [ ] Verify tables extend to screen edges
- [ ] Verify no horizontal overflow/scrolling issues
- [ ] Test on actual mobile devices (iOS/Android)
- [ ] Verify desktop view (≥ 768px) maintains spacing
- [ ] Verify borders and rounded corners on desktop
- [ ] Test in both light and dark themes

### Test Breakpoints

- **Mobile**: 375px, 414px, 390px (common phone widths)
- **Tablet**: 768px (md breakpoint)
- **Desktop**: 1024px, 1440px

## Browser Compatibility

This solution uses standard Tailwind CSS utility classes that are fully supported across:

- Chrome/Edge (Chromium)
- Safari (iOS & macOS)
- Firefox
- All modern mobile browsers

## Future Enhancements

1. **Horizontal Scroll Indicators**: Add visual hints when table content is wider than viewport
2. **Column Prioritization**: Hide less important columns on mobile
3. **Card View Toggle**: Option to switch to card view on very small screens
4. **Swipe Actions**: Add mobile-specific gestures for common actions

## Related Documentation

- [Data Table Styling](./data-table-styling.md) - Full documentation of centralized styling system
- [Entity Detail Page Standards](./entity-detail-page-standards.md) - Page layout standards
