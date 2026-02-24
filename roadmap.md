# ManagerOS Roadmap

## Removed Features

- **Notes feature** (January 28, 2026) - Standalone and entity-attached notes (Note/NoteShare models, /notes routes, Notes section on initiatives) were removed. Rich text editing (NotionEditor) and inline image upload (NoteImage, /api/notes/upload-image, /api/notes/images) remain in use for initiatives, tasks, feedback, one-on-ones, and job roles.

## Implemented Features ✅

### Core Infrastructure

- **Authentication System** - NextAuth.js integration with email/password authentication and password reset flow
- **Database Schema** - Comprehensive Prisma schema with PostgreSQL
- **Organization Management** - Multi-tenant organization support with invitations
- **User Management** - Role-based access control (ADMIN/USER permissions)
- **Responsive UI** - Tailwind CSS with dark theme and modern design
- **Help System** - Centralized contextual help with markdown-rendered modals (January 2025)
- **Reports Documentation** - Comprehensive help documentation for reports system with individual report guides (January 2025)
- **Custom Billing Flow** - Custom subscription management using Clerk's billing hooks (usePlans, useCheckout, PaymentElement) for plan selection and checkout instead of default Clerk UI (December 2025)

### People Management

- **Person Records** - Complete person profiles with roles, status, and team assignments
- **Hierarchical Structure** - Manager-report relationships with unlimited depth
- **Team Management** - Hierarchical teams with parent-child relationships and deletion capabilities
- **Organization Chart** - Interactive ReactFlow-based org chart visualization
- **Person Import** - Bulk import functionality for adding multiple people
- **Person Import Enhancements** (December 5, 2025) - CSV import now supports birthday data and partial updates that only touch populated columns, enabling lightweight data refreshes for existing people
- **Team Import** - CSV import functionality for teams with automatic parent team creation, fuzzy matching, and update capabilities for existing teams
- **User Linking** - Connect user accounts to person records for access control
- **Job Role Management** - Structured job roles with levels and domains, markdown-enabled job descriptions, organization-wide role management, role assignment to people, drag-and-drop level ordering, dedicated management page (January 2025)
- **Avatar Management** - Person avatar support with multiple sources: upload to R2 storage, Jira account avatars, GitHub account avatars, initials fallback display, comprehensive avatar editor in person settings (October 4, 2025)
- **Team Avatar Management** - Team avatar support with upload to R2 storage, initials fallback display, avatar editor in team settings, integrated display in team cards and tables (October 4, 2025)

### Initiative Management

- **Initiative Tracking** - Full lifecycle management (planned → in_progress → done/canceled)
- **RAG Status** - Red/Amber/Green status tracking with confidence levels
- **Objectives & Key Results** - Structured OKR framework with objectives and key results
- **Check-ins** - Weekly progress updates with RAG status and blockers tracking
- **Initiative Owners** - Multiple ownership roles (owner, sponsor, collaborator)
- **Metrics Tracking** - Quantitative measurement capabilities
- **Slots View** - Visual prioritization of active initiatives with drag-and-drop reordering
- **Automatic Slot Management** (February 2026) - Slots automatically compact when initiatives are completed/canceled, keeping slot numbers contiguous

### Task Management

- **Task Lifecycle** - Complete workflow (todo → doing → blocked → done → dropped)
- **Priority System** - 5-level priority classification
- **Assignment & Estimation** - Person assignment with time estimates
- **Due Dates** - Deadline tracking and management
- **Initiative Integration** - Tasks linked to initiatives and objectives
- **Task Due Desktop Notifications** (February 2026) - Desktop reminders when a task is due. Configurable reminder timing (no reminder, 5 min, 1 hour, 1 day, or custom minutes before due). Per-user reminder preference per task. **Web Push** support: reminders can be sent when the tab is in the background or closed (service worker, VAPID, cron job `task-reminder-push`). In-app poll still runs for non-push or fallback. Acknowledge dismisses the reminder; Snooze lets the user pick a new reminder time (options limited by time left until due). See docs/task-reminders.md.

### One-on-One Management

- **Meeting Scheduling** - Flexible scheduling with notes support
- **Markdown Notes** - Rich text editing with markdown support
- **Manager-Report Tracking** - Bidirectional 1:1 relationship management
- **Private Visibility** - Secure, participant-only access

### Feedback System

- **Multi-directional Feedback** - Give feedback to anyone in the organization
- **Feedback Types** - Praise, concerns, and general notes
- **Feedback Campaigns** - External stakeholder feedback collection with email invitations and structured responses (January 2025)
- **Privacy Controls** - Public/private feedback visibility

