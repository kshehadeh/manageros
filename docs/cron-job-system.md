# Cron Job System

The ManagerOS cron job system provides an extensible framework for running scheduled tasks that generate notifications and perform automated actions. The system is designed to be easily extensible with new job types.

## Architecture

### Core Components

- **CronJob**: Abstract base class for all cron jobs
- **CronJobRegistry**: Manages job registration and execution
- **CronJobExecutionService**: Tracks job execution history and statistics
- **Job Types**: Specific implementations for different notification scenarios

### Database Models

- **CronJobExecution**: Tracks individual job runs with status, timing, and results
- **Notification**: Stores generated notifications
- **NotificationResponse**: Tracks user interactions with notifications

## Available Jobs

### 1. Birthday Notifications (`birthday-notification`)

**Schedule**: Daily at 9 AM (`0 9 * * *`)

**Purpose**: Notifies managers about upcoming birthdays of their direct and indirect reports.

**Features**:

- Finds birthdays in the next 7 days
- Handles both direct and indirect reports
- Creates different notification messages for today, tomorrow, or future birthdays
- Groups multiple birthdays in a single notification when appropriate

**Configuration**:

```json
{
  "daysAhead": 7
}
```

### 2. Activity Monitoring (`activity-monitoring`)

**Schedule**: Weekly on Monday at 10 AM (`0 10 * * 1`)

**Purpose**: Identifies team members with no recent activity and notifies their managers.

**Features**:

- Checks for recent tasks, Jira tickets, one-on-ones, and feedback
- Configurable lookback period (default: 14 days)
- Only notifies about reports who have been inactive
- Provides context about the last activity type and date

**Configuration**:

```json
{
  "daysBack": 14
}
```

### 3. Overdue Tasks Notification (`overdue-tasks-notification`)

**Schedule**: Daily at 9 AM (`0 9 * * *`)

**Purpose**: Identifies tasks with past due dates and notifies the assigned users.

**Features**:

- Finds tasks with due dates that have passed
- Only includes incomplete tasks (excludes 'done' and 'dropped' status)
- Groups multiple overdue tasks per user into a single notification
- Uses deduplication to prevent duplicate notifications within 24 hours
- Respects organization boundaries and task access control

**Configuration**:

```json
{}
```

## Usage

### Running Jobs

#### Command Line Interface

```bash
# Run all jobs for all organizations
bun run cron:run

# Run specific job for all organizations
bun run cron:birthdays
bun run cron:activity
bun run cron:overdue-tasks

# Run with verbose output
bun scripts/run-cron-jobs.ts --verbose

# Run for specific organization
bun scripts/run-cron-jobs.ts --org org123

# Run specific job for specific organization
bun scripts/run-cron-jobs.ts --job birthday-notification --org org123
```

#### Package.json Scripts

- `cron:run` - Run all cron jobs
- `cron:birthdays` - Run birthday notification job
- `cron:activity` - Run activity monitoring job
- `cron:overdue-tasks` - Run overdue tasks notification job

### Setting Up Automated Execution

#### Using Cron (Linux/macOS)

```bash
# Edit crontab
crontab -e

# Add entries for automated execution
# Daily birthday notifications at 9 AM
0 9 * * * cd /path/to/manageros && bun run cron:birthdays

# Daily overdue tasks notifications at 9 AM
0 9 * * * cd /path/to/manageros && bun run cron:overdue-tasks

# Weekly activity monitoring on Monday at 10 AM
0 10 * * 1 cd /path/to/manageros && bun run cron:activity
```

#### Using GitHub Actions

```yaml
name: Cron Jobs
on:
  schedule:
    - cron: '0 9 * * *' # Daily at 9 AM UTC
    - cron: '0 10 * * 1' # Weekly on Monday at 10 AM UTC
  workflow_dispatch: # Manual trigger

jobs:
  cron:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - name: Run Cron Jobs
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: bun run cron:run
```

## Creating New Jobs

### 1. Create Job Class

```typescript
import { CronJob, CronJobResult, CronJobExecutionContext } from '../types'

export class MyCustomJob extends CronJob {
  readonly id = 'my-custom-job'
  readonly name = 'My Custom Job'
  readonly description = 'Description of what this job does'
  readonly schedule = '0 8 * * *' // Daily at 8 AM

  async execute(context: CronJobExecutionContext): Promise<CronJobResult> {
    // Implementation here
    return {
      success: true,
      notificationsCreated: 0,
      metadata: {},
    }
  }

  validateConfig(config: Record<string, any>): boolean {
    // Validate configuration
    return true
  }

  getDefaultConfig(): Record<string, any> {
    return {
      // Default configuration
    }
  }
}
```

### 2. Register Job

Add the job to the registry in `src/lib/cron/registry.ts`:

```typescript
import { MyCustomJob } from './jobs/my-custom-job'

export class CronJobRegistry {
  private registerDefaultJobs(): void {
    this.register(new BirthdayNotificationJob())
    this.register(new ActivityMonitoringJob())
    this.register(new MyCustomJob()) // Add your job here
  }
}
```

### 3. Add Package.json Script (Optional)

```json
{
  "scripts": {
    "cron:my-custom": "bun scripts/run-cron-jobs.ts --job my-custom-job"
  }
}
```

## Monitoring and Debugging

### Execution Tracking

All job executions are tracked in the `CronJobExecution` table with:

- Job ID and name
- Organization processed
- Start and completion times
- Success/failure status
- Number of notifications created
- Error messages (if any)
- Execution metadata

### Viewing Execution History

```typescript
import { CronJobExecutionService } from '../src/lib/cron/execution-service'

// Get recent executions
const executions = await CronJobExecutionService.getRecentExecutions()

// Get execution statistics
const stats = await CronJobExecutionService.getExecutionStats()
```

### Cleanup

Old execution records can be cleaned up to prevent database bloat:

```typescript
// Clean up records older than 90 days
const deletedCount = await CronJobExecutionService.cleanupOldExecutions(90)
```

## Security Considerations

- All jobs respect organization-level data isolation
- Jobs only process data for users within the same organization
- Access control rules are enforced for all data queries
- Sensitive data is not logged in execution metadata

## Performance Considerations

- Jobs are designed to be efficient and avoid N+1 queries
- Database indexes are in place for common query patterns
- Large organizations are processed in batches when necessary
- Execution tracking is lightweight and doesn't impact job performance

## Troubleshooting

### Common Issues

1. **Job Not Found**: Ensure the job is properly registered in the registry
2. **Database Connection**: Verify DATABASE_URL is correctly configured
3. **Permission Errors**: Check that the user has access to the organization data
4. **Memory Issues**: For large organizations, consider processing in smaller batches

### Debugging

- Use `--verbose` flag for detailed output
- Check execution history in the database
- Review error messages in failed executions
- Monitor notification creation counts

### Testing

```bash
# Test specific job with verbose output
bun scripts/run-cron-jobs.ts --job birthday-notification --verbose

# Test for specific organization
bun scripts/run-cron-jobs.ts --job activity-monitoring --org test-org --verbose
```
