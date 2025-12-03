# Tolerance Rules Race Condition Fix

## Issue Summary

A race condition was identified in the tolerance rules evaluation system where concurrent calls to `runToleranceCheck()` could create duplicate exceptions. This occurred because the code used a check-then-act pattern without proper synchronization.

## Root Cause

The evaluator functions used a non-atomic check-then-act pattern:

1. Check for existing exception (non-atomic read)
2. If none exists, create exception (non-atomic write)

When two concurrent calls occurred:

- Both threads check for existing exception → both find none
- Both threads create exception → duplicates created

## Fix Applied

### 1. Transaction-Based Atomic Operations

Modified `createExceptionForOneOnOneSafely()` to use Prisma transactions with `Serializable` isolation level:

- Wraps the check-and-create in a single transaction
- Uses highest isolation level to prevent race conditions
- Returns `true` if exception was created, `false` if it already existed

### 2. Error Handling

Added handling for unique constraint violations (Prisma error code `P2002`):

- If a unique constraint is added to the database, concurrent attempts will be caught
- Gracefully handles the case where another process created the exception

### 3. Remaining Work

The following evaluation functions still need to be updated to use the same transaction-based pattern:

- `evaluateInitiativeCheckIn()` - Lines 388-463
- `evaluateFeedback360()` - Lines 465-549
- `evaluateManagerSpan()` - Lines 651-765

Each should be updated to:

1. Use a transaction-based safe creation function similar to `createExceptionForOneOnOneSafely()`
2. Handle unique constraint violations
3. Create notifications outside the transaction

## Recommended Database Constraint

To provide an additional layer of protection, consider adding a partial unique index to the database:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS "Exception_ruleId_organizationId_entityType_entityId_status_active_unique"
ON "Exception" ("ruleId", "organizationId", "entityType", "entityId")
WHERE "status" = 'active';
```

This ensures only one active exception per (ruleId, organizationId, entityType, entityId) combination at the database level, while allowing multiple exceptions with different statuses (e.g., one active, one resolved).

**Note**: This requires a Prisma migration. The transaction-based approach provides protection even without this constraint, but the constraint adds an extra safety layer.

## Testing

To test the fix:

1. **Concurrent Execution Test**:
   - Trigger multiple `runToleranceCheck()` calls simultaneously
   - Verify only one exception is created per rule+entity combination

2. **Manual Test**:
   - Create a tolerance rule
   - Trigger evaluation multiple times quickly
   - Verify no duplicate exceptions are created

3. **Database Constraint Test** (if constraint is added):
   - Attempt to create duplicate exceptions directly via database
   - Verify constraint prevents duplicates

## Files Modified

- `src/lib/tolerance-rules/evaluator.ts`:
  - Added `createExceptionForOneOnOneSafely()` function with transaction-based logic
  - Updated `evaluateOneOnOneFrequency()` to use the safe function
  - Added `createNotificationForOneOnOneException()` helper function

## Files Still Needing Updates

- `src/lib/tolerance-rules/evaluator.ts`:
  - `evaluateInitiativeCheckIn()` - needs transaction-based safe creation
  - `evaluateFeedback360()` - needs transaction-based safe creation
  - `evaluateManagerSpan()` - needs transaction-based safe creation

## Migration Path

1. ✅ Fix applied to one-on-one frequency evaluation
2. ⏳ Apply same pattern to initiative check-in evaluation
3. ⏳ Apply same pattern to feedback 360 evaluation
4. ⏳ Apply same pattern to manager span evaluation
5. ⏳ (Optional) Add database unique constraint via migration

---

**Date**: January 2025  
**Status**: Partial fix applied - one-on-one frequency evaluation fixed, other evaluation functions need updates
