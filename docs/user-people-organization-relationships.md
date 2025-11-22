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
- The `role` field on User comes from Clerk session claims - organization membership is managed by Clerk

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

**Relationship Type:** Many-to-One (managed by Clerk)

**How it Works:**

- A User can belong to zero or one organization (via `organizationId` field)
- An Organization has many Users
- Organization membership is managed by Clerk - users are added/removed via Clerk API
- User roles come from Clerk session claims (`org:admin` or `org:member`)
- OWNER role is determined by checking if user is the billing user (`billingUserId`)

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

- The User who is the payer for the organization's subscription in Clerk
- Determined from Clerk subscription's `payer.user_id` field
- Must be an OWNER role in the organization (org:admin + billing user = OWNER)

**Responsibilities:**

- This user manages the subscription through Clerk's organization billing interface
- The billing user is determined dynamically from Clerk subscription data, not stored in the database

**How It's Determined:**

- Fetched from Clerk organization subscription API (`subscription_items[0].payer.user_id`)
- The `isBillingUser()` helper function checks if a Clerk user ID matches the subscription payer
- OWNER role is determined by checking if user is both `org:admin` in Clerk AND the billing user

### Subscription Storage

**Important**: Subscription information is **NOT stored in the ManagerOS database**. All subscription data is stored in Clerk and fetched on-demand via the Clerk API.

The following fields in the Organization model are **deprecated** and kept only for backward compatibility:

- `billingUserId` - Billing user is determined from Clerk subscription payer information
- `subscriptionPlanId` - Fetched from Clerk organization subscription API
- `subscriptionPlanName` - Fetched from Clerk organization subscription API
- `subscriptionStatus` - Fetched from Clerk organization subscription API

**How Subscription Data is Retrieved:**

- Subscription data is always fetched from Clerk organization subscriptions API
- No database fallback - Clerk is the single source of truth
- Webhooks receive subscription updates but do not store them in the database
- The `getOrganizationSubscription()` function fetches directly from Clerk

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
4. **Calculation**: Limits are based on the subscription plan name fetched from Clerk organization subscription API

### Subscription Updates

**Webhook Integration:**

- Clerk sends webhooks when subscriptions change
- Webhooks are received but do NOT update database (subscription info is in Clerk only)
- Webhooks verify organization exists and log subscription changes
- Handled in `src/app/api/webhooks/clerk/route.ts`

**Webhook Events:**

- `subscription.created`: New subscription created for a Clerk organization (logged, not stored)
- `subscription.updated`: Subscription changed (logged, not stored)
- `subscriptionItem.canceled`: Subscription canceled (logged, not stored)
- `organizationMembership.created`: User added to Clerk organization
- `organizationMembership.deleted`: User removed from Clerk organization

**Manual Updates:**

- Subscription info can be updated via Clerk Dashboard
- Changes are immediately available via Clerk API (no database sync needed)

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

## User Registration and Organization Creation Flow

This section details the step-by-step process of how users register, how organizations are created, and how Clerk users and organizations map to ManagerOS database records.

### Clerk as Source of Truth

**Important**: Clerk is the source of truth for:

- User authentication and identity
- Organization membership
- User roles within organizations (`org:admin` or `org:member`)
- Organization names and slugs

ManagerOS database stores:

- User records linked to Clerk users via `clerkUserId`
- Organization records linked to Clerk organizations via `clerkOrganizationId`
- Additional ManagerOS-specific data (People, Tasks, Initiatives, etc.)

### User Registration Flow

#### Step 1: User Signs Up via Clerk

When a user signs up through Clerk (either via email/password, OAuth, etc.):

1. **Clerk creates the user** in Clerk's system
   - Clerk assigns a unique `clerkUserId`
   - User's email, name, and authentication method are stored in Clerk

2. **Clerk webhook fires**: `user.created` event is sent to ManagerOS
   - Webhook handler: `src/app/api/webhooks/clerk/route.ts`

