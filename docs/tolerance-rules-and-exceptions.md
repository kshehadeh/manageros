# Tolerance Rules and Exceptions System

## Overview

The tolerance rules and exceptions system provides automated monitoring of organizational metrics and generates exceptions when thresholds are exceeded. This system helps organizations maintain healthy practices around one-on-ones, initiative check-ins, feedback cycles, and management span.

## Architecture

### Core Components

- **Tolerance Rules**: Configurable rules that define thresholds for various organizational metrics
- **Exception Evaluator**: Engine that evaluates rules and creates exceptions when thresholds are exceeded
- **Exceptions**: Records created when a rule threshold is exceeded
- **Notifications**: System notifications generated for exceptions to alert relevant users

### Database Models

- **OrganizationToleranceRule**: Stores tolerance rule definitions
- **Exception**: Records of threshold violations with status tracking
- **Notification**: System notifications linked to exceptions

## Tolerance Rule Types

### 1. One-on-One Frequency (`one_on_one_frequency`)

**Purpose**: Monitors whether managers are having regular one-on-one meetings with their direct reports.

**Configuration**:

```typescript
{
  warningThresholdDays: number // Days before warning exception
  urgentThresholdDays: number // Days before urgent exception
}
```

**Evaluation Logic**:

- Finds all active managers with active direct reports
- For each manager-report pair, finds the most recent one-on-one meeting
- Calculates days since last meeting
- Creates exceptions if:
  - Days since > `warningThresholdDays` → Warning exception
  - Days since > `urgentThresholdDays` → Urgent exception