### Jira Integration

- **Jira Credentials Management** - Secure storage of encrypted API keys and credentials
- **Person-Jira Account Linking** - Link ManagerOS persons to Jira accounts via email
- **Work Activity Tracking** - Fetch and display Jira work logs and time tracking
- **Real-time Data Sync** - Refresh work activity data from Jira API
- **Activity Visualization** - Display work logs with issue details, time spent, and project information

### Dashboard & Navigation

- **Executive Dashboard** - Overview of teams, direct reports, initiatives, and recent 1:1s
- **Enhanced Dashboard Layout** (September 24, 2025) - Restructured dashboard with tasks and campaigns at top, right sidebar for teams and direct reports
- **Breadcrumb Navigation** (Refactored December 2024) - Explicit breadcrumb system with PageBreadcrumbSetter component. All pages set breadcrumbs explicitly to eliminate race conditions. See docs/breadcrumbs.md for implementation details.
- **Sidebar Navigation** - Persistent navigation with role-based access
- **Direct Reports View** - Dedicated manager view of team members
- **Command Palette** (September 25, 2025) - Global Cmd/Ctrl+K palette with quick actions and search across tasks, initiatives, and people. Extensible sources for commands and server-backed results. Includes Create Task modal trigger.
- **Notification System** - Removed (February 2026). In-app notification bell and notifications page were removed; tolerance rules still create exceptions viewable on the Exceptions page.

### Data Management

- **Event Logging** - Comprehensive audit trail for all actions
- **Tag System** - Flexible tagging for cross-cutting concerns
- **Bulk Operations** - Import/export capabilities
- **Data Validation** - Zod schema validation throughout
- **Report System** - Extensible reporting framework with markdown output (January 2025)
- **AI Synopsis Report** - AI-generated work summaries combining tasks, initiatives, GitHub, Jira, and feedback data (January 2025)
- **Cron Job System** (October 1, 2025) - Extensible automated task system with job registry, execution tracking, and tolerance rules evaluation job
- **Client-Side Caching System** (January 2025) - Zustand-based cache with stale-while-revalidate pattern, network awareness, and navigation-based cache invalidation for optimized data fetching

### Security & Access Control

- **Organization-Level Isolation** - Strict data isolation between organizations (January 2025)
- **Entity-Specific Access Control** - Granular access rules for all data types
- **Task Access Control** - Users can see tasks they created or are assigned to
- **One-on-One Privacy** - Secure, participant-only access to 1:1 meetings
- **Feedback Visibility Rules** - Private/public feedback with proper access controls
- **Feedback Campaign Security** - Creator-only access to campaigns and responses
- **Centralized Access Control** - Utility functions for consistent security patterns
- **Security Testing Suite** - Comprehensive tests for all access control scenarios
- **Organization Member Management** (January 2025) - Admin ability to change member roles (admin/user) and remove members from organization with proper security checks

---

## Future Features 🚀

### Phase 1: Enhanced User Experience (Priority: High)

#### 1. Advanced Dashboard & Analytics

- **Performance Metrics Dashboard** - KPIs, completion rates, team velocity
- **Customizable Widgets** - Drag-and-drop dashboard customization
- **Trend Analysis** - Historical data visualization and trend tracking
- **Goal Tracking** - Visual progress bars for objectives and initiatives

#### 2. Enhanced Communication

- ~~**Notification System** - Real-time notifications for assignments, due dates, check-ins~~ ✅ (October 2025) — Removed (February 2026)
- **Email Integration** - Automated email reminders and updates
- **Comment System** - Threaded discussions on initiatives, tasks, and feedback
- **Mention System** - @mention functionality for team collaboration

#### 3. Mobile Responsiveness

- **Mobile App** - Native mobile application for iOS/Android
- **Progressive Web App** - Offline capability and mobile optimization
- **Touch-Friendly Interface** - Optimized for tablet and mobile interactions

### Phase 2: Advanced Management Features (Priority: Medium)

#### 4. Advanced Reporting & Analytics

- **Custom Reports** - Build custom reports with drag-and-drop fields
- **Export Capabilities** - PDF, Excel, CSV export for all data
- **Scheduled Reports** - Automated report generation and distribution
- **Data Visualization** - Charts, graphs, and interactive dashboards

#### 5. Workflow Automation

- **Automated Workflows** - Rule-based automation for common tasks
- **Approval Processes** - Multi-step approval workflows for initiatives
- **Escalation Rules** - Automatic escalation for overdue items
- **Integration APIs** - REST API for third-party integrations

#### 6. Advanced Initiative Management

