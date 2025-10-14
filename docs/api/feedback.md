# Feedback API

## Overview

The Feedback API provides functionality for giving and receiving feedback about people in an organization. Feedback can be public (visible to all organization members) or private (visible only to the author).

## Security

- All feedback operations require authentication
- Users must have a linked person record to create feedback
- Public feedback (`isPrivate: false`) is visible to all organization members
- Private feedback (`isPrivate: true`) is only visible to the author
- Feedback can only be given to people in the same organization
- See the [Security Requirements](../../.cursor/rules/security-requirements.mdc) for detailed access control rules

## REST Endpoints

### GET /api/feedback

Retrieves feedback based on filter criteria.

**Authentication:** Required

**Query Parameters:**

| Parameter   | Type    | Required | Description                                                     |
| ----------- | ------- | -------- | --------------------------------------------------------------- |
| `aboutId`   | string  | No       | Filter feedback about a specific person                         |
| `fromId`    | string  | No       | Filter feedback from a specific person                          |
| `kind`      | string  | No       | Filter by feedback kind (`positive`, `constructive`, `general`) |
| `isPrivate` | boolean | No       | Filter by privacy setting                                       |

**Response:**

```json
{
  "feedback": [
    {
      "id": "feedback_123",
      "aboutId": "person_456",
      "fromId": "person_789",
      "kind": "positive",
      "isPrivate": false,
      "body": "Great work on the Q3 project!",
      "createdAt": "2025-10-14T12:00:00.000Z",
      "updatedAt": "2025-10-14T12:00:00.000Z",
      "about": {
        "id": "person_456",
        "name": "John Doe"
      },
      "from": {
        "id": "person_789",
        "name": "Jane Smith"
      }
    }
  ]
}
```

**Status Codes:**

- `200 OK` - Success
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User not in organization
- `500 Internal Server Error` - Server error

## Server Actions

### createFeedback

Creates new feedback for a person.

**Function Signature:**

```typescript
createFeedback(formData: FeedbackFormData): Promise<Feedback>
```

**Parameters:**

```typescript
interface FeedbackFormData {
  aboutId: string // Person receiving feedback
  kind: 'positive' | 'constructive' | 'general' // Feedback type
  isPrivate: boolean // Privacy setting
  body: string // Feedback content
}
```

**Returns:** Created feedback object

**Throws:**

- `Error: "User must belong to an organization to create feedback"`
- `Error: "No person record found for current user"`
- `Error: "Person not found or access denied"`

**Example:**

```typescript
import { createFeedback } from '@/lib/actions/feedback'

const feedback = await createFeedback({
  aboutId: 'person_123',
  kind: 'positive',
  isPrivate: false,
  body: 'Excellent presentation at the team meeting. Your clarity and insights were very helpful.',
})
```

---

### updateFeedback

Updates existing feedback (only by the author).

**Function Signature:**

```typescript
updateFeedback(id: string, formData: FeedbackFormData): Promise<Feedback>
```

**Parameters:**

- `id`: Feedback ID to update
- `formData`: Same as `createFeedback`

**Returns:** Updated feedback object

**Throws:**

- `Error: "User must belong to an organization to update feedback"`
- `Error: "No person record found for current user"`
- `Error: "Feedback not found or you do not have permission to edit it"`
- `Error: "Person not found or access denied"`

**Access Control:** Only the feedback author can update it.

**Example:**

```typescript
await updateFeedback('feedback_123', {
  aboutId: 'person_123',
  kind: 'positive',
  isPrivate: false,
  body: 'Updated: Excellent presentation. The data visualizations were particularly effective.',
})
```

---

### deleteFeedback

Deletes feedback (only by the author).

**Function Signature:**

```typescript
deleteFeedback(id: string): Promise<void>
```

**Parameters:**

- `id`: Feedback ID to delete

**Returns:** `void`

**Throws:**

- `Error: "User must belong to an organization to delete feedback"`
- `Error: "No person record found for current user"`
- `Error: "Feedback not found or you do not have permission to delete it"`

**Access Control:** Only the feedback author can delete it.

---

### getFeedbackForPerson

Retrieves all accessible feedback for a specific person.

**Function Signature:**

```typescript
getFeedbackForPerson(personId: string): Promise<Feedback[]>
```

**Parameters:**

- `personId`: Person ID to get feedback for

**Returns:** Array of feedback objects

```typescript
interface Feedback {
  id: string
  aboutId: string
  fromId: string
  kind: 'positive' | 'constructive' | 'general'
  isPrivate: boolean
  body: string
  createdAt: Date
  updatedAt: Date
  about: {
    id: string
    name: string
  }
  from: {
    id: string
    name: string
  }
}
```

**Throws:**

- `Error: "User must belong to an organization to view feedback"`
- `Error: "No person record found for current user"`
- `Error: "Person not found or access denied"`

**Access Control:**

Returns feedback that is either:

- Public (`isPrivate: false`)
- Private feedback written by the current user

**Example:**

```typescript
const feedback = await getFeedbackForPerson('person_123')
// Returns all public feedback + private feedback authored by current user
```

---

### getFeedbackById

Retrieves a single feedback item by ID.

**Function Signature:**

```typescript
getFeedbackById(id: string): Promise<Feedback>
```

**Parameters:**

- `id`: Feedback ID

**Returns:** Feedback object

**Throws:**

- `Error: "User must belong to an organization to view feedback"`
- `Error: "No person record found for current user"`
- `Error: "Feedback not found or you do not have access to it"`

