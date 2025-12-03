# Tolerance Rules and Exceptions API

## Overview

The Tolerance Rules and Exceptions API provides functionality for managing organizational tolerance rules and exceptions. Tolerance rules monitor key organizational metrics and automatically create exceptions when thresholds are exceeded.

## Security

- All tolerance rule operations require authentication
- Only organization administrators can create, update, delete, or toggle tolerance rules
- All users in an organization can view tolerance rules
- Exceptions are visible to all organization members
- Users can acknowledge, ignore, or resolve exceptions
- All operations are scoped to the user's organization
- See the [Security Requirements](../../.cursor/rules/security-requirements.mdc) for detailed access control rules

## Server Actions

### Tolerance Rules

**Location**: `src/lib/actions/tolerance-rules.ts`

#### createToleranceRule

Creates a new tolerance rule. Only admins can create rules.

**Function Signature:**

```typescript
createToleranceRule(input: CreateToleranceRuleInput): Promise<ToleranceRule>
```

**Input:**

```typescript
interface CreateToleranceRuleInput {
  ruleType:
    | 'one_on_one_frequency'
    | 'initiative_checkin'
    | 'feedback_360'
    | 'manager_span'
  name: string
  description?: string
  isEnabled?: boolean
  config: ToleranceRuleConfig
}
```

**Config Types:**

```typescript
// One-on-One Frequency
{
  warningThresholdDays: number
  urgentThresholdDays: number
}

// Initiative Check-In
{
  warningThresholdDays: number
}

// 360 Feedback
{
  warningThresholdMonths: number
}

// Manager Span
{
  maxDirectReports: number
}
```

**Example:**

```typescript
import { createToleranceRule } from '@/lib/actions/tolerance-rules'

const rule = await createToleranceRule({
  ruleType: 'one_on_one_frequency',
  name: 'Weekly 1:1 Check',
  description: 'Ensures managers meet with reports weekly',
  isEnabled: true,
  config: {
    warningThresholdDays: 7,
    urgentThresholdDays: 14,
  },
})
```

**Errors:**

- `"User must belong to an organization to create tolerance rules"`
- `"Only administrators can create tolerance rules"`
- Validation errors for invalid config

#### updateToleranceRule

Updates an existing tolerance rule. Only admins can update rules.

**Function Signature:**

```typescript
updateToleranceRule(id: string, input: UpdateToleranceRuleInput): Promise<ToleranceRule>
```

**Input:**

```typescript
interface UpdateToleranceRuleInput {
  name?: string
  description?: string
  isEnabled?: boolean
  config?: ToleranceRuleConfig
}
```

**Example:**

```typescript
await updateToleranceRule('rule_123', {
  name: 'Updated Rule Name',
  config: {
    warningThresholdDays: 10,
    urgentThresholdDays: 20,
  },
})
```

**Errors:**

- `"Tolerance rule not found or access denied"`
- `"Only administrators can update tolerance rules"`

#### deleteToleranceRule

Deletes a tolerance rule. Only admins can delete rules.

**Function Signature:**

```typescript
deleteToleranceRule(id: string): Promise<void>
```

**Example:**

```typescript
await deleteToleranceRule('rule_123')
```

**Errors:**

- `"Tolerance rule not found or access denied"`
- `"Only administrators can delete tolerance rules"`

#### getToleranceRules

Gets all tolerance rules for the current user's organization.

**Function Signature:**

```typescript
getToleranceRules(): Promise<ToleranceRule[]>
```

**Example:**

```typescript
const rules = await getToleranceRules()
```

**Returns:**

Array of tolerance rules ordered by creation date (newest first).

#### getToleranceRuleById

Gets a single tolerance rule by ID.

**Function Signature:**

```typescript
getToleranceRuleById(id: string): Promise<ToleranceRule | null>
```

**Example:**

```typescript
const rule = await getToleranceRuleById('rule_123')
```

#### toggleToleranceRule

Toggles a tolerance rule's enabled status. Only admins can toggle rules.

**Function Signature:**

```typescript
toggleToleranceRule(id: string, isEnabled: boolean): Promise<ToleranceRule>
```

**Example:**

```typescript
await toggleToleranceRule('rule_123', false) // Disable
await toggleToleranceRule('rule_123', true) // Enable
```

