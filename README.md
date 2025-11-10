# ManagerOS

A comprehensive management platform built for engineering managers to track initiatives, manage people, conduct 1:1s, and monitor team performance through structured check-ins and metrics.

## 🚀 What is ManagerOS?

ManagerOS is a Next.js-based management platform designed specifically for engineering managers. It provides a structured approach to:

- **Initiative Management**: Track strategic initiatives with RAG status, confidence levels, and progress metrics
- **People Management**: Organize team members, roles, and reporting structures
- **1:1 Management**: Schedule and track one-on-one meetings with team members
- **Weekly Check-ins**: Regular progress updates with RAG status and confidence tracking
- **Task Management**: Break down initiatives into objectives and actionable tasks
- **Performance Tracking**: Monitor metrics and outcomes for each initiative

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router and Server Actions
- **Database**: Prisma ORM with SQLite (easily upgradeable to PostgreSQL)
- **Styling**: TailwindCSS with shadcn UI components and Radix UI primitives
- **Runtime**: Bun for fast package management and execution
- **Type Safety**: TypeScript throughout the application
- **Validation**: Zod for runtime type validation
- **State Management**: Zustand for client-side caching and global state
- **Caching**: Client-side cache with stale-while-revalidate pattern

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

Create a `.env` file in the root directory:

```bash
# Database Configuration
DATABASE_URL="file:./prisma/dev.db"
```

For production, replace with a PostgreSQL connection string:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/manageros"
```

### 3. Database Setup

```bash
# Generate Prisma client
bun run prisma:generate

# Push schema to database
bun run prisma:push

# Seed with sample data
bun run prisma:seed
```

### 4. Start Development Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Features Overview

### Dashboard

- Recent check-ins with RAG status
- Upcoming 1:1 meetings
- Quick navigation to all sections

### Initiatives Management

- Create and track strategic initiatives
- Set objectives and key results
- Monitor RAG status (Red/Amber/Green) and confidence levels
- Weekly check-ins with progress updates
- Task breakdown and assignment

### People Management

- Team member profiles with roles and contact information
- Organizational hierarchy (manager-reports relationships)
- Team assignments and status tracking

### 1:1 Management

- Schedule recurring one-on-one meetings
- Set agendas and take notes
- Track meeting cadence and history

### Task Management

- Break initiatives into actionable tasks
- Assign tasks to team members
- Track progress with status updates
- Priority and due date management

### Performance Optimization

- **Client-Side Caching**: Zustand-based cache with stale-while-revalidate pattern
- **Network Awareness**: Respects offline state and handles connectivity issues
- **Automatic Cache Invalidation**: Server actions trigger cache refresh
- **Reduced API Calls**: Shared cache eliminates redundant data fetching

### UI Standards

- Standardized UI components:
  - Buttons use the shared shadcn `Button` at `src/components/ui/button.tsx`
  - Default button style is `variant='outline'`
  - Icon-only actions use `size='icon'` and Lucide icons
  - Destructive confirms use `variant='destructive'` only for the confirm state

## 🗄️ Database Schema

The application uses a comprehensive Prisma schema with the following key models:

- **Team**: Organizational units
- **Person**: Team members with roles and relationships
- **Initiative**: Strategic projects with objectives and metrics
- **Task**: Actionable items linked to initiatives or objectives
- **CheckIn**: Weekly progress updates
- **OneOnOne**: Manager-report meeting records
- **IDP**: Individual Development Plans
- **Feedback**: Peer and manager feedback
- **Metric**: Performance measurements
- **Event**: Audit trail for all activities

## 🚀 Client-Side Caching System

ManagerOS includes a sophisticated client-side caching system built with Zustand that optimizes data fetching and improves user experience:

### Key Features

- **Stale-While-Revalidate**: Shows cached data immediately while refreshing in background
- **Network Awareness**: Respects offline state and handles connectivity issues gracefully
- **Automatic Cache Invalidation**: Server actions trigger cache refresh after mutations
- **Extensible Architecture**: Easy to add caching for teams, initiatives, and other entities

### Usage

```tsx
import { usePeopleCache } from '@/hooks/use-organization-cache'

function MyComponent() {
  const { people, isLoading, error } = usePeopleCache()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {people.map(person => (
        <div key={person.id}>{person.name}</div>
      ))}
    </div>
  )
}
```

For detailed documentation, see [Client-Side Caching Guide](docs/client-side-caching.md).

## 🔧 Available Scripts

```bash
# Development
bun run dev          # Start development server
bun run build        # Build for production
bun run start        # Start production server

# Database
bun run prisma:generate  # Generate Prisma client
bun run prisma:push      # Push schema changes to database
bun run prisma:seed      # Seed database with sample data
bun run db:backup        # Create database backup
bun run db:restore       # Restore database from backup
```

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

Currently, the application runs in demo mode with a simple manager-only authentication stub. For production deployment, integrate with:

- **NextAuth.js** for authentication
- **Clerk** for user management
- **WorkOS** for enterprise SSO
- **Auth0** for identity management

## 🚧 Roadmap

### Phase 1: Core Features (Current)

- ✅ Basic initiative management
- ✅ People and team organization
- ✅ 1:1 scheduling and tracking
- ✅ Weekly check-ins
- ✅ Task management
- ✅ RAG status tracking

### Phase 2: Enhanced Management

- [ ] Advanced reporting and analytics
- [ ] Goal setting and OKR tracking
- [ ] Performance review cycles
- [ ] Feedback collection and management
- [ ] Team health metrics
- [ ] Integration with project management tools

### Phase 3: Collaboration & Integration

- [ ] Real-time notifications
- [ ] Calendar integration
- [ ] Slack/Teams integration
- [ ] Email notifications
- [ ] Mobile application
- [ ] API for third-party integrations

### Phase 4: Advanced Analytics

- [ ] Predictive analytics for initiative success
- [ ] Team performance insights
- [ ] Resource allocation optimization
- [ ] Custom dashboard creation
- [ ] Advanced reporting suite

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the code examples in the `/src` directory

---

**Note**: This is currently a demo scaffold. Replace the authentication stub with a real auth provider before deploying to production.