**Access Control:**

Only returns feedback if:

- It's public (`isPrivate: false`), OR
- The current user is the author

**Example:**

```typescript
const feedback = await getFeedbackById('feedback_123')
if (feedback) {
  console.log(
    `Feedback from ${feedback.from.name} about ${feedback.about.name}`
  )
}
```

## Feedback Kinds

Three types of feedback are supported:

- `positive` - Positive feedback, recognition, praise
- `constructive` - Constructive criticism, areas for improvement
- `general` - General observations or neutral feedback

## Privacy Levels

Feedback has two privacy levels:

### Public Feedback (`isPrivate: false`)

- Visible to all users in the organization
- Shows in the person's feedback history
- Can be referenced in performance reviews
- Best for recognition and documented feedback

### Private Feedback (`isPrivate: true`)

- Only visible to the feedback author
- Useful for personal notes or sensitive observations
- Not visible to the person receiving feedback
- Not visible to other team members or managers

## Access Control

Feedback follows these access rules:

### Creating Feedback

1. User must have a linked person record
2. User must be in an organization
3. Recipient must be in the same organization

### Viewing Feedback

**For a person's feedback:**

- ✅ Public feedback - visible to all organization members
- ✅ Private feedback - visible only to the author
- ❌ Private feedback - not visible to other users (including the recipient)

**Individual feedback item:**

- Same rules as above

### Updating/Deleting Feedback

- ✅ Only the author can update their own feedback
- ✅ Only the author can delete their own feedback
- ❌ Recipients cannot edit feedback about them
- ❌ Managers cannot edit feedback about their reports

## Use Cases

### 1. Giving Public Recognition

```typescript
await createFeedback({
  aboutId: 'engineer_id',
  kind: 'positive',
  isPrivate: false,
  body: 'Excellent work resolving the production incident. Your quick thinking and clear communication helped minimize impact.',
})
```

### 2. Documenting Constructive Feedback

```typescript
await createFeedback({
  aboutId: 'team_member_id',
  kind: 'constructive',
  isPrivate: false,
  body: 'Would benefit from more proactive communication during code reviews. Consider providing context with review comments.',
})
```

### 3. Private Notes (Manager Use Case)

```typescript
await createFeedback({
  aboutId: 'report_id',
  kind: 'general',
  isPrivate: true,
  body: 'Personal note: Seemed stressed during 1:1. Follow up next week about workload and work-life balance.',
})
```

### 4. Peer Feedback

```typescript
await createFeedback({
  aboutId: 'peer_id',
  kind: 'positive',
  isPrivate: false,
  body: 'Great collaboration on the feature launch. Your attention to detail caught several edge cases.',
})
```

## Data Model

### Feedback Schema

```typescript
interface Feedback {
  id: string
  aboutId: string // Person receiving feedback
  fromId: string // Person giving feedback
  kind: 'positive' | 'constructive' | 'general'
  isPrivate: boolean
  body: string
  createdAt: Date
  updatedAt: Date

  // Relations
  about: Person // Person receiving feedback
  from: Person // Person giving feedback
}
```

## Related APIs

- [People API](./people.md) - For managing feedback recipients and authors
- [One-on-Ones API](./oneonones.md) - For giving feedback during one-on-ones
- [Feedback Campaigns API](./feedback-campaigns.md) - For structured feedback collection
- [Organizations API](./organizations.md) - For user-person linking

## Best Practices

### 1. Timeliness

Give feedback soon after the observed behavior:

```typescript
// Good: Timely feedback
await createFeedback({
  aboutId: 'person_id',
  kind: 'positive',
  isPrivate: false,
  body: 'Great presentation this morning. The data visualizations made the complex metrics easy to understand.',
})
```

### 2. Specificity

Be specific with examples:

```typescript
// Good: Specific feedback
await createFeedback({
  aboutId: 'person_id',
  kind: 'constructive',
  isPrivate: false,
  body: 'During the API design review (10/14), the error handling approach could be more comprehensive. Consider documenting expected error codes and retry logic.',
})

// Avoid: Vague feedback
// "Could improve API design skills"
```

### 3. Balance

Provide both positive and constructive feedback:

```typescript
// Create both types for balanced view
await createFeedback({
  aboutId: 'person_id',
  kind: 'positive',
  isPrivate: false,
  body: 'Excellent technical implementation on the payment flow.',
})

await createFeedback({
  aboutId: 'person_id',
  kind: 'constructive',
  isPrivate: false,
  body: 'Documentation could be more detailed for complex edge cases.',
})
```

### 4. Privacy Considerations

Choose appropriate privacy levels:

```typescript
// Public: For documented, actionable feedback
await createFeedback({
  aboutId: 'person_id',
  kind: 'constructive',
  isPrivate: false,
  body: 'Consider providing more context in pull request descriptions.',
})

// Private: For sensitive notes or observations
await createFeedback({
  aboutId: 'person_id',
  kind: 'general',
  isPrivate: true,
  body: 'Mentioned interest in moving to backend work during coffee chat.',
})
```

### 5. Regular Cadence

Give feedback regularly, not just during reviews:

```typescript
// Weekly or bi-weekly feedback is more valuable than annual reviews
const weeklyfeedback = await createFeedback({
  aboutId: 'report_id',
  kind: 'positive',
  isPrivate: false,
  body: 'Week of 10/14: Excellent progress on the refactoring work. On track for Q4 goals.',
})
```
