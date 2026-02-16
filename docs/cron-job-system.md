# Cron Job System

The ManagerOS cron job system provides an extensible framework for running scheduled tasks. The system is designed to be easily extensible with new job types.

## Architecture

### Core Components

- **CronJob**: Abstract base class for all cron jobs
- **CronJobRegistry**: Manages job registration and execution
- **CronJobExecutionService**: Tracks job execution history and statistics
- **Job Types**: Specific implementations (e.g., tolerance rules evaluation)

### Database Models

- **CronJobExecution**: Tracks individual job runs with status, timing, and results

## Available Jobs

### Tolerance Rules Evaluation (`tolerance-rules-evaluation`)

**Schedule**: Daily at 8 AM (`0 8 * * *`)

**Purpose**: Evaluates all enabled tolerance rules for the organization and creates exceptions when thresholds are exceeded.

**Features**:

- Runs all enabled rules (one-on-one frequency, initiative check-in, 360 feedback, manager span)
- Creates exceptions that appear on the Exceptions page
- Configurable per-rule thresholds in organization settings

**Configuration**: Per-rule configuration is managed in Settings → Tolerance Rules.

## Usage

### Running Jobs

#### Command Line Interface

```bash
# Run all jobs for all organizations
bun run cron:run

# Run tolerance rules evaluation for all organizations
bun run cron:tolerance-rules

# Run with verbose output
bun scripts/run-cron-jobs.ts --verbose

# Run for specific organization
bun scripts/run-cron-jobs.ts --org org123

# Run specific job for specific organization
bun scripts/run-cron-jobs.ts --job tolerance-rules-evaluation --org org123
```

#### Package.json Scripts

- `cron:run` - Run all cron jobs
- `cron:tolerance-rules` - Run tolerance rules evaluation job

### Setting Up Automated Execution

#### Using Cron (Linux/macOS)

```bash
# Edit crontab
crontab -e

# Daily tolerance rules evaluation at 8 AM
0 8 * * * cd /path/to/manageros && bun run cron:tolerance-rules
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
- Result metadata (e.g. exceptions created)
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
- Monitor result metadata in execution records

### Testing

```bash
# Test specific job with verbose output
bun scripts/run-cron-jobs.ts --job tolerance-rules-evaluation --verbose

# Test for specific organization
bun scripts/run-cron-jobs.ts --job tolerance-rules-evaluation --org test-org --verbose
```
