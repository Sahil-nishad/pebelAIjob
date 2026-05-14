# Campaign Management & Analytics

This document covers the campaign management and analytics features of the Careers Module.

## Overview

The campaign management system allows users to organize their outreach efforts into campaigns, track performance metrics, and automate follow-ups. The analytics dashboard provides insights into email performance, response rates, and recruiter engagement.

## Features

### 1. Campaign Management

**Create Campaigns**
- Organize outreach efforts by role, location, or other criteria
- Set daily email limits to avoid spam filters
- Pause/resume campaigns as needed

**Campaign Tracking**
- Monitor emails sent, opened, and replied
- Track daily progress against limits
- View campaign-specific statistics

**Campaign Actions**
- Activate/pause campaigns
- Update campaign settings
- Delete campaigns (with confirmation)

### 2. Analytics Dashboard

**Overview Metrics**
- Total resumes uploaded
- Active campaigns count
- Total recruiters found
- Daily email usage

**Performance Metrics**
- Total emails sent
- Open rate (percentage of emails opened)
- Reply rate (percentage of emails replied to)
- Average response time

**Timeline Chart**
- Visual representation of email activity over time
- Track sent, opened, and replied emails by day

**Top Performers**
- Top campaigns by performance
- Top recruiters by engagement

**Recent Activity**
- Real-time feed of recent actions
- Email sends, opens, and replies

### 3. Background Jobs (Celery)

**Automated Tasks**
- Resume parsing (async)
- Email sending (queued)
- Daily limit resets (scheduled)
- Follow-up automation (scheduled)

**Scheduled Tasks**
- Reset daily email limits at midnight UTC
- Process follow-ups every hour
- Check for bounced emails

## API Endpoints

### Campaign Endpoints

```
GET    /api/v1/campaigns/              List all campaigns
POST   /api/v1/campaigns/              Create a new campaign
GET    /api/v1/campaigns/{id}          Get campaign details
PATCH  /api/v1/campaigns/{id}          Update campaign
DELETE /api/v1/campaigns/{id}          Delete campaign
GET    /api/v1/campaigns/{id}/stats    Get campaign statistics
```

### Analytics Endpoints

```
GET    /api/v1/analytics/dashboard     Get dashboard statistics
POST   /api/v1/analytics/              Get detailed analytics
```

## Frontend Routes

### Campaign Pages

```
/careers/outreach                      Campaign list page
/careers/outreach/[id]                 Campaign detail page
```

### Analytics Pages

```
/careers/analytics                     Analytics dashboard
```

## Database Schema

### campaigns Table