- **Dependency Tracking** - Initiative and task dependencies
- **Resource Planning** - Capacity planning and resource allocation
- **Risk Management** - Risk assessment and mitigation tracking
- **Portfolio Management** - High-level portfolio view and management

### Phase 3: Enterprise Features (Priority: Medium-Low)

#### 7. Advanced Security & Compliance

- **SSO Integration** - SAML, OAuth, LDAP integration
- **Role-Based Permissions** - Granular permission system
- **Audit Logs** - Comprehensive audit trail and compliance reporting
- **Data Encryption** - End-to-end encryption for sensitive data

#### 8. Integration Ecosystem

- **Calendar Integration** - Google Calendar, Outlook integration ✅ (In Progress)
- **Unified Integration System** - Generalized integration framework ✅ (Complete)
- **Jira Integration** - Development task synchronization ✅ (Migrated to unified system)
- **GitHub Integration** - Pull request tracking ✅ (Migrated to unified system)
- **Slack Integration** - Team communication and notifications
- **HR System Integration** - Employee data synchronization

#### 9. Advanced Analytics

- **Predictive Analytics** - AI-powered insights and recommendations
- **Performance Prediction** - Machine learning for initiative success prediction
- **Resource Optimization** - AI-driven resource allocation suggestions
- **Sentiment Analysis** - Feedback sentiment analysis and trends

### Phase 4: AI & Intelligence (Priority: Low)

#### 10. AI-Powered Features

- **Smart Suggestions** - AI-powered task and initiative recommendations
- **Automated Summaries** - AI-generated check-in summaries
- **Intelligent Routing** - Smart assignment of tasks based on skills and availability
- **Predictive Insights** - Early warning system for at-risk initiatives

#### 11. Advanced Collaboration

- **Video Integration** - Built-in video calls for 1:1s
- **Document Collaboration** - Real-time document editing and sharing
- **Knowledge Base** - Centralized knowledge management system
- **Best Practices Library** - Template library for common scenarios

---

## Implementation Priority

### Immediate (Next 2-4 weeks)

1. **Enhanced Dashboard** - Better metrics and visualizations
2. **Mobile Optimization** - Responsive design improvements

### Short-term (1-3 months)

1. **Advanced Reporting** - Custom reports and export capabilities
2. **Workflow Automation** - Basic automation rules
3. **Calendar Integration** - Google Calendar/Outlook sync ✅ (In Progress - Framework Complete)

### Medium-term (3-6 months)

1. **Mobile App** - Native mobile application
2. **Advanced Analytics** - Comprehensive analytics dashboard
3. **Integration APIs** - Third-party system integrations

### Long-term (6+ months)

1. **AI Features** - Machine learning and predictive analytics
2. **Enterprise Security** - SSO and advanced compliance features
3. **Advanced Collaboration** - Video integration and document collaboration

---

## Technical Debt & Improvements

### Code Quality

- **Test Coverage** - Comprehensive unit and integration tests
- **Performance Optimization** - Database query optimization and caching
- **Error Handling** - Improved error boundaries and user feedback
- **Accessibility** - WCAG compliance and screen reader support

### UI Consistency

- Standardize on shadcn UI `Button` across the app with `variant='outline'` default.
- Use icon-only buttons (`size='icon'`) with Lucide icons for view/edit/delete actions.
- Remove legacy custom `IconButton`; replaced by shadcn Button variants.
- **Authentication Screens Dark Theme** (January 19, 2025) - Updated sign-in and sign-up screens with consistent dark theme and shadcn components
- **Token-based Theming** (September 20, 2025) - Added Tailwind token theming with `next-themes` (light/dark), theme toggle, and docs `docs/theming.md`. Enables adding future themes without component edits.

### Infrastructure

- **Monitoring** - Application performance monitoring and alerting
- **Backup Strategy** - Automated backups and disaster recovery
- **Scalability** - Horizontal scaling and load balancing
- **Security Hardening** - Security audit and penetration testing
  - 2025-09-26: Enforced server-only usage for GitHub and Jira credentials (modules `src/lib/github-api.ts`, `src/lib/jira-api.ts`, and `src/lib/encryption.ts`). Verified UI only calls server actions.
  - 2025-01-26: **Critical Security Fixes** - Resolved task access control violations, standardized access control patterns, and implemented comprehensive security testing suite. All entity access rules now properly enforced.

---

_Last Updated: February 2026_
_Next Review: March 2026_

### Updates on 2025-12-19