3. **ManagerOS creates User record** (if it doesn't exist):

   ```typescript
   // Database User record created:
   {
     id: "manageros_user_id",           // ManagerOS internal ID
     email: "user@example.com",         // From Clerk
     name: "John Doe",                  // From Clerk
     clerkUserId: "clerk_user_123",     // Links to Clerk user
     personId: null,                    // Not linked yet
     createdAt: "2024-01-01T00:00:00Z"
   }
   ```

4. **Pending invitation check**:
   - If user was invited to an organization, the invitation is marked as accepted
   - User is added to the Clerk organization (if invitation exists)

5. **Sync to Clerk metadata**:
   - ManagerOS user data is synced back to Clerk's public metadata
   - This allows the data to be included in JWT session tokens

#### Step 2: User Authentication (getCurrentUser)

Every request calls `getCurrentUser()` which:

1. **Reads Clerk session claims**:
   - Gets `clerkUserId` from Clerk session
   - Gets organization info from `sessionClaims.o` (Clerk organization)
   - Gets metadata from `sessionClaims.metadata` (ManagerOS data)

2. **Creates User record if missing**:
   - If no ManagerOS User exists for the `clerkUserId`, one is created automatically
   - This handles cases where webhooks might have failed

3. **Links to Organization**:
   - If Clerk session has an organization (`sessionClaims.o.id`):
     - Looks up ManagerOS Organization by `clerkOrganizationId`
     - If Organization doesn't exist in ManagerOS, creates it automatically
     - Sets `managerOSOrganizationId` in user metadata

4. **Syncs data back to Clerk**:
   - Updates Clerk public metadata with ManagerOS IDs
   - This ensures session claims stay in sync

### Organization Creation Flow

#### Step 1: User Initiates Organization Creation

When a user calls `createOrganization()`:

1. **Validation**:
   - Checks user doesn't already belong to an organization
   - Validates organization name and slug

2. **Create Clerk Organization**:

   ```typescript
   // Clerk organization created first
   const clerkOrg = await createClerkOrganization(name, slug)
   // Returns: { id: "clerk_org_123", name: "Acme Corp", slug: "acme-corp" }
   ```

3. **Fetch Subscription Info**:
   - Gets subscription from Clerk organization (if exists)
   - Falls back to user subscription (for migration)
   - Falls back to free plan if no subscription

4. **Create ManagerOS Organization**:

   ```typescript
   // Database Organization record created:
   {
     id: "manageros_org_id",            // ManagerOS internal ID
     clerkOrganizationId: "clerk_org_123", // Links to Clerk org
     billingUserId: "manageros_user_id",   // Creator becomes billing user
     subscriptionPlanId: "plan_free",      // From Clerk
     subscriptionPlanName: "Solo",        // From Clerk
     subscriptionStatus: "active",        // From Clerk
     createdAt: "2024-01-01T00:00:00Z"
   }
   ```

5. **Add User to Clerk Organization**:
   - User is added to Clerk organization with `org:admin` role
   - This happens via Clerk API: `addUserToClerkOrganization()`

6. **Sync User Data to Clerk**:
   - User's metadata is updated with organization info
   - Role information is synced to Clerk session claims

### Mapping Between Clerk and ManagerOS

#### User Mapping

```
Clerk User                    ManagerOS User
─────────────────            ──────────────────────
id: "clerk_user_123"    →    clerkUserId: "clerk_user_123"
email: "user@example.com"    email: "user@example.com"
firstName: "John"            name: "John Doe"
lastName: "Doe"
```

**Key Points**:

- `User.clerkUserId` is the foreign key linking to Clerk
- ManagerOS User is created automatically when Clerk user signs up
- User can exist in ManagerOS before being in an organization

#### Organization Mapping

```
Clerk Organization            ManagerOS Organization
─────────────────────         ───────────────────────────
id: "clerk_org_123"      →    clerkOrganizationId: "clerk_org_123"
name: "Acme Corp"              (name stored in Clerk only)
slug: "acme-corp"              (slug stored in Clerk only)
                              billingUserId: "manageros_user_id"
                              subscriptionPlanId: "plan_free"
                              subscriptionPlanName: "Solo"
```

**Key Points**:

- `Organization.clerkOrganizationId` is the foreign key linking to Clerk
- Organization name and slug are stored in Clerk, not in ManagerOS database
- Subscription info is synced from Clerk to ManagerOS

#### Role Mapping

```
Clerk Role              ManagerOS Role        Condition
─────────────           ────────────────      ────────────────
org:admin          →    ADMIN                 (if not billing user)
org:admin          →    OWNER                 (if billingUserId matches)
org:member         →    USER                  (always)
```

**Key Points**:

- Roles come from Clerk organization membership
- OWNER is determined by checking if user is the `billingUserId`
- Roles are NOT stored in ManagerOS database (Clerk is source of truth)

### Database Records Created

#### When User Registers (via Clerk)

**User Table**:

```sql
INSERT INTO "User" (
  id, email, name, clerkUserId, personId, createdAt
) VALUES (
  'manageros_user_id',
  'user@example.com',
  'John Doe',
  'clerk_user_123',
  NULL,
  NOW()
);
```

**OrganizationMember Table**:

- NOT created automatically during registration
- Created when user joins an organization (via invitation or organization creation)
- Role field is deprecated (Clerk is source of truth)

#### When Organization is Created

**Organization Table**:

```sql
INSERT INTO "Organization" (
  id, clerkOrganizationId, billingUserId,
  subscriptionPlanId, subscriptionPlanName, subscriptionStatus,
  createdAt
) VALUES (
  'manageros_org_id',
  'clerk_org_123',
  'manageros_user_id',
  'plan_free',
  'Solo',
  'active',
  NOW()
);
```

**OrganizationMember Table** (if synced):

```sql
INSERT INTO "OrganizationMember" (
  id, userId, organizationId, role, createdAt
) VALUES (
  'org_member_id',
  'manageros_user_id',
  'manageros_org_id',
  'USER',  -- Deprecated, Clerk role is source of truth
  NOW()
);
```

**Note**: OrganizationMember records are optional and primarily used for fast database queries. Membership is tracked in Clerk.

### Data Synchronization

#### ManagerOS → Clerk Sync

Happens when:

- User joins/leaves organization
- User's role changes
- User links/unlinks Person record
- Organization is created

**What gets synced**:

```typescript
{
  managerOSUserId: "manageros_user_id",
  email: "user@example.com",
  name: "John Doe",
  clerkUserId: "clerk_user_123",
  clerkOrganizationId: "clerk_org_123",
  managerOSOrganizationId: "manageros_org_id",
  managerOSPersonId: "person_id" | null,
  role: "admin" | "user"  // From Clerk session claims
}
```

**Function**: `syncUserDataToClerk()` in `src/lib/clerk-session-sync.ts`

#### Clerk → ManagerOS Sync

Happens via:

1. **Webhooks** (real-time):
   - `user.created` → Creates/updates User record
   - `user.updated` → Updates User record
   - `organizationMembership.created` → Can sync to OrganizationMember (optional)
   - `organizationMembership.deleted` → Can remove from OrganizationMember (optional)
   - `subscription.created/updated` → Updates Organization subscription fields

2. **getCurrentUser()** (on-demand):
   - Creates missing User records
   - Creates missing Organization records
   - Links users to organizations based on Clerk session

### Important Notes

1. **User records are created automatically**:
   - Via webhook when Clerk user is created
   - Via `getCurrentUser()` if webhook failed or user was created before webhook setup

2. **Organization records are created automatically**:
   - When user creates organization via `createOrganization()`
   - When `getCurrentUser()` detects user is in Clerk org but ManagerOS org doesn't exist

3. **OrganizationMember table is optional**:
   - Used for fast database queries (membership checks in WHERE clauses)
   - Clerk is the source of truth for membership
   - Can be synced from Clerk via webhooks or kept empty

4. **Roles are never stored in ManagerOS**:
   - Always read from Clerk session claims
   - OWNER role determined by checking `billingUserId`

5. **Name and slug stored in Clerk only**:
   - Organization name and slug are not in ManagerOS database
   - Must be fetched from Clerk API when needed

---

## Common Scenarios

### Scenario 1: New User Creates Organization

**Detailed Flow**:

1. **User signs up via Clerk**:
   - Clerk creates user with `clerkUserId`
   - `user.created` webhook fires → ManagerOS creates User record
   - User record has `clerkUserId` linking to Clerk user

2. **User creates organization**:
   - User calls `createOrganization({ name, slug })`
   - Clerk organization is created first (returns `clerkOrgId`)
   - Subscription info is fetched from Clerk (or defaults to free plan)
   - ManagerOS Organization record is created with:
     - `clerkOrganizationId` = `clerkOrgId`
     - `billingUserId` = creator's ManagerOS user ID
     - Subscription fields from Clerk

3. **User added to Clerk organization**:
   - User is added to Clerk org with `org:admin` role
   - This happens via Clerk API

4. **Data sync**:
   - User metadata synced to Clerk (includes `managerOSOrganizationId`)
   - Next `getCurrentUser()` call reads organization from Clerk session claims

5. **Result**:
   - ManagerOS Organization exists with `clerkOrganizationId`
   - User is in Clerk organization with `org:admin` role
   - User's role in ManagerOS = OWNER (because `billingUserId` matches)
   - Subscription limits apply to the organization
   - User can now access organization features

### Scenario 2: User Joins Existing Organization

1. Organization admin sends invitation to user's email
2. User accepts invitation
3. **Result**:
   - User's `organizationId` is set
   - User is added to Clerk organization with org:member role
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
  ├── Has many Users (via Clerk organization membership)
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
