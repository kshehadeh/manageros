# Meetings API

## Overview

The Meetings API provides functionality for scheduling and managing meetings within an organization. Meetings can be one-time or recurring, linked to teams or initiatives, and include multiple participants.

## Security

- All meeting operations require authentication
- Meetings are scoped to the user's organization
- Users can see public meetings in their organization
- Users can see private meetings they created or are participants in
- See the [Security Requirements](../../.cursor/rules/security-requirements.mdc) for detailed access control rules

## REST Endpoints

### GET /api/meetings

Retrieves meetings for the current user.

**Authentication:** Required

**Query Parameters:**

| Parameter        | Type    | Required | Description                              |
| ---------------- | ------- | -------- | ---------------------------------------- |
| `teamId`         | string  | No       | Filter by team ID                        |
| `initiativeId`   | string  | No       | Filter by initiative ID                  |
| `from`           | string  | No       | Start date filter (ISO 8601)             |
| `to`             | string  | No       | End date filter (ISO 8601)               |
| `includePrivate` | boolean | No       | Include private meetings (default: true) |

**Response:**

```json
{
  "meetings": [
    {
      "id": "meeting_123",
      "title": "Sprint Planning",
      "description": "Plan Q4 sprint goals",
      "scheduledAt": "2025-10-20T14:00:00.000Z",
      "duration": 60,
      "location": "Conference Room A",
      "notes": "Bring updated estimates",
      "isRecurring": true,
      "recurrenceType": "weekly",
      "isPrivate": false,
      "createdAt": "2025-10-14T12:00:00.000Z",
      "updatedAt": "2025-10-14T12:00:00.000Z",
      "team": {
        "id": "team_456",
        "name": "Engineering"
      },
      "initiative": {
        "id": "init_789",
        "title": "Q4 Platform"
      },
      "owner": {
        "id": "person_101",
        "name": "Jane Smith"
      },
      "participants": [
        {
          "personId": "person_102",
          "person": {
            "id": "person_102",
            "name": "John Doe"
          },
          "status": "accepted"
        }
      ],
      "instances": []
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

### createMeeting

Creates a new meeting.

**Function Signature:**

```typescript
createMeeting(formData: MeetingFormData): Promise<Meeting>
```

**Parameters:**

```typescript
interface MeetingFormData {
  title: string // Required
  description?: string // Optional description
  scheduledAt: string // ISO 8601 date-time
  duration: number // Duration in minutes
  location?: string // Meeting location
  notes?: string // Meeting notes
  isRecurring: boolean // Is this a recurring meeting?
  recurrenceType?: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  isPrivate: boolean // Is this private?
  teamId?: string // Team ID
  initiativeId?: string // Initiative ID
  ownerId?: string // Owner person ID
  participants: Array<{
    personId: string
    status: 'invited' | 'accepted' | 'declined' | 'tentative'
  }>
}
```

**Returns:** Created meeting object

**Throws:**

- `Error: "User must belong to an organization to create meetings"`
- `Error: "Team not found or access denied"`
- `Error: "Initiative not found or access denied"`
- `Error: "Owner not found or access denied"`
- `Error: "One or more participants not found or access denied"`

**Example:**

```typescript
import { createMeeting } from '@/lib/actions/meeting'

