# ManagerOS

A comprehensive management platform built for engineering managers to track initiatives, manage people, conduct 1:1s, and monitor team performance through structured check-ins and metrics.

## 🚀 What is ManagerOS?

ManagerOS is a Next.js-based management platform designed specifically for engineering managers. It provides a structured approach to:

- **Initiative Management**: Track strategic initiatives with RAG status, confidence levels, and progress metrics
- **People Management**: Organize team members, roles, and reporting structures with hierarchical teams
- **1:1 Management**: Schedule and track one-on-one meetings with team members
- **Weekly Check-ins**: Regular progress updates with RAG status and confidence tracking
- **Task Management**: Break down initiatives into objectives and actionable tasks
- **Feedback System**: Multi-directional feedback collection and feedback campaigns
- **Reporting**: Extensible reporting framework with AI-powered synopsis generation
- **Integrations**: Jira and GitHub integration for work activity tracking

For detailed feature documentation, see the [docs](docs/) folder.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with App Router and Server Actions
- **Database**: Prisma ORM with PostgreSQL
- **Authentication**: Clerk for user management and authentication
- **Styling**: TailwindCSS with shadcn UI components and Radix UI primitives
- **Runtime**: Bun for fast package management and execution
- **Type Safety**: TypeScript throughout the application
- **Validation**: Zod for runtime type validation
- **State Management**: Zustand for client-side caching and global state
- **Caching**: Client-side cache with stale-while-revalidate pattern
- **File Storage**: Cloudflare R2 for file attachments and avatars
- **Monitoring**: Sentry for error tracking and performance monitoring

## 📋 Prerequisites