```sql
CREATE TABLE careers_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_role TEXT,
  target_location TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  daily_limit INTEGER NOT NULL DEFAULT 5,
  emails_sent_today INTEGER NOT NULL DEFAULT 0,
  total_emails_sent INTEGER NOT NULL DEFAULT 0,
  total_opened INTEGER NOT NULL DEFAULT 0,
  total_replied INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### careers_emails Table

```sql
CREATE TABLE careers_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES careers_campaigns(id) ON DELETE SET NULL,
  recruiter_id UUID NOT NULL REFERENCES careers_recruiters(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  follow_up_scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Services

### CampaignService

**Methods:**
- `create_campaign(user_id, data)` - Create a new campaign
- `list_campaigns(user_id, status, limit, offset)` - List campaigns with filters
- `get_campaign(campaign_id, user_id)` - Get campaign by ID
- `update_campaign(campaign_id, user_id, data)` - Update campaign
- `delete_campaign(campaign_id, user_id)` - Delete campaign
- `get_campaign_stats(campaign_id, user_id)` - Get campaign statistics
- `increment_email_sent(campaign_id)` - Increment email counters
- `reset_daily_limits()` - Reset daily counters (scheduled task)

### AnalyticsService

**Methods:**
- `get_dashboard_stats(user_id)` - Get overview statistics
- `get_analytics(user_id, start_date, end_date, campaign_id, group_by)` - Get detailed analytics
- `get_timeline_data(user_id, start_date, end_date, campaign_id, group_by)` - Get timeline data
- `get_top_campaigns(user_id, start_date, end_date, limit)` - Get top performing campaigns
- `get_top_recruiters(user_id, start_date, end_date, limit)` - Get top engaged recruiters

## Background Tasks

### Celery Configuration

The application uses Celery for background task processing with Redis as the message broker.

**Celery App:** `app/celery_app.py`
**Tasks:** `app/tasks.py`

### Available Tasks

1. **parse_resume(resume_id)**
   - Asynchronously parse uploaded resume
   - Extract text and analyze with AI
   - Update database with results

2. **send_email(email_id)**
   - Send email via Gmail API
   - Update email status
   - Increment campaign counters

3. **reset_daily_limits()**
   - Scheduled task (runs daily at midnight UTC)
   - Resets `emails_sent_today` for all campaigns

4. **process_follow_ups()**
   - Scheduled task (runs hourly)
   - Finds emails scheduled for follow-up
   - Sends follow-up emails

5. **schedule_follow_up(email_id, days)**
   - Schedule a follow-up email
   - Sets `follow_up_scheduled_at` timestamp

### Running Celery

**Development:**
```bash
# Start worker
celery -A app.celery_app worker --loglevel=info

# Start beat scheduler
celery -A app.celery_app beat --loglevel=info

# Start Flower (monitoring UI)
celery -A app.celery_app flower --port=5555
```

**Production (Docker):**
```bash
docker-compose up -d
```

Services:
- `backend` - FastAPI application (port 8000)
- `redis` - Redis message broker (port 6379)
- `celery-worker` - Celery worker
- `celery-beat` - Celery beat scheduler
- `flower` - Celery monitoring UI (port 5555)

## Usage Examples

### Creating a Campaign

```typescript
const response = await fetch('/api/careers/campaigns', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Software Engineer Outreach',
    description: 'Targeting senior SWE roles in SF',
    target_role: 'Software Engineer',
    target_location: 'San Francisco, CA',
    daily_limit: 10,
  }),
})
```

### Fetching Analytics

```typescript
const response = await fetch('/api/careers/analytics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    start_date: '2026-04-01',
    end_date: '2026-05-01',
    group_by: 'day',
  }),
})
```

### Scheduling a Follow-up

```python
from app.tasks import schedule_follow_up

# Schedule follow-up in 3 days
schedule_follow_up.delay(email_id='...', days=3)
```

## Configuration

### Environment Variables

```bash
# Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Database
DATABASE_URL=postgresql://...

# Supabase
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# AI Services
OPENAI_API_KEY=...
GEMINI_API_KEY=...

# Gmail OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Celery Beat Schedule

Configured in `app/celery_app.py`:

```python
app.conf.beat_schedule = {
    'reset-daily-limits': {
        'task': 'app.tasks.reset_daily_limits',
        'schedule': crontab(hour=0, minute=0),  # Daily at midnight UTC
    },
    'process-follow-ups': {
        'task': 'app.tasks.process_follow_ups',
        'schedule': crontab(minute=0),  # Every hour
    },
}
```

## Monitoring

### Flower Dashboard

Access the Flower monitoring UI at `http://localhost:5555` to:
- View active tasks
- Monitor worker status
- Check task history
- View task statistics

### Logs

```bash
# View backend logs
docker-compose logs -f backend

# View worker logs
docker-compose logs -f celery-worker

# View beat logs
docker-compose logs -f celery-beat
```

## Best Practices

1. **Daily Limits**
   - Start with low limits (5-10 emails/day)
   - Gradually increase based on response rates
   - Monitor bounce rates

2. **Campaign Organization**
   - Create separate campaigns for different roles/locations
   - Use descriptive names and descriptions
   - Pause campaigns when not actively recruiting

3. **Follow-ups**
   - Wait 3-5 days before first follow-up
   - Limit to 2-3 follow-ups maximum
   - Personalize follow-up messages

4. **Analytics**
   - Review metrics weekly
   - Compare campaign performance
   - Adjust strategy based on data

5. **Background Jobs**
   - Monitor Celery worker health
   - Check for failed tasks
   - Review task execution times

## Troubleshooting

### Emails Not Sending

1. Check Gmail OAuth connection
2. Verify daily limit not reached
3. Check Celery worker is running
4. Review worker logs for errors

### Analytics Not Updating

1. Verify database connection
2. Check email status updates
3. Review analytics service logs

### Celery Tasks Failing

1. Check Redis connection
2. Verify environment variables
3. Review task logs in Flower
4. Check worker memory/CPU usage

## Future Enhancements

- [ ] A/B testing for email templates
- [ ] Advanced segmentation
- [ ] Email template library
- [ ] Automated response detection
- [ ] Integration with CRM systems
- [ ] Mobile app notifications
- [ ] Bulk import/export
- [ ] Custom reporting
