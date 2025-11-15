# User, People, and Organization Relationships

This document explains the core entities in ManagerOS, their relationships, constraints, and how subscriptions work.

## Table of Contents

1. [Core Entities](#core-entities)
2. [Relationships](#relationships)
3. [Subscription System](#subscription-system)
4. [Constraints and Rules](#constraints-and-rules)
5. [Common Scenarios](#common-scenarios)

---

## Core Entities

### User

A **User** represents an authenticated person who can log into ManagerOS. Users are created when someone signs up for an account.

**Key Characteristics:**

- One user account per email address (email is unique)
- Authenticated via Clerk (authentication provider)
- Can belong to zero or one organization (via `organizationId` field)
- Can be linked to zero or one Person record (via `personId` field)
- Has a role within their organization (USER, ADMIN, or OWNER)

**User Fields:**

- `id`: Unique identifier
- `email`: Unique email address
- `name`: Display name
- `clerkUserId`: Clerk authentication ID
- `organizationId`: The organization they belong to (nullable)
- `personId`: The Person record they're linked to (nullable, unique)

**Important Notes:**

- Users without an organization cannot perform most actions in the system
- Users without a linked Person cannot create one-on-ones or access personal features
- The `role` field on User is deprecated - use `OrganizationMember.role` instead

### Person

A **Person** represents a member of an organization - someone who works there or is associated with the organization. People are the actual individuals being managed in the system.

**Key Characteristics:**

- Belongs to exactly one organization
- Can be linked to zero or one User account
- Can have a manager (another Person)
- Can belong to a Team
- Has a job role, status, and other employment details

**Person Fields:**

- `id`: Unique identifier
- `name`: Full name
- `email`: Email address (optional, can be different from User email)
- `organizationId`: Required - the organization they belong to
- `teamId`: Optional - the team they're on
- `managerId`: Optional - their manager (another Person)
- `jobRoleId`: Optional - their job role
- `status`: Active, inactive, etc.

**Important Notes:**

- People exist independently of Users - you can have People records without linked User accounts
- A Person can only be linked to one User account
- People are the entities that tasks, initiatives, meetings, and feedback are associated with

### Organization

An **Organization** represents a company, team, or group that uses ManagerOS. Organizations contain all the data and users for a single entity.

**Key Characteristics:**

- Has a unique slug (URL-friendly identifier)
- Contains multiple Users, People, Teams, Initiatives, etc.
- Has subscription information tied to it
- Has a billing user who owns the subscription

**Organization Fields:**

- `id`: Unique identifier
- `name`: Organization name
- `slug`: Unique URL-friendly identifier
- `description`: Optional description
- `billingUserId`: The User who owns the subscription (nullable)
- `subscriptionPlanId`: Clerk plan ID (e.g., "plan_xxxxx" or "free")
- `subscriptionPlanName`: Human-readable plan name (e.g., "Solo", "Team")
- `subscriptionStatus`: Subscription status from Clerk

**Important Notes:**

- All data in ManagerOS is scoped to an organization
- Users can only see data from their own organization
- Subscription limits apply at the organization level

---

## Relationships

### User ↔ Organization

**Relationship Type:** Many-to-One (with OrganizationMember as join table)

**How it Works:**

- A User can belong to zero or one organization (via `organizationId` field)
- An Organization has many Users
- The relationship is also tracked in `OrganizationMember` table for multi-org support (future)

**OrganizationMember Table:**

- Links Users to Organizations
- Stores the user's role within that organization (USER, ADMIN, OWNER)
- Allows for future multi-organization support

**Roles:**

- **USER**: Regular member, can perform standard actions
- **ADMIN**: Can manage organization settings, members, and most data
- **OWNER**: Same as ADMIN, plus is the billing user for the organization

**Constraints:**

- Users without an organization cannot perform most actions
- Users can only see data from their own organization
- Only one user can be the billing user per organization

### User ↔ Person

**Relationship Type:** One-to-One (optional)

**How it Works:**

- A User can be linked to zero or one Person record
- A Person can be linked to zero or one User account
- The link is stored in `User.personId` (unique constraint)

**Why This Matters:**

- When a User is linked to a Person, they can:
  - Create and manage one-on-ones
  - Access personal reports and data
  - See their own tasks, initiatives, and feedback
- When not linked, Users can still perform admin actions but cannot access personal features

**Linking Process:**

- Only organization admins/owners can link Users to People
- Users can link themselves to an unlinked Person (if allowed)
- The link can be removed or changed by admins

**Constraints:**

- A Person can only be linked to one User
- A User can only be linked to one Person
- Both User and Person must belong to the same organization

### Person ↔ Organization

**Relationship Type:** Many-to-One (required)

**How it Works:**

- Every Person must belong to exactly one Organization
- An Organization has many People
- Stored in `Person.organizationId` (required, non-nullable)

**Constraints:**

- People cannot exist without an organization
- People can only see and interact with data from their organization
- All People in an organization share the same subscription limits

### Person ↔ Person (Manager Relationship)

**Relationship Type:** Self-referential Many-to-One

**How it Works:**

- A Person can have one manager (another Person)
- A Person can have many direct reports
- Stored in `Person.managerId` (nullable)

**Constraints:**

- Manager and report must belong to the same organization
- Cannot create circular manager relationships
- Manager relationship is optional

### Person ↔ Team

**Relationship Type:** Many-to-One (optional)

**How it Works:**

- A Person can belong to zero or one Team
- A Team has many People
- Stored in `Person.teamId` (nullable)

**Constraints:**

- Person and Team must belong to the same organization
- Teams can have a hierarchical structure (parent teams)

---

## Subscription System

### Overview

Subscriptions in ManagerOS are **Clerk organization-based**. Each ManagerOS organization has a corresponding Clerk organization, and subscriptions are tied to Clerk organizations rather than individual users.

**Key Points:**

- Each ManagerOS organization has a `clerkOrganizationId` that links to a Clerk organization
- Subscriptions are created and managed at the Clerk organization level
- All users in the organization share the same subscription limits
- Limits apply to the entire organization's data
- When users are added to a ManagerOS organization, they are also added to the corresponding Clerk organization

### Billing User

**What is a Billing User?**

- The User who selected/manages the subscription for an organization (for reference)
- Set when the organization is created (the creator becomes the billing user)
- Stored in `Organization.billingUserId`
- Must be an OWNER role in the organization

**Responsibilities:**

- This user typically manages the subscription through Clerk's organization billing interface
- The `billingUserId` field is kept for reference but subscriptions are managed at the Clerk organization level

**How It's Set:**

- When creating an organization, the creating user becomes the billing user
- The subscription is created for the Clerk organization, not the individual user
- The organization's subscription fields are populated from the Clerk organization's subscription

### Subscription Storage

Subscription information is stored on the Organization record:

```typescript
{
  clerkOrganizationId: string | null // Clerk organization ID for billing
  billingUserId: string | null // User who selected subscription (for reference)
  subscriptionPlanId: string | null // Clerk plan ID (e.g., "plan_xxxxx" or "free")
  subscriptionPlanName: string | null // "Solo", "Team", etc.
  subscriptionStatus: string | null // "active", "canceled", etc.
}
```

**Subscription Sync:**

- Subscription data is fetched from Clerk organization subscriptions when available
- Stored subscription data is used as a fallback
- Webhooks automatically update stored subscription data when Clerk subscriptions change

### Subscription Plans

#### Solo Plan (Free)

- **Price**: Free
- **Limits**:
  - Max People: 5
  - Max Initiatives: 10
  - Max Teams: 2
  - Max Feedback Campaigns: 2
- **Features**: All core features with limits

#### Team Plan (Paid)

- **Price**: Varies (set in Clerk Dashboard)
- **Limits**: Unlimited (all limits are `null`)
- **Features**: All features with no limits

### How Subscription Limits Work

1. **Limit Checking**: Before creating new entities (People, Initiatives, Teams, Feedback Campaigns), the system checks if the organization has reached its limit
2. **Enforcement**: If limit is reached, creation is blocked with an error message
3. **Viewing**: Users can still view existing entities even if over limit (per rule #10)
4. **Calculation**: Limits are based on the organization's `subscriptionPlanName`

### Subscription Updates

**Webhook Integration:**

- Clerk sends webhooks when subscriptions change
- Webhooks update the organization's subscription fields automatically
- Handled in `src/app/api/webhooks/clerk/route.ts`

**Webhook Events:**

- `subscription.created`: New subscription created for a Clerk organization
- `subscription.updated`: Subscription changed (upgrade/downgrade)
- `subscriptionItem.canceled`: Subscription canceled
- `organizationMembership.created`: User added to Clerk organization (synced to ManagerOS)
- `organizationMembership.deleted`: User removed from Clerk organization (synced to ManagerOS)

**Manual Updates:**

- Subscription info can be updated via Clerk Dashboard
- Changes sync to the organization via webhooks

---

## Constraints and Rules

### Organization-Level Isolation

**Rule**: Users who are not members of an organization should see NO data related to that organization.

**Implementation**: All database queries must filter by `organizationId` to ensure strict organization boundaries.

**Exception**: Public routes (like feedback forms) may have different access patterns.

### User Constraints

1. **Email Uniqueness**: Each email address can only have one User account
2. **Organization Membership**: Users can belong to zero or one organization
3. **Person Link**: Users can be linked to zero or one Person (must be in same organization)
4. **Authentication Required**: All protected routes require valid authentication

### Person Constraints

1. **Organization Required**: Every Person must belong to exactly one Organization
2. **User Link Uniqueness**: A Person can only be linked to one User account
3. **Manager Relationship**: Manager and report must be in the same organization
4. **Team Membership**: Person and Team must be in the same organization

### Organization Constraints

1. **Slug Uniqueness**: Organization slugs must be unique across the system
2. **Billing User**: Only one User can be the billing user per organization
3. **Subscription Required**: Organizations must have subscription information (can be free plan)
4. **Data Isolation**: All data is scoped to the organization

### Subscription Constraints

1. **One Subscription Per Organization**: Each organization has one subscription
2. **Billing User Required**: Subscription must have a billing user (the user who owns it)
3. **Limit Enforcement**: Limits are enforced at creation time, not viewing time
4. **Viewing Over Limit**: Users can view existing entities even if over limit

### Access Control Rules

#### One-on-One Meetings

- Only visible to the people who are part of the 1:1s (manager or report)
- Both manager and report must belong to the same organization

#### Feedback

- Public feedback (`isPrivate: false`): Visible to all organization members
- Private feedback (`isPrivate: true`): Only visible to the author
- All feedback must be about people in the same organization

#### Tasks

- Tasks can only be seen by:
  - The person who created them (within their organization)
  - Tasks associated with initiatives in the same organization
  - Tasks associated with objectives of initiatives in the same organization

#### Initiatives

- Anyone in the organization can see initiatives
- Filtered by `organizationId`

#### Meetings

- Anyone in the organization can see meetings
- Filtered by `organizationId`

#### Feedback Campaigns

- Only the person who created feedback campaigns can see them
- User must be a manager (direct or indirect) of the target person
- Campaigns must be for people in the same organization

---

## Common Scenarios

### Scenario 1: New User Creates Organization

1. User signs up for ManagerOS account
2. User selects a subscription plan (free or paid)
3. User creates organization with name and slug
4. **Result**:
   - Organization is created with subscription info
   - User becomes the billing user (`billingUserId` set)
   - User is added as OWNER role in OrganizationMember
   - User's `organizationId` is set
   - Subscription limits apply to the organization

### Scenario 2: User Joins Existing Organization

1. Organization admin sends invitation to user's email
2. User accepts invitation
3. **Result**:
   - User's `organizationId` is set
   - User is added as USER role in OrganizationMember
   - User can now see organization data
   - User shares the organization's subscription limits

### Scenario 3: Linking User to Person

1. Organization admin creates Person record
2. Admin links User account to Person record
3. **Result**:
   - User's `personId` is set
   - Person's link to User is established
   - User can now create one-on-ones and access personal features
   - User sees their own tasks, initiatives, and feedback

### Scenario 4: Subscription Upgrade

1. Billing user upgrades subscription in Clerk Dashboard
2. Clerk sends webhook to ManagerOS
3. **Result**:
   - Organization's `subscriptionPlanId` and `subscriptionPlanName` are updated
   - Organization's `subscriptionStatus` is updated
   - Limits are recalculated based on new plan
   - Users can now create more entities (if limits increased)

### Scenario 5: User Without Organization

1. User signs up but doesn't create or join organization
2. **Result**:
   - User can only see organization creation/join options
   - Most features are hidden (AI Chat, Notifications, etc.)
   - Command palette only shows "Create Organization"
   - User cannot perform most actions

### Scenario 6: Person Without Linked User

1. Admin creates Person record but doesn't link to User
2. **Result**:
   - Person exists in the organization
   - Person can be assigned to tasks, initiatives, teams
   - Person cannot log in or access the system
   - Person can be linked to User later

### Scenario 7: Reaching Subscription Limit

1. Organization has 5 People (Solo plan limit)
2. Admin tries to create 6th Person
3. **Result**:
   - Creation is blocked with error message
   - Existing 5 People can still be viewed and edited
   - Admin must upgrade plan to add more People

---

## Summary

### Key Takeaways

1. **Users** = People who can log in (authentication)
2. **People** = Members of the organization (the actual individuals being managed)
3. **Organizations** = Containers for all data and users
4. **Subscriptions** = Tied to organizations, not individual users
5. **Billing User** = The user who owns the subscription for an organization

### Relationship Summary

```
Organization
  ├── Has many Users (via OrganizationMember)
  │   └── User can be linked to one Person
  ├── Has many People
  │   └── Person can be linked to one User
  ├── Has one Billing User (owns subscription)
  ├── Has subscription information (plan, status)
  └── Has subscription limits (applies to all data)
```

### Important Rules

- All data is scoped to organizations
- Users can only see data from their organization
- Subscriptions apply at the organization level
- Limits are enforced at creation time
- Users can view existing entities even if over limit
- One billing user per organization
- One Person can link to one User (and vice versa)

---

## Additional Resources

- [Security Requirements](./security-requirements.mdc) - Detailed access control rules
- [Permissions System](./permissions-system.mdc) - Permission checking system
- [Clerk Billing Setup](./clerk-billing-setup.md) - Subscription setup guide
- [Subscription Utils](../src/lib/subscription-utils.ts) - Subscription limit implementation