- [Bun](https://bun.sh/) installed on your system
- Node.js 18+ (if not using Bun)

## 🚀 Local Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd manageros
bun install
```

### 2. Environment Configuration

Create a `.env` file in the root directory with the following required variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/manageros"
DIRECT_URL="postgresql://username:password@localhost:5432/manageros"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Cloudflare R2 (for file storage)
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="..."
R2_PUBLIC_URL="https://..."

# Email configuration (for notifications and password reset)
# Using Resend API (recommended)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# Legacy SMTP configuration (optional, for backward compatibility)
SMTP_HOST="..."
SMTP_PORT="..."
SMTP_USER="..."
SMTP_PASSWORD="..."
SMTP_FROM="..."

# Optional: Sentry (for error tracking)
SENTRY_DSN="..."
```

For detailed setup instructions, see the documentation in the [docs](docs/) folder.

### 3. Database Setup

```bash
# Generate Prisma client
bun run prisma:generate

# Run database migrations
bunx prisma migrate dev

# (Optional) Seed with demo data
bun run db:seed-demo
```

For database backup and restore procedures, see [Database Backup](docs/database-backup.md) and [Database Restore](docs/database-restore.md).

### 4. Start Development Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Features Overview

### Core Features

- **Dashboard**: Executive overview with tasks, campaigns, teams, and direct reports
- **Initiative Management**: Track strategic initiatives with objectives, key results, RAG status, and check-ins
- **People Management**: Team member profiles, hierarchical teams, organizational charts, and job role management
- **1:1 Management**: Schedule and track one-on-one meetings with markdown notes
- **Task Management**: Break down initiatives into actionable tasks with assignment, priorities, and due dates
- **Feedback System**: Multi-directional feedback with privacy controls and feedback campaigns
- **Reporting**: Extensible reporting framework with AI-powered synopsis generation
- **Integrations**: Jira and GitHub integration for work activity tracking
- **Notifications**: Real-time notification system with bell icon and management page
- **Command Palette**: Global Cmd/Ctrl+K palette for quick actions and search
- **Help System**: Contextual help with markdown-rendered modals

### Advanced Features

- **Client-Side Caching**: Zustand-based cache with stale-while-revalidate pattern
- **Notes & Attachments**: Rich text notes with file attachments stored in Cloudflare R2
- **Avatar Management**: Person and team avatars with upload, Jira/GitHub integration, and initials fallback
- **Cron Jobs**: Extensible automated task system (birthday notifications, activity monitoring)
- **Security**: Organization-level isolation and entity-specific access control
- **Theming**: Token-based theming with light/dark mode support

For detailed feature documentation, see:

- [API Documentation](docs/api/)
- [Client-Side Caching](docs/client-side-caching.md)
- [Help System](docs/help-system.md)
- [Permissions System](docs/permissions.md)
- [Security Audit Results](docs/security-audit-results.md)

## 🗄️ Database Schema

The application uses a comprehensive Prisma schema with PostgreSQL. Key models include:

- **Organization**: Multi-tenant organization support
- **User**: User accounts linked to Clerk
- **Person**: Team members with roles, relationships, and avatars
- **Team**: Hierarchical teams with parent-child relationships
- **Initiative**: Strategic projects with objectives, key results, and metrics
- **Task**: Actionable items linked to initiatives or objectives
- **CheckIn**: Weekly progress updates with RAG status
- **OneOnOne**: Manager-report meeting records
- **Feedback**: Multi-directional feedback with privacy controls
- **FeedbackCampaign**: External stakeholder feedback collection
- **Meeting**: Recurring meetings with instances
- **Note**: Rich text notes with file attachments
- **Notification**: Real-time notification system
- **Report**: Extensible reporting framework
- **JobRole/JobLevel/JobDomain**: Structured job role management

For the complete schema, see `prisma/schema.prisma`. For database management, see [Database Backup](docs/database-backup.md) and [Database Restore](docs/database-restore.md).

## 🚀 Client-Side Caching System

ManagerOS includes a sophisticated client-side caching system built with Zustand that optimizes data fetching and improves user experience. The system provides stale-while-revalidate pattern, network awareness, and automatic cache invalidation.

For detailed documentation and usage examples, see [Client-Side Caching Guide](docs/client-side-caching.md).

## 🔧 Available Scripts

```bash
# Development
bun run dev              # Start development server
bun run build            # Build for production
bun run start            # Start production server
bun run lint             # Run ESLint
bun run lint:fix         # Fix ESLint errors
bun run format           # Format code with Prettier

# Database
bun run prisma:generate  # Generate Prisma client
bun run db:init          # Initialize database
bun run db:backup        # Create database backup
bun run db:restore       # Restore database from backup
bun run db:seed-demo     # Seed with demo data
bun run db:migrate:deploy # Deploy migrations (production)

# Help System
bun run help:generate    # Generate help content
bun run help:validate    # Validate help content

# Cron Jobs
bun run cron:run         # Run all cron jobs
bun run cron:birthdays   # Run birthday notification job
bun run cron:activity    # Run activity monitoring job

# Version Management
bun run version:patch    # Bump patch version
bun run version:minor    # Bump minor version
bun run version:major    # Bump major version

# Testing
bun run test             # Run Playwright tests
bun run test:ui          # Run tests with UI
```

For more details on specific scripts, see the [docs](docs/) folder.

## 🚀 Deployment

ManagerOS uses a staging-based development workflow with Vercel for hosting and deployment.

### Development Workflow

**Staging Branch**: All development work happens in the `staging` branch, including:

- Feature development
- Database migrations (created with `prisma migrate dev`)
- Version increments (using `bun run version:patch/minor/major`)

**Production Branch**: The `main` branch receives merges from `staging` and is automatically deployed to production.

### Build Strategy

**All Branches**: Vercel automatically builds all branches when pushed to remote (useful for previewing PRs and feature branches).

**Production (`main` branch)**: Only builds when the commit message starts with `chore: release`. This prevents unnecessary production builds while allowing controlled deployments.

### Database Migrations

Database migrations are automatically applied to production during the Vercel build process:

1. **Creating Migrations**: Migrations are created in the `staging` branch using `prisma migrate dev`
2. **Migration Files**: All migration files in `prisma/migrations/` are committed to version control
3. **Production Application**: During production builds, `prisma migrate deploy` automatically applies any pending migrations to the production database
4. **Safety**: `prisma migrate deploy` is production-safe and only applies migrations that haven't been applied yet

**Important**: Migrations created in staging will be automatically applied to production when code is deployed. Always test migrations thoroughly in your development environment before merging to main.

### Deploying to Production

#### Option 1: Automatic Deployment (Recommended)

1. **Develop in Staging**: Work in the `staging` branch, create migrations, and bump versions as you add features
2. **Merge to Main**: Create a PR to merge `staging` → `main`
3. **Automatic Release**: The GitHub Action will automatically:
   - Create a release tag (version is already bumped from staging)
   - Create a GitHub release
   - Push a commit starting with `chore: release` to `main`
   - Trigger a Vercel production build
4. **Automatic Migration**: During the build, pending migrations are automatically applied to production

#### Option 2: Manual Deployment

To manually trigger a production deployment, run locally:

```bash
bun run release
```

This will:

- Create a release commit starting with `chore: release`
- Tag the release
- Push to the `main` branch
- Trigger a Vercel production build (which applies migrations)

**Note**: If you're using the staging workflow, versions should already be bumped in staging. Manual releases are typically only needed for hotfixes.

#### Version Control

Version bumps happen during development in the `staging` branch, not during release. Available version bump scripts:

```bash
bun run version:patch   # 1.1.0 -> 1.1.1 (bug fixes)
bun run version:minor   # 1.1.0 -> 1.2.0 (new features)
bun run version:major   # 1.1.0 -> 2.0.0 (breaking changes)
```

### Build Configuration

The build process is controlled by:

- **Vercel config** (`vercel.json`): Defines custom build commands including `prisma migrate deploy` for automatic migration application
- **Build condition** (`vercel-build-condition.sh`): Determines when to build based on branch and commit message
- **GitHub Action** (`.github/workflows/release.yml`): Automates releases on PR merge from staging to main

For more details on the staging workflow and migration process, see [Staging Workflow Documentation](docs/staging-workflow.md).

For more details on the release process, see [release-it documentation](release-it/README.md).

## 🔐 Authentication

ManagerOS uses **Clerk** for authentication and user management. The system supports:

- Multi-tenant organization support
- Role-based access control (ADMIN/USER)
- User-person linking for access control
- Organization member management
- Password reset flow

For detailed setup instructions, see:

- [Clerk JWT Template Setup](docs/clerk-jwt-template-setup.md)
- [Password Reset Setup](docs/password-reset-setup.md)
- [User-People-Organization Relationships](docs/user-people-organization-relationships.md)

## 🚧 Roadmap

For the complete roadmap with implemented features and future plans, see [roadmap.md](roadmap.md).

### Key Implemented Features

- ✅ Multi-tenant organization support with Clerk
- ✅ Comprehensive people and team management
- ✅ Initiative tracking with OKRs and RAG status
- ✅ Task management with assignment and priorities
- ✅ 1:1 meeting scheduling and notes
- ✅ Feedback system with campaigns
- ✅ Reporting framework with AI synopsis
- ✅ Jira and GitHub integrations
- ✅ Notification system
- ✅ Command palette
- ✅ Help system
- ✅ Client-side caching
- ✅ Notes and file attachments
- ✅ Avatar management
- ✅ Cron job system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📚 Documentation

Comprehensive documentation is available in the [docs](docs/) folder:

- **API Documentation**: [docs/api/](docs/api/) - REST API endpoints
- **Features**: Individual feature documentation (caching, permissions, integrations, etc.)
- **Setup Guides**: Clerk setup, R2 configuration, cron jobs, etc.
- **Development**: Coding standards, UI components, testing guidelines

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the [documentation](docs/) folder
- Review the code examples in the `/src` directory
- See [GitHub Bug Reporting](docs/github-bug-reporting.md) for reporting issues
