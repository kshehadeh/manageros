# Job Level Ordering Feature

## Overview

The Job Level Ordering feature allows administrators to organize job levels in a hierarchical structure where each level has an order value that determines its position in dropdowns and selection interfaces.

## Features

### Automatic Ordering

- When a new job level is created, it automatically receives the next highest order number
- Job levels are displayed in order from lowest to highest order value
- The order value determines the position in job role creation forms and other UI elements

### Drag-and-Drop Reordering

- Administrators can drag and drop job levels to reorder them
- Visual feedback during drag operations with shadow effects
- Automatic persistence of new order to the database
- Real-time updates across all interfaces

### Form-Based Ordering

- Job levels can be created and updated through forms
- Order field is automatically managed for new levels
- Existing levels can be edited while preserving their order

## Implementation Details

### Database Schema

```prisma
model JobLevel {
  id           String   @id @default(cuid())
  name         String
  order        Int      @default(0)
  organizationId String
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  jobRoles     JobRole[] @relation("JobRoleLevel")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([name, organizationId])
  @@index([organizationId])
  @@index([order])
}
```

### Server Actions

#### Core Functions

- `getJobLevels()` - Returns levels ordered by order value
- `createJobLevel()` - Creates new level with automatic order assignment
- `updateJobLevelOrder()` - Updates multiple levels' order values in transaction
- `updateJobLevel()` - Updates individual level properties
- `deleteJobLevel()` - Removes level with validation checks

#### Validation Schema

```typescript
const jobLevelSchema = z.object({
  name: z
    .string()
    .min(1, 'Level name is required')
    .max(100, 'Level name must be less than 100 characters'),
  order: z.number().int().min(0).default(0),
})
```

### UI Components

#### Drag-and-Drop Implementation

- Uses `react-beautiful-dnd` library for smooth drag operations
- Visual indicators with grip handles and hover states
- Transaction-based updates to maintain data consistency
- Error handling for failed reorder operations

#### Order Display

- Shows current order value next to each level
- Tooltips explaining the ordering system
- Visual feedback during drag operations

## Usage Examples

### Creating Job Levels with Order

```typescript
// Creating a new level automatically assigns the next order value
await createJobLevel({ name: 'Senior Engineer' })
// Assigned order: highest existing order + 1

// Custom order value (rarely needed)
await createJobLevel({ name: 'Principal Engineer', order: 100 })
```

### Reordering Levels

```typescript
// Using drag-and-drop automatically calls updateJobLevelOrder
const reorderedLevels = [
  { id: 'level1', order: 0 },
  { id: 'level2', order: 1 },
  { id: 'level3', order: 2 },
]

await updateJobLevelOrder(reorderedLevels)
```

## Security Considerations

- Only organization administrators can create, update, or delete job levels
- All operations validate organization membership
- Order updates use database transactions for consistency
- Server-side validation prevents unauthorized access

## Related Components

- `JobLevelManagement` - Main management interface with drag-and-drop
- `PersonForm` - Uses ordered job levels for selection
- `JobRoleManagement` - Displays levels in ordered dropdown

## Future Enhancements

- Bulk import of job levels with order values
- Level hierarchy visualization (Junior → Senior → Staff)
- Order-based filtering and searching
- Audit logging for order changes