- **Custom Billing Flow** (Completed):
  - Created custom subscription management using Clerk's experimental billing hooks
  - Implemented `/organization/plans` page with plan comparison grid and monthly/annual toggle
  - Implemented `/organization/checkout` page with full payment flow using PaymentElement
  - Created reusable components: `PlanCard`, `PlansPageClient`, `CheckoutPageClient`
  - Uses Clerk hooks: `usePlans()`, `useCheckout()`, `usePaymentElement()`, `usePaymentMethods()`
  - Added "Manage Plan" button to organization settings' Plan Limits section
  - Supports existing payment methods selection and new card entry
  - Proper loading states and error handling throughout
  - Admin-only access with organization scoping

### Updates on 2025-12-16

- **AI Chat UI Migration** (Completed):
  - Migrated from `assistant-ui` to Vercel AI SDK `@ai-sdk/react` with custom components
  - Removed 4 dependencies: `@assistant-ui/react`, `@assistant-ui/react-ai-sdk`, `@assistant-ui/react-markdown`, `assistant-ui`
  - Created new `src/components/ai-elements/` directory with simplified chat components:
    - `ChatThread` - Main chat component using `useChat` hook from AI SDK
    - `ChatMessage` - Message display with markdown rendering using `react-markdown`
    - `ToolIndicator` - Visual indicators for AI tool invocations
  - Simplified UI without branching, message editing, or file attachments
  - Maintained all core functionality: chat, markdown rendering, tool call visualization
  - Moved reusable components (`TooltipIconButton`, `ErrorBoundary`) to `src/components/ui/`
  - Version bump to 1.40.0

### Updates on 2025-01-26

- **Security Enhancements** (Completed):
  - Fixed critical task access control violations where users couldn't see assigned tasks
  - Implemented centralized access control utility functions for consistent security patterns
  - Added comprehensive security testing suite covering all access control scenarios
  - Created detailed security requirements context file for future development
  - Standardized all task-related functions to use proper access control patterns
  - Security score improved from 7/10 to 9/10

### Updates on 2025-09-26

- Added AI-driven Synopsis feature (in progress):
  - Prisma `PersonSynopsis` model and relation on `Person`
  - Server action `generatePersonSynopsis`, `listPersonSynopses`
  - UI section `PersonSynopsis` on person detail page
  - Uses tasks by default; optionally includes feedback; integrates Jira and GitHub when linked

### Updates on 2025-01-30

- **AI Synopsis Report** (Completed):
  - Created new report type `person-ai-synopsis` for AI-generated work summaries
  - Integrates data from tasks, initiatives, GitHub PRs, Jira tickets, and feedback
  - Time-period focused analysis with configurable date ranges
  - Professional markdown output with data source attribution
  - Proper access control - users can only generate synopses for their own person or as organization admins
  - Registered in report system and available through report execution API

### Updates on 2025-01-26

- **Organization Member Management** (Completed):
  - Added server actions: `getOrganizationMembers`, `updateUserRole`, `removeUserFromOrganization`
  - Created organization members management page at `/organization/members`
  - Implemented role change functionality (admin ↔ user) with proper security checks
  - Added member removal capability with confirmation dialogs
  - Prevents removal of last admin and self-modification
  - Updated organization settings page with link to member management
  - All actions include proper organization-level access control and validation

### Updates on 2025-10-01

- **Cron Job System** (Completed):
  - Created extensible cron job architecture with abstract `CronJob` base class
  - Implemented `CronJobRegistry` for job management and execution
  - Added `CronJobExecutionService` for tracking job runs with status, timing, and results
  - Created database model `CronJobExecution` for execution history
  - Implemented job registry with tolerance rules evaluation job (birthday and activity notification jobs were removed in February 2026 along with the in-app notification system)
  - Created command-line runner script with support for specific jobs, organizations, and verbose output
  - Added package.json script: `cron:run`, `cron:tolerance-rules`
  - Comprehensive documentation in `docs/cron-job-system.md` with setup, usage, and extension guide

- **Job Role Management Page** (Completed):
  - Created dedicated Job Role Management page at `/organization/job-roles`
  - Moved job roles, levels, and domains management from organization settings to dedicated page
  - Added navigation card in organization settings linking to job role management
  - Improved organization settings page organization and user experience
  - Maintained all existing functionality while providing better separation of concerns

### Updates on 2025-10-03