#### runToleranceCheck

Manually triggers tolerance check evaluation for all enabled rules. Only admins can trigger checks.

**Function Signature:**

```typescript
runToleranceCheck(): Promise<{
  exceptionsCreated: number
  errors: string[]
}>
```

**Example:**

```typescript
const result = await runToleranceCheck()
console.log(`Created ${result.exceptionsCreated} exceptions`)
if (result.errors.length > 0) {
  console.error('Errors:', result.errors)
}
```

**Returns:**

- `exceptionsCreated`: Number of exceptions created
- `errors`: Array of error messages (if any)

### Exceptions

**Location**: `src/lib/actions/exceptions.ts`

#### createException

Creates a new exception. Typically called by the evaluator, not directly by users.

**Function Signature:**

```typescript
createException(input: CreateExceptionInput): Promise<Exception>
```

**Input:**

```typescript
interface CreateExceptionInput {
  ruleId: string
  organizationId: string
  severity: 'warning' | 'urgent'
  entityType: 'Person' | 'Initiative' | 'OneOnOne' | 'FeedbackCampaign'
  entityId: string
  message: string
  metadata?: Record<string, unknown>
}
```

#### getExceptions

Gets exceptions with optional filters.

**Function Signature:**

```typescript
getExceptions(filters?: ExceptionFilters): Promise<Exception[]>
```

**Filters:**

```typescript
interface ExceptionFilters {
  status?: 'active' | 'acknowledged' | 'ignored' | 'resolved'
  severity?: 'warning' | 'urgent'
  ruleType?: string
  ruleId?: string
  entityType?: 'Person' | 'Initiative' | 'OneOnOne' | 'FeedbackCampaign'
  entityId?: string
}
```

**Example:**

```typescript
// Get all active exceptions
const active = await getExceptions({ status: 'active' })

// Get urgent exceptions for a specific rule
const urgent = await getExceptions({
  severity: 'urgent',
  ruleId: 'rule_123',
})

// Get exceptions for a specific person
const personExceptions = await getExceptions({
  entityType: 'Person',
  entityId: 'person_123',
})
```

#### getExceptionById

Gets a single exception by ID.

**Function Signature:**

```typescript
getExceptionById(id: string): Promise<Exception | null>
```

#### acknowledgeException

Acknowledges an exception.

**Function Signature:**

```typescript
acknowledgeException(id: string): Promise<Exception>
```

**Example:**

```typescript
await acknowledgeException('exception_123')
```

**Behavior:**

- Sets exception status to `'acknowledged'`
- Records `acknowledgedAt` timestamp
- Records `acknowledgedBy` user ID
- Updates linked notification response if exists

#### ignoreException

Ignores an exception.

**Function Signature:**

```typescript
ignoreException(id: string): Promise<Exception>
```

**Example:**

```typescript
await ignoreException('exception_123')
```

**Behavior:**

- Sets exception status to `'ignored'`
- Records `ignoredAt` timestamp
- Records `ignoredBy` user ID
- Updates linked notification response if exists

#### resolveException

Resolves an exception.

**Function Signature:**

```typescript
resolveException(id: string): Promise<Exception>
```

**Example:**

```typescript
await resolveException('exception_123')
```

**Behavior:**

- Sets exception status to `'resolved'`
- Records `resolvedAt` timestamp
- Records `resolvedBy` user ID
- Updates linked notification response if exists

## Types

### ToleranceRule

```typescript
interface ToleranceRule {
  id: string
  organizationId: string
  ruleType:
    | 'one_on_one_frequency'
    | 'initiative_checkin'
    | 'feedback_360'
    | 'manager_span'
  name: string
  description: string | null
  isEnabled: boolean
  config: ToleranceRuleConfig
  createdAt: Date
  updatedAt: Date
}
```

### Exception

```typescript
interface Exception {
  id: string
  ruleId: string
  organizationId: string
  severity: 'warning' | 'urgent'
  entityType: 'Person' | 'Initiative' | 'OneOnOne' | 'FeedbackCampaign'
  entityId: string
  message: string
  metadata: Record<string, unknown> | null
  notificationId: string | null
  status: 'active' | 'acknowledged' | 'ignored' | 'resolved'
  acknowledgedAt: Date | null
  ignoredAt: Date | null
  resolvedAt: Date | null
  acknowledgedBy: string | null
  ignoredBy: string | null
  resolvedBy: string | null
  createdAt: Date
  updatedAt: Date
  rule?: {
    id: string
    name: string
    ruleType: string
  }
  notification?: {
    id: string
    title: string
    message: string
    type: string
  }
}
```

