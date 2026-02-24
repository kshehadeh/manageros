# Vercel Cron Jobs Setup

This document describes how to set up and configure Vercel cron jobs for the ManagerOS notification system.

## Overview

The ManagerOS notification system uses Vercel cron jobs to automatically trigger notification generation tasks. This provides a reliable, serverless way to run scheduled tasks without maintaining a separate server.

## Configuration

### 1. Environment Variables

Set the following environment variable in your Vercel project:

```bash
CRON_SECRET=your-random-secret-string-here
```

**Important**: Use a strong, random string for the secret. This prevents unauthorized access to your cron endpoints.

### 2. Cron Job Schedules

The following cron jobs are configured in `vercel.json`:

#### Tolerance Rules Evaluation

- **Schedule**: `0 8 * * *` (Daily at 8:00 AM UTC)
- **Job ID**: `tolerance-rules-evaluation`
- **Purpose**: Evaluates enabled tolerance rules and creates exceptions when thresholds are exceeded

#### Task Reminder Push (Web Push)

- **Schedule**: `*/5 * * * *` (Every 5 minutes)
- **Job ID**: `task-reminder-push`
- **Purpose**: Sends Web Push notifications for task reminders that are due. Requires VAPID keys and runs per organization. See [Task reminders](task-reminders.md).

## API Endpoint

The cron jobs trigger the `/api/cron/notifications` endpoint, which supports the following query parameters:

- `job`: Specific job ID to run (optional, defaults to all jobs)
- `org`: Specific organization ID to process (optional, defaults to all organizations)
- `verbose`: Enable verbose logging (`true`/`false`, optional)

### Examples

```bash
# Run all jobs for all organizations
GET /api/cron/notifications

# Run specific job for all organizations
GET /api/cron/notifications?job=tolerance-rules-evaluation
GET /api/cron/notifications?job=task-reminder-push

# Run all jobs for specific organization
GET /api/cron/notifications?org=org123

# Run specific job for specific organization with verbose logging
GET /api/cron/notifications?job=task-reminder-push&org=org123&verbose=true
```

## Security

The API endpoint is secured using the `CRON_SECRET` environment variable. Vercel automatically includes this secret in the `Authorization` header when triggering cron jobs:

```
Authorization: Bearer your-cron-secret
```

## Deployment

1. Set the `CRON_SECRET` environment variable in your Vercel project
2. Deploy your project to Vercel
3. Cron jobs will be automatically activated for production deployments

**Note**: Cron jobs only run in production. Preview deployments are ignored.

## Monitoring

### Vercel Dashboard

- View cron job execution history in the Vercel dashboard
- Monitor success/failure rates
- Check execution logs

### Application Logs

- Cron job executions are logged to the console
- Each execution includes timing, results, and error information
- Use the `verbose=true` parameter for detailed logging

### Database Tracking

- All cron job executions are tracked in the `CronJobExecution` table
- Includes status, timing, notifications created, and error information
- Query this table to monitor job performance over time

## Troubleshooting

### Common Issues

1. **Cron jobs not running**
   - Verify `CRON_SECRET` is set in Vercel environment variables
   - Check that the project is deployed to production
   - Review Vercel dashboard for cron job status

2. **Authentication errors**
   - Ensure `CRON_SECRET` matches between Vercel and your application
   - Check that the secret is properly set in environment variables

3. **Job execution failures**
   - Review application logs for error details
   - Check database connectivity and permissions
   - Verify organization data exists and is properly configured

### Manual Testing

You can manually trigger cron jobs for testing:

```bash
# Test the API endpoint directly
curl -H "Authorization: Bearer your-cron-secret" \
     "https://your-app.vercel.app/api/cron/notifications?verbose=true"
```

## Adding New Cron Jobs

To add a new cron job:

1. **Create the job class** in `src/lib/cron/jobs/`
2. **Register the job** in `src/lib/cron/registry.ts`
3. **Add the cron schedule** to `vercel.json`
4. **Update documentation** with the new job details

### Example: Adding a Weekly Report Job

1. Create `src/lib/cron/jobs/weekly-report-job.ts`
2. Register in `src/lib/cron/registry.ts`
3. Add to `vercel.json`:

   ```json
   {
     "path": "/api/cron/notifications?job=weekly-report",
     "schedule": "0 8 * * 1"
   }
   ```

## Best Practices

1. **Error Handling**: Always include proper error handling in cron jobs
2. **Logging**: Log important events and errors for debugging
3. **Idempotency**: Design jobs to be safe to run multiple times
4. **Performance**: Optimize jobs for serverless execution time limits
5. **Monitoring**: Set up alerts for job failures
6. **Testing**: Test cron jobs thoroughly before deployment

## Limitations

- **Vercel Plan Limits**: Check your Vercel plan for cron job limits
- **Execution Time**: Serverless functions have execution time limits
- **Cold Starts**: First execution after inactivity may be slower
- **Rate Limits**: Be mindful of database and external API rate limits

## Cron vs Vercel Workflows

**Vercel Cron** (used here) is the right fit for periodic scheduled tasks: time-based HTTP triggers (e.g. “every minute” or “daily at 8 AM”) that run a single endpoint. No state or durability is required.

**Vercel Workflows** are for durable, multi-step processes that need to pause and resume, maintain state, or run over long timeframes. Use Workflows when you need retries, human-in-the-loop steps, or complex orchestration—not for simple “run this job every N minutes” scheduling.

## Related Documentation

- [Cron Job System](./cron-job-system.md) - Detailed system architecture
- [Task reminders](task-reminders.md) - Web Push and reminder setup
- [Database Backup](./database-backup.md) - Backup procedures
