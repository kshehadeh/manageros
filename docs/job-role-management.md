# Job Role Management

## Overview

The Job Role Management feature provides structured job role definitions within organizations. It allows administrators to define job levels, domains, and specific job roles with detailed descriptions, then assign these roles to people within their organization.

## Features

### Job Levels

- **Purpose**: Define hierarchical levels within an organization (e.g., Junior, Senior, Staff, Principal)
- **Scope**: Organization-specific levels
- **Management**: Create, edit, and delete levels (admin only)
- **Safety**: Cannot delete levels that have assigned job roles

### Job Domains

- **Purpose**: Define functional areas or departments (e.g., Engineering, Product, Design, Marketing)
- **Scope**: Organization-specific domains
- **Management**: Create, edit, and delete domains (admin only)
- **Safety**: Cannot delete domains that have assigned job roles

### Job Roles

- **Purpose**: Specific job positions combining a level and domain with detailed descriptions
- **Components**:
  - Title (e.g., "Senior Software Engineer")
  - Level assignment (e.g., "Senior")
  - Domain assignment (e.g., "Engineering")
  - Markdown-enabled job description
- **Assignment**: One role per person
- **Management**: Create, edit, and delete job roles (admin only)
- **Safety**: Cannot delete job roles that have people assigned

## Access Control

- **Job Level Management**: Organization administrators only
- **Job Domain Management**: Organization administrators only
- **Job Role Management**: Organization administrators only
- **Role Assignment**: Administrators can assign job roles to people when creating or editing person records

## User Interface

### Organization Settings Page

Located at `/organization/settings`, the Job Role Management section includes three main components:

1. **Job Level Management**: Create and manage organizational job levels
2. **Job Domain Management**: Create and manage functional domains
3. **Job Role Management**: Create and manage specific job roles with level and domain assignments

### Person Forms

Job role selection is available in:

- New person creation form
- Person edit form
- Displays job role title with level and domain information

### People Table

The people table displays:

- Job role title
- Level and domain information below the title
- Option to reassign job roles through the edit form

## Database Schema

### JobRole Model

```prisma
model JobRole {
  id           String   @id @default(cuid())
  title        String
  description  String?  // Markdown-enabled job description
  organizationId String
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  levelId      String
  level        JobLevel @relation("JobRoleLevel", fields: [levelId], references: [id], onDelete: Restrict)
  domainId     String
  domain       JobDomain @relation("JobRoleDomain", fields: [domainId], references: [id], onDelete: Restrict)
  people       Person[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([organizationId])
  @@index([levelId])
  @@index([domainId])
}
```

### JobLevel Model

```prisma
model JobLevel {
  id           String   @id @default(cuid())
  name         String
  organizationId String
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  jobRoles     JobRole[] @relation("JobRoleLevel")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([name, organizationId])
  @@index([organizationId])
}
```

### JobDomain Model

```prisma
model JobDomain {
  id           String   @id @default(cuid())
  name         String
  organizationId String
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  jobRoles     JobRole[] @relation("JobRoleDomain")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([name, organizationId])
  @@index([organizationId])
}
```

### Person Model Update

Added to the existing Person model:

```prisma
model Person {
  // ... existing fields ...
  jobRoleId    String?
  jobRole      JobRole? @relation(fields: [jobRoleId], references: [id])
  // ... rest of fields ...

  @@index([jobRoleId])
}
```

## Security Implementation

### Access Control Rules

All job role management functions follow strict security rules:

1. **Organization Isolation**: Users can only manage job roles within their own organization
2. **Admin-Only Access**: Only administrators can create, edit, or delete job levels, domains, and roles
3. **Relationship Validation**: Job roles can only be created with levels and domains that belong to the same organization
4. **Safe Deletion**: Prevents deletion of entities that have dependencies:
   - Cannot delete job levels with assigned job roles
   - Cannot delete job domains with assigned job roles
   - Cannot delete job roles with assigned people

### Server Action Security Checks

```typescript
// Example security check in server actions
const user = await getCurrentUser()
if (!user.organizationId) {
  throw new Error('User must belong to an organization to manage job levels')
}

if (user.role !== 'ADMIN') {
  throw new Error('Only organization administrators can manage job levels')
}
```

## Usage Workflow

### Initial Setup (Admin)

1. Navigate to Organization Settings
2. Create job levels (e.g., Junior, Senior, Staff, Principal)
3. Create job domains (e.g., Engineering, Product, Design)
4. Create job roles combining levels and domains

### Assigning Roles

1. Navigate to People
2. Create or edit a person
3. Select a job role from the dropdown
4. Save the person record

### Managing Role Descriptions

1. Use markdown syntax for rich job descriptions
2. Include responsibilities, requirements, and expectations
3. Support for headers, lists, emphasis, and code blocks

## API Endpoints

### Server Actions

All job role management operations use server actions for security:

#### JobRole Actions

- `getJobRoles()` - Fetch all job roles for current organization
- `getJobRole(id)` - Fetch specific job role with people
- `getJobRolesForSelection()` - Fetch job roles for dropdowns
- `createJobRole(data)` - Create new job role
- `updateJobRole(id, data)` - Update existing job role
- `deleteJobRole(id)` - Delete job role (with dependency checks)

#### JobLevel Actions

- `getJobLevels()` - Fetch all job levels for current organization
- `getJobLevelsForSelection()` - Fetch job levels for dropdowns
- `createJobLevel(data)` - Create new job level
- `updateJobLevel(id, data)` - Update existing job level
- `deleteJobLevel(id)` - Delete job level (with dependency checks)

#### JobDomain Actions

- `getJobDomain()` - Fetch all job domains for current organization
- `getJobDomainsForSelection()` - Fetch job domains for dropdowns
- `createJobDomain(data)` - Create new job domain
- `updateJobDomain(id, data)` - Update existing job domain
- `deleteJobDomain(id)` - Delete job domain (with dependency checks)

## Integration Points

### Person Management

- Job roles appear in person forms for assignment
- People table displays job role information
- Job role data included in person exports and reports

### Organization Settings

- Centralized management interface in organization settings
- Administrative controls for level, domain, and role management

### Navigation

- Accessible through Organization Settings → Job Role Management section
- Integrated with existing person creation and editing workflows

## Migration Notes

The JobRole feature was implemented with a proper database migration (`20250929080501_add_job_roles`) that:

1. Creates JobRole, JobLevel, and JobDomain tables
2. Adds jobRoleId foreign many-to-one key to Person table
3. Includes proper indexes for performance
4. Maintains referential integrity with Restrict delete policies

## Future Enhancements

Potential future improvements could include:

1. **Role Hierarchy**: Define seniority relationships between roles
2. **Multiple Assignments**: Allow people to have multiple job roles
3. **Role Templates**: Pre-defined role templates for common positions
4. **Analytics**: Track role distribution and usage within organizations
5. **Role Transitions**: Track role changes and transitions over time
6. **Competency Mapping**: Link skills and competencies to job roles
7. **Compensation Integration**: Connect job roles to compensation bands
8. **Role Permissions**: Assign specific system permissions to job roles