- **Notes and File Attachments System** (Completed):
  - Created comprehensive notes system with file attachment support
  - Implemented reusable Cloudflare R2 file upload system with configurable options
  - Added database models: `Note` and `FileAttachment` with proper relationships
  - Created server actions: `createNote`, `updateNote`, `deleteNote`, `getNotesForEntity`, `addAttachmentsToNote`, `deleteFileAttachment`
  - Built `NotesSection` UI component with drag-and-drop file upload, file preview, and management
  - Integrated notes into initiative detail pages with proper loading states
  - Implemented organization-scoped access control and security
  - Added file type validation, size limits, and proper error handling
  - Created comprehensive documentation in `docs/notes-and-attachments.md`
  - Updated existing GitHub bug reporting to use new R2 upload system
  - System supports multiple entity types (initiatives, tasks, people) for future expansion
  - Files organized in R2 with proper folder structure and unique naming
  - Added file icons, size formatting, and download functionality

### Updates on 2025-10-04

- **Avatar Management** (Completed):
  - Extended Person model with optional `avatar` field for storing avatar URLs
  - Created comprehensive `PersonAvatarEditDialog` component integrated into person form (Basic Information section)
  - Implemented avatar upload functionality to Cloudflare R2 with 5MB size limit
  - Added support for using Jira and GitHub account avatars from linked accounts
  - Built reusable `PersonAvatar` component with automatic initials fallback
  - Created server actions: `uploadAvatar`, `updatePersonAvatar`, `getLinkedAccountAvatars`
  - Implemented proper access control (admin-only) and organization isolation
  - Added support for multiple image formats: JPEG, PNG, GIF, WebP
  - Updated PersonForm to include avatar editor with real-time preview
  - Enhanced edit person page to fetch and display linked account avatars
  - Created comprehensive documentation in `docs/avatar-management.md`
  - Added database migration: `20251004000000_add_avatar_to_person`

- **Team Avatar Management** (Completed):
  - Extended Team model with optional `avatar` field for storing avatar URLs
  - Created `TeamAvatarEditor` component for team avatar management (upload only, no Jira/GitHub integration)
  - Built reusable `TeamAvatar` component with automatic initials fallback
  - Created server actions: `uploadTeamAvatar`, `updateTeamAvatar`
  - Updated team forms to include avatar editor with real-time preview
  - Integrated avatar display in team cards and teams table
  - Implemented proper access control (admin-only) and organization isolation
  - Added database migration: `20251004124451_add_avatar_to_team`

### Updates on 2025-10-14

- **Teams Page Data Table Migration** (Completed):
  - Replaced bespoke teams table with unified TanStack-based data table
  - Uses `/api/teams` with server-side search, parent filtering, and pagination
  - Added persistent table settings (`useTeamTableSettings`) for grouping/sorting/filters
  - Default grouping by parent team; consistent actions and UI with People/Tasks tables
  - Updated docs `docs/api/teams.md` to reflect query params and response pagination

### Updates on 2025-01-30

- **Client-Side Caching System** (Completed):
  - Implemented sophisticated Zustand-based caching system for organization data
  - Created `organization-cache-store.ts` with metadata tracking and automatic staleness detection (5-minute threshold)
  - Built custom hooks: `usePeopleCache()`, `usePeople()`, `usePeopleForSelect()` with stale-while-revalidate pattern
  - Added network awareness using existing `useNetworkStatus()` hook for offline handling
  - Implemented automatic cache invalidation through server actions after data mutations
  - Created `CacheProvider` component for registering cache invalidation functions
  - Updated `PersonSelect` and `DynamicReportForm` components to use cached data instead of local state
  - Added cache invalidation calls to all person create/update/delete server actions
  - Integrated cache provider into app layout for global cache management
  - Created comprehensive documentation in `docs/client-side-caching.md` with usage examples and best practices
  - Added debug component `CacheTestComponent` for testing and monitoring cache behavior
  - System provides instant data display with background refresh, eliminates redundant API calls, and improves overall performance
  - Extensible architecture ready for adding teams, initiatives, and other entity caching

### Updates on 2026-02-05

- **Initiative Slot Management Enhancements** (Completed):
  - Fixed slot view showing incorrect number of slots after initiative status changes
  - Added automatic slot compaction: when an initiative is completed/canceled, higher-numbered slots shift down to fill the gap
  - Implemented slot normalization on page load to clean up any inconsistent data
  - Added `compactSlotsAfterRemoval()` helper function for slot shifting
  - Added `normalizeInitiativeSlots()` function to ensure slots are contiguous and only on active initiatives
  - Updated `updateInitiativeStatus`, `updateInitiative`, and `removeInitiativeFromSlot` to trigger slot compaction
  - Added `router.refresh()` to `InitiativePropertiesSidebar` after status changes for immediate UI updates
  - Added back-forward cache refresh handling to slots page client component
  - Updated help documentation with new "Slots View" section explaining slot behavior
  - Updated API documentation with slot management server actions