const meeting = await createMeeting({
  title: 'Sprint Planning',
  scheduledAt: '2025-10-20T14:00:00.000Z',
  duration: 60,
  isRecurring: true,
  recurrenceType: 'weekly',
  isPrivate: false,
  teamId: 'team_123',
  participants: [
    { personId: 'person_456', status: 'invited' },
    { personId: 'person_789', status: 'invited' },
  ],
})
```

---

### updateMeeting

Updates an existing meeting.

**Function Signature:**

```typescript
updateMeeting(id: string, formData: MeetingUpdateData): Promise<Meeting>
```

**Parameters:**

- `id`: Meeting ID
- `formData`: Similar to `MeetingFormData` but all fields optional

```typescript
interface MeetingUpdateData {
  title?: string
  description?: string
  scheduledAt?: string
  duration?: number
  location?: string
  notes?: string
  isRecurring?: boolean
  recurrenceType?: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  isPrivate?: boolean
  teamId?: string
  initiativeId?: string
  ownerId?: string
  participants?: Array<{
    personId: string
    status: 'invited' | 'accepted' | 'declined' | 'tentative'
  }>
}
```

**Returns:** Updated meeting object

**Throws:**

- `Error: "User must belong to an organization to update meetings"`
- `Error: "Meeting not found or access denied"`
- `Error: "Team not found or access denied"`
- `Error: "Initiative not found or access denied"`
- `Error: "Owner not found or access denied"`
- `Error: "One or more participants not found or access denied"`

---

### deleteMeeting

Deletes a meeting.

**Function Signature:**

```typescript
deleteMeeting(id: string): Promise<void>
```

**Parameters:**

- `id`: Meeting ID to delete

**Returns:** `void`

**Throws:**

- `Error: "User must belong to an organization to delete meetings"`
- `Error: "Meeting not found or access denied"`

---

### getMeetings

Retrieves all accessible meetings for the current user.

**Function Signature:**

```typescript
getMeetings(): Promise<Meeting[]>
```

**Returns:** Array of meeting objects

**Access Control:**

Returns meetings that are:

- Public meetings in the organization
- Private meetings created by the current user
- Private meetings where the current user is a participant

---

### getMeeting

Retrieves a single meeting by ID.

**Function Signature:**

```typescript
getMeeting(id: string): Promise<Meeting>
```

**Parameters:**

- `id`: Meeting ID

**Returns:** Meeting object

**Throws:**

- `Error: "User must belong to an organization to view meetings"`
- `Error: "Meeting not found or access denied"`

---

### addMeetingParticipant

Adds a participant to a meeting.

**Function Signature:**

```typescript
addMeetingParticipant(
  meetingId: string,
  personId: string,
  status?: string
): Promise<MeetingParticipant>
```

**Parameters:**

- `meetingId`: Meeting ID
- `personId`: Person ID to add
- `status`: Participant status (default: 'invited')

**Returns:** Created participant object

**Throws:**

- `Error: "User must belong to an organization to manage meeting participants"`
- `Error: "Meeting not found or access denied"`
- `Error: "Person not found or access denied"`
- `Error: "Person is already a participant in this meeting"`

---

### updateMeetingParticipantStatus

Updates a participant's status in a meeting.

**Function Signature:**

```typescript
updateMeetingParticipantStatus(
  meetingId: string,
  personId: string,
  status: string
): Promise<MeetingParticipant>
```

**Parameters:**

- `meetingId`: Meeting ID
- `personId`: Person ID
- `status`: New status ('invited', 'accepted', 'declined', 'tentative')

**Returns:** Updated participant object

**Throws:**

- `Error: "User must belong to an organization to manage meeting participants"`
- `Error: "Meeting not found or access denied"`

---

### removeMeetingParticipant

Removes a participant from a meeting.

**Function Signature:**

```typescript
removeMeetingParticipant(meetingId: string, personId: string): Promise<void>
```

**Parameters:**

- `meetingId`: Meeting ID
- `personId`: Person ID to remove

**Returns:** `void`

**Throws:**

- `Error: "User must belong to an organization to manage meeting participants"`
- `Error: "Meeting not found or access denied"`

---

### importMeetingFromICS

Imports a meeting from an ICS (iCalendar) file.

**Function Signature:**

```typescript
importMeetingFromICS(fileContent: string): Promise<ImportedMeetingData>
```

**Parameters:**

- `fileContent`: ICS file content as string

**Returns:** Parsed meeting data with matched participants

```typescript
interface ImportedMeetingData {
  title: string
  description?: string
  scheduledAt: string
  duration?: number
  location?: string
  participants: Array<{ personId: string; status: 'invited' }>
  ownerId?: string
}
```

**Throws:**

- `Error: "User must belong to an organization to import meetings"`

**Note:** This function attempts to match attendee emails to people in the organization.

---

### matchAttendeesToPeople

Matches email addresses to people in the organization.

**Function Signature:**

```typescript
matchAttendeesToPeople(
  attendeeEmails: string[],
  organizerEmail?: string
): Promise<MatchedAttendees>
```

**Parameters:**

- `attendeeEmails`: Array of email addresses
- `organizerEmail`: Organizer's email address

**Returns:** Matched attendees and owner

```typescript
interface MatchedAttendees {
  participants: Array<{ personId: string; status: 'invited' }>
  ownerId?: string
}
```

**Matching Logic:**

1. Exact email match (case-insensitive)
2. Fuzzy name matching from email local part

## Meeting Recurrence Types

- `daily` - Repeats every day
- `weekly` - Repeats every week
- `biweekly` - Repeats every two weeks
- `monthly` - Repeats every month

## Participant Status Values

- `invited` - Participant has been invited
- `accepted` - Participant has accepted
- `declined` - Participant has declined
- `tentative` - Participant is tentative

## Access Control

Meetings follow these access rules:

1. Public meetings (`isPrivate: false`) are visible to all organization members
2. Private meetings (`isPrivate: true`) are only visible to:
   - The meeting creator
   - Meeting participants
3. All related entities (team, initiative, participants) must be in the same organization

## Related APIs

- [People API](./people.md) - For managing meeting participants
- [Teams API](./teams.md) - For team meetings
- [Initiatives API](./initiatives.md) - For initiative-related meetings
- [One-on-Ones API](./oneonones.md) - For one-on-one meetings