- Only creates one exception per manager-report pair (doesn't duplicate if one already exists)

**Exception Details**:

- Entity Type: `OneOnOne`
- Entity ID: The one-on-one relationship ID
- Severity: `warning` or `urgent` based on threshold
- Message: Includes manager name, report name, and days since last meeting

### 2. Initiative Check-In (`initiative_checkin`)

**Purpose**: Monitors whether active initiatives have had recent check-ins.

**Configuration**:

```typescript
{
  warningThresholdDays: number // Days since last check-in before warning
}
```

**Evaluation Logic**:

- Finds all active initiatives (status: `planned` or `in_progress`)
- For each initiative, finds the most recent check-in date
- If no check-in exists, treats as exceeding threshold
- Creates warning exception if days since last check-in > `warningThresholdDays`
- Only creates one exception per initiative (doesn't duplicate if one already exists)

**Exception Details**:

- Entity Type: `Initiative`
- Entity ID: The initiative ID
- Severity: `warning`
- Message: Includes initiative name and days since last check-in (or "never" if no check-in)

### 3. Feedback 360 (`feedback_360`)

**Purpose**: Monitors whether people have received 360 feedback within a specified time period.

**Configuration**:

```typescript
{
  warningThresholdMonths: number // Months since last feedback before warning
}
```

**Evaluation Logic**:

- Finds all active people in the organization
- For each person, finds the most recent feedback campaign where they were the target
- Calculates months since last feedback
- Creates warning exception if months since > `warningThresholdMonths`
- Only creates one exception per person (doesn't duplicate if one already exists)

**Exception Details**:

- Entity Type: `FeedbackCampaign`
- Entity ID: The most recent feedback campaign ID (if exists)
- Severity: `warning`
- Message: Includes person name and months since last feedback (or "never" if no feedback)

### 4. Manager Span (`manager_span`)

**Purpose**: Monitors whether managers have too many direct reports.

**Configuration**:

```typescript{
  maxDirectReports: number  // Maximum allowed direct reports
}
```

**Evaluation Logic**:

- Finds all active managers in the organization
- Counts active direct reports for each manager
- Creates urgent exception if count > `maxDirectReports`
- Only creates one exception per manager (doesn't duplicate if one already exists)

**Exception Details**:

- Entity Type: `Person`
- Entity ID: The manager's person ID
- Severity: `urgent`
- Message: Includes manager name and current direct report count

## Exception Lifecycle

### Exception Statuses

1. **active**: Newly created exception that hasn't been acted upon
2. **acknowledged**: Exception has been acknowledged by a user
3. **ignored**: Exception has been intentionally ignored
4. **resolved**: Exception has been resolved (underlying issue fixed)

### Exception Workflow

1. **Creation**: Exception is created when a tolerance rule threshold is exceeded
2. **Notification**: System notification is automatically created and linked to the exception
3. **User Action**: Users can acknowledge, ignore, or resolve exceptions
4. **Status Tracking**: All status changes are tracked with timestamps and user IDs

## Evaluation System

### Automatic Evaluation

Tolerance rules are automatically evaluated daily via a cron job (`ToleranceRulesEvaluationJob`):

- **Schedule**: Daily at 8 AM (`0 8 * * *`)
- **Process**: Evaluates all enabled rules for each organization
- **Results**: Creates exceptions and notifications as needed

### Manual Evaluation

Admins can manually trigger tolerance checks:

- **Server Action**: `runToleranceCheck()` in `src/lib/actions/tolerance-rules.ts`
- **UI**: "Run Check Now" button on tolerance rules settings page
- **Access**: Admin-only
- **Result**: Returns count of exceptions created and any errors

### Evaluation Process

1. Fetch all enabled tolerance rules for the organization
2. For each rule:
   - Evaluate based on rule type
   - Check for existing active exceptions (to avoid duplicates)
   - Create exceptions when thresholds exceeded
   - Create system notifications for new exceptions
3. Return summary of exceptions created and any errors

## Notifications

### Automatic Notification Creation

When an exception is created, a system notification is automatically generated:

- **Type**: `warning` or `error` (based on exception severity)
- **Title**: Based on exception message
- **Message**: Detailed information about the exception
- **Link**: Linked to the exception via `notificationId`
- **Recipients**: Organization-wide or user-specific based on exception type

### Notification Response Tracking

When users interact with exception notifications:

- Acknowledging a notification also acknowledges the linked exception
- Ignoring a notification also ignores the linked exception
- Resolving a notification also resolves the linked exception

## API and Server Actions

### Tolerance Rules

**Location**: `src/lib/actions/tolerance-rules.ts`

- `createToleranceRule()`: Create a new tolerance rule (admin only)
- `updateToleranceRule()`: Update an existing rule (admin only)
- `deleteToleranceRule()`: Delete a rule (admin only)
- `getToleranceRules()`: Get all rules for organization
- `getToleranceRuleById()`: Get a single rule by ID
- `toggleToleranceRule()`: Enable/disable a rule (admin only)
- `runToleranceCheck()`: Manually trigger evaluation (admin only)

### Exceptions

**Location**: `src/lib/actions/exceptions.ts`

- `createException()`: Create a new exception (typically called by evaluator)
- `getExceptions()`: Get exceptions with optional filters
- `getExceptionById()`: Get a single exception by ID
- `acknowledgeException()`: Acknowledge an exception
- `ignoreException()`: Ignore an exception
- `resolveException()`: Resolve an exception
- `linkExceptionToNotification()`: Link exception to notification

### Evaluator

**Location**: `src/lib/tolerance-rules/evaluator.ts`

- `evaluateAllRules()`: Evaluate all enabled rules for an organization
- Internal functions for each rule type evaluation

## Security and Access Control

### Tolerance Rules

- Only organization admins can create, update, delete, or toggle rules
- All users in the organization can view rules
- Rules are scoped to a single organization

### Exceptions

- All organization members can view exceptions for their organization
- Users can acknowledge, ignore, or resolve exceptions
- Exceptions are filtered by organization ID

### Notifications

- Notifications follow standard notification access rules
- Organization-wide notifications visible to all org members
- User-specific notifications only visible to target user

## Best Practices

### Rule Configuration

1. **Start Conservative**: Begin with longer thresholds and adjust based on actual patterns
2. **Regular Review**: Review exceptions regularly to identify patterns
3. **Clear Naming**: Use descriptive names for rules to make their purpose clear
4. **Documentation**: Use rule descriptions to explain why the rule exists

### Exception Management

1. **Regular Review**: Review active exceptions regularly
2. **Action on Urgent**: Prioritize urgent exceptions
3. **Resolve When Fixed**: Mark exceptions as resolved when underlying issues are addressed
4. **Ignore Appropriately**: Use ignore for exceptions that are intentional or no longer relevant

### Performance Considerations

1. **Rule Evaluation**: Evaluation runs daily, so rules should be efficient
2. **Exception Deduplication**: System prevents duplicate exceptions for the same entity
3. **Notification Batching**: Consider notification preferences to avoid notification fatigue

## Troubleshooting

### Exceptions Not Being Created

- Verify rule is enabled (`isEnabled: true`)
- Check rule configuration is valid
- Review evaluation logs for errors
- Manually trigger check to see immediate results

### Too Many Exceptions

- Review threshold values - may be too strict
- Consider disabling rules that are no longer relevant
- Resolve or ignore exceptions that are no longer actionable

### Evaluation Errors

- Check cron job execution logs
- Verify database connectivity
- Review rule configurations for invalid data
- Check for missing related entities (e.g., deleted people, initiatives)

## Future Enhancements

Potential improvements to the system:

- Custom rule types via plugin system
- Rule templates for common scenarios
- Exception analytics and reporting
- Automated resolution suggestions
- Integration with external monitoring systems
- Rule scheduling (e.g., weekly vs daily evaluation)