## Evaluation System

### Automatic Evaluation

Tolerance rules are automatically evaluated daily via a cron job:

- **Schedule**: Daily at 8 AM (`0 8 * * *`)
- **Job**: `ToleranceRulesEvaluationJob`
- **Process**: Evaluates all enabled rules for each organization
- **Result**: Creates exceptions and notifications as needed

### Manual Evaluation

Admins can manually trigger evaluation using `runToleranceCheck()` server action.

### Evaluation Logic

The evaluator (`src/lib/tolerance-rules/evaluator.ts`) processes each enabled rule:

1. Fetches all enabled rules for the organization
2. For each rule, evaluates based on rule type:
   - **One-on-One Frequency**: Checks days since last 1:1 meeting
   - **Initiative Check-In**: Checks days since last initiative check-in
   - **360 Feedback**: Checks months since last feedback campaign
   - **Manager Span**: Checks number of direct reports
3. Creates exceptions when thresholds are exceeded
4. Creates system notifications for new exceptions
5. Prevents duplicate exceptions (only one active exception per entity per rule)

## Notifications

When an exception is created, a system notification is automatically generated:

- **Type**: `warning` or `error` (based on exception severity)
- **Title**: Based on exception message
- **Message**: Detailed information about the exception
- **Link**: Linked to the exception via `notificationId`

See [Notifications API](./notifications.md) for notification management.

## Common Use Cases

### 1. Create a 1:1 Frequency Rule

```typescript
const rule = await createToleranceRule({
  ruleType: 'one_on_one_frequency',
  name: 'Weekly 1:1 Check',
  description: 'Ensures managers meet with reports at least weekly',
  isEnabled: true,
  config: {
    warningThresholdDays: 7,
    urgentThresholdDays: 14,
  },
})
```

### 2. Get Active Exceptions

```typescript
const activeExceptions = await getExceptions({ status: 'active' })
```

### 3. Acknowledge an Exception

```typescript
await acknowledgeException('exception_123')
```

### 4. Resolve an Exception

```typescript
await resolveException('exception_123')
```

### 5. Manually Run Tolerance Check

```typescript
const result = await runToleranceCheck()
if (result.exceptionsCreated > 0) {
  console.log(`Created ${result.exceptionsCreated} new exceptions`)
}
```

### 6. Disable a Rule Temporarily

```typescript
await toggleToleranceRule('rule_123', false)
```

## Error Handling

All server actions throw errors that should be caught:

```typescript
try {
  await createToleranceRule(input)
} catch (error) {
  if (error instanceof Error) {
    // Handle specific errors
    if (error.message.includes('administrator')) {
      // User is not an admin
    } else if (error.message.includes('organization')) {
      // User not in organization
    }
  }
}
```

## Best Practices

### Rule Configuration

1. **Start Conservative**: Begin with longer thresholds and adjust based on patterns
2. **Clear Naming**: Use descriptive names for rules
3. **Documentation**: Use descriptions to explain rule purpose
4. **Regular Review**: Review and adjust thresholds as needed

### Exception Management

1. **Regular Review**: Review active exceptions regularly
2. **Action on Urgent**: Prioritize urgent exceptions
3. **Resolve When Fixed**: Mark exceptions as resolved when issues are addressed
4. **Ignore Appropriately**: Use ignore for intentional or irrelevant exceptions

### Performance

1. **Rule Evaluation**: Runs daily automatically
2. **Manual Checks**: Use sparingly for testing or immediate needs
3. **Exception Deduplication**: System prevents duplicate exceptions automatically

## Related Documentation

- [Tolerance Rules and Exceptions System](../tolerance-rules-and-exceptions.md) - System overview
- [Notifications API](./notifications.md) - Notification management
- [Cron Job System](../cron-job-system.md) - Automatic evaluation

---

**Last Updated**: January 2025  
**API Version**: 1.0
