# Onboarding System

## Overview

The onboarding system helps new team members become effective quickly through structured, trackable onboarding journeys. It provides:

- **Reusable templates** - Define onboarding steps once, use for many people
- **Phase-based structure** - Organize items into logical groups (Day 1, Week 1, etc.)
- **Progress tracking** - Track completion at the item and phase level
- **Role-aware** - Templates can be scoped to specific teams or job roles
- **Manager oversight** - Visibility into team members' onboarding progress

## Key Concepts

### OnboardingTemplate

A reusable definition of what onboarding looks like. Templates contain:

- **Name and description** - Identifies the template
- **Scope** - Optional team and/or job role association
- **Phases** - Ordered groupings of items
- **Active status** - Whether the template can be assigned

Templates can be marked as the organization default, which makes them the fallback when no specific team/role match is found.

### OnboardingPhase

An ordered grouping within a template (e.g., "Day 1", "Week 1", "First 30 Days"). Each phase contains multiple items that should be completed during that period.

### OnboardingItem

An atomic step within a phase. Item types include:

| Type        | Description           | Who Completes       |
| ----------- | --------------------- | ------------------- |
| TASK        | Something to do       | Onboardee           |
| READING     | Documentation to read | Onboardee           |
| MEETING     | Conversation to have  | Either              |
| CHECKPOINT  | Verification point    | Manager/Mentor only |
| EXPECTATION | Context to understand | Onboardee           |

Items can link to external URLs for resources and documentation.

### OnboardingInstance

A live onboarding assigned to a specific person. Each instance:

- References a template
- Tracks the onboardee (person)
- Has an assigned manager and optional mentor
- Contains progress records for each item

### OnboardingItemProgress

Tracks the completion status of each item for a specific instance:

- **PENDING** - Not yet started
- **IN_PROGRESS** - Work has begun
- **COMPLETED** - Marked as done
- **SKIPPED** - Deliberately skipped (optional items)
- **BLOCKED** - Cannot proceed

## User Flows

### Creating a Template (Admin)

1. Navigate to **Organization > Onboarding Templates**
2. Click **New Template**
3. Enter template name and description
4. Optionally select a team and/or job role
5. Add phases with descriptive names
6. Add items to each phase:
   - Set the item type
   - Mark as required or optional
   - Add description and links
7. Save the template

### Assigning Onboarding (Manager)

1. Go to a person's profile page
2. Open the actions dropdown
3. Click **Start Onboarding**
4. Select a template (smart suggestions based on team/role)
5. Optionally assign a mentor
6. Confirm to create the onboarding instance

### Completing Onboarding (Onboardee)

1. View the onboarding widget on the dashboard
2. Click to access the full onboarding page
3. Expand each phase to see items
4. Complete items by clicking the checkmark
5. Add optional notes to completed items
6. Checkpoint items require manager/mentor approval

### Manager Oversight

1. View team onboarding status in the dashboard section
2. Navigate to **Onboarding > Overview** for detailed view
3. See progress percentages and stuck indicators
4. Complete checkpoint items for team members
5. Mark onboarding as complete when all required items are done

## Access Control

| Action                   | Who Can Do It                                 |
| ------------------------ | --------------------------------------------- |
| View templates           | All org members                               |
| Create/edit templates    | Admins only                                   |
| Assign onboarding        | Person's manager or Admin                     |
| View onboarding instance | Onboardee, Manager, Mentor, Admin             |
| Complete items           | Onboardee (or Manager/Mentor for checkpoints) |
| Complete onboarding      | Manager or Admin                              |
| View oversight           | Managers see their team; Admins see all       |

## Completion Logic

### Item Completion

- Most items can be completed by the onboardee
- CHECKPOINT items require manager or mentor confirmation
- Optional items don't block phase/instance completion

### Phase Completion

A phase is complete when all **required** items in that phase are complete.

### Instance Completion

- All phases must be complete
- Requires explicit completion action by manager or admin
- Generates completion timestamp

### Why Time is Insufficient

The system uses explicit completion rather than time-based:

- "30 days" doesn't mean readiness
- Progress varies by individual and role complexity
- Managers need visibility into actual blockers

## URLs

| URL                                            | Purpose                    |
| ---------------------------------------------- | -------------------------- |
| `/onboarding`                                  | Onboardee's checklist view |
| `/onboarding/overview`                         | Manager/admin oversight    |
| `/organization/onboarding-templates`           | Template management        |
| `/organization/onboarding-templates/new`       | Create new template        |
| `/organization/onboarding-templates/[id]/edit` | Edit template              |

## Data Model

### Key Tables

- `OnboardingTemplate` - Template definitions
- `OnboardingPhase` - Phases within templates
- `OnboardingItem` - Items within phases
- `OnboardingInstance` - Assigned onboardings
- `OnboardingItemProgress` - Item completion status

### Key Relationships

```
Organization
  └── OnboardingTemplate (many)
        └── OnboardingPhase (many, ordered)
              └── OnboardingItem (many, ordered)

Person
  └── OnboardingInstance (as onboardee)
  └── OnboardingInstance (as manager, via relation)
  └── OnboardingInstance (as mentor, via relation)

OnboardingInstance
  └── OnboardingItemProgress (one per item)
```

## Future Extensions

- **Metrics & Insights** - Time-to-completion by role/team, common blockers
- **Automation** - Auto-assign template on person creation
- **Reminders** - Opt-in nudges for stuck items
- **Templates Library** - Share templates across organizations
- **Feedback Loop** - Post-onboarding survey integration
