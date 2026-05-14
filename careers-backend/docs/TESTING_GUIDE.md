# Testing Guide - Campaign Management & Analytics

This guide will help you test the newly implemented campaign management and analytics features.

## Prerequisites

1. **Backend Running**
   ```bash
   cd careers-backend
   docker-compose up -d
   ```

2. **Frontend Running**
   ```bash
   cd ..
   npm run dev
   ```

3. **Services Status**
   - Backend API: http://localhost:8000
   - Frontend: http://localhost:3000
   - Flower (Celery monitoring): http://localhost:5555
   - Redis: localhost:6379

## Testing Checklist

### 1. Campaign Management

#### Create Campaign
1. Navigate to `/careers/outreach`
2. Click "New Campaign" button
3. Fill in the form:
   - Name: "Test Campaign"
   - Description: "Testing campaign features"
   - Target Role: "Software Engineer"
   - Target Location: "San Francisco"
   - Daily Limit: 5
4. Click "Create Campaign"
5. ✅ Verify campaign appears in the list

#### View Campaign List
1. Navigate to `/careers/outreach`
2. ✅ Verify campaigns are displayed in grid layout
3. ✅ Check that each campaign shows:
   - Name and description
   - Status badge (Active/Paused)
   - Target role and location
   - Stats (sent, opened, replied)
   - Daily progress bar
   - Action buttons

#### Update Campaign Status
1. On campaign card, click the Pause/Play button
2. ✅ Verify status changes (Active ↔ Paused)
3. ✅ Check toast notification appears
4. ✅ Verify status badge updates

#### View Campaign Details
1. Click "View Details" on a campaign
2. ✅ Verify navigation to `/careers/outreach/[id]`
3. ✅ Check that page shows:
   - Campaign name and status
   - Target criteria
   - Performance stats (sent, opened, replied, avg response time)
   - Daily progress bar
   - Sent emails list (when available)

#### Delete Campaign
1. On campaign detail page, click "Delete" button
2. Confirm deletion in dialog
3. ✅ Verify redirect to campaigns list
4. ✅ Check campaign is removed from list

### 2. Analytics Dashboard

#### View Dashboard Stats
1. Navigate to `/careers/analytics`
2. ✅ Verify overview stats display:
   - Total Resumes
   - Active Campaigns
   - Recruiters Found
   - Emails Today

#### View Performance Metrics
1. On analytics page, check the metrics cards
2. ✅ Verify display of:
   - Total Sent
   - Opened (with percentage)
   - Replied (with percentage)
   - Avg Response Time

#### Timeline Chart
1. On analytics page, view the timeline chart
2. ✅ Verify chart displays:
   - X-axis: dates
   - Y-axis: counts
   - Three lines: Sent, Opened, Replied
   - Hover tooltips with data

#### Change Date Range
1. Use the date range dropdown (Last 7/30/90 days)
2. Select different range
3. ✅ Verify chart and stats update

#### Top Campaigns
1. Scroll to "Top Campaigns" section
2. ✅ Verify list shows:
   - Campaign name
   - Email counts (sent, opened, replied)
   - Open rate and reply rate percentages
   - Ranking (1, 2, 3...)

#### Top Recruiters
1. Scroll to "Top Recruiters" section
2. ✅ Verify list shows:
   - Recruiter name and company
   - Email counts
   - Ranking

### 3. API Endpoints

#### Test Campaign API
```bash
# List campaigns
curl -X GET http://localhost:8000/api/v1/campaigns/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create campaign
curl -X POST http://localhost:8000/api/v1/campaigns/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Campaign",
    "description": "Testing via API",
    "target_role": "Engineer",
    "target_location": "Remote",
    "daily_limit": 5
  }'

# Get campaign stats
curl -X GET http://localhost:8000/api/v1/campaigns/{campaign_id}/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test Analytics API
```bash
# Dashboard stats
curl -X GET http://localhost:8000/api/v1/analytics/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"

# Detailed analytics
curl -X POST http://localhost:8000/api/v1/analytics/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2026-04-01",
    "end_date": "2026-05-14",
    "group_by": "day"
  }'
```

### 4. Background Jobs (Celery)

#### Check Celery Services
```bash
# Check if services are running
docker-compose ps

# Should show:
# - backend (running)
# - redis (running)
# - celery-worker (running)
# - celery-beat (running)
# - flower (running)
```

#### Monitor with Flower
1. Open http://localhost:5555
2. ✅ Verify Flower dashboard loads
3. Navigate to "Workers" tab
4. ✅ Check worker is active and processing tasks

#### Test Background Tasks
```bash
# View worker logs
docker-compose logs -f celery-worker

# View beat logs
docker-compose logs -f celery-beat
```

#### Test Resume Parsing Task
1. Upload a resume at `/careers/resume/upload`
2. Check Flower dashboard
3. ✅ Verify `parse_resume` task appears
4. ✅ Check task completes successfully

#### Test Scheduled Tasks
1. Wait for scheduled task execution (or modify schedule for testing)
2. Check Flower "Tasks" tab
3. ✅ Verify scheduled tasks appear:
   - `reset_daily_limits` (daily at midnight)
   - `process_follow_ups` (hourly)

### 5. Integration Testing

#### Complete Workflow
1. **Upload Resume**
   - Go to `/careers/resume/upload`
   - Upload a PDF resume
   - ✅ Verify parsing completes

2. **Find Recruiters**
   - Go to `/careers/recruiters`
   - Search for recruiters (keywords + location)
   - ✅ Verify results appear

3. **Create Campaign**
   - Go to `/careers/outreach`
   - Create a new campaign
   - ✅ Verify campaign created

4. **Generate Email**
   - Go to `/careers/outreach/new`
   - Select resume and recruiter
   - Generate email with AI
   - Assign to campaign
   - ✅ Verify email generated

5. **Send Email**
   - Review and send email
   - ✅ Verify email sent
   - ✅ Check campaign stats update

6. **View Analytics**
   - Go to `/careers/analytics`
   - ✅ Verify stats reflect sent email
   - ✅ Check campaign appears in top campaigns

### 6. Error Handling

#### Test Error Cases
1. **Create campaign without name**
   - ✅ Verify validation error

2. **Access non-existent campaign**
   - Navigate to `/careers/outreach/invalid-id`
   - ✅ Verify "Campaign not found" message

3. **API without authentication**
   - Make API request without token
   - ✅ Verify 401 Unauthorized response

4. **Invalid date range**
   - Try analytics with end_date before start_date
   - ✅ Verify error handling

### 7. Performance Testing

#### Load Testing
1. Create multiple campaigns (10+)
2. ✅ Verify list page loads quickly
3. ✅ Check pagination works (if implemented)

#### Analytics Performance
1. Request analytics for large date range (90 days)
2. ✅ Verify response time is acceptable (<2s)
3. ✅ Check chart renders smoothly

## Common Issues & Solutions

### Issue: Campaigns not loading
**Solution:** Check backend logs, verify database connection

### Issue: Analytics showing zero data
**Solution:** Ensure emails have been sent, check database for email records

### Issue: Celery tasks not running
**Solution:** 
- Check Redis is running: `docker-compose ps redis`
- Restart worker: `docker-compose restart celery-worker`
- Check logs: `docker-compose logs celery-worker`

### Issue: Charts not rendering
**Solution:** Check browser console for errors, verify recharts library is installed

### Issue: API proxy errors
**Solution:** 
- Verify CAREERS_API_URL in .env.local
- Check backend is running on port 8000
- Review Next.js API route logs

## Test Data Setup

### Create Test Data via API

```python
# Python script to create test data
import requests
import random
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api/v1"
TOKEN = "YOUR_AUTH_TOKEN"
headers = {"Authorization": f"Bearer {TOKEN}"}

# Create campaigns
for i in range(5):
    response = requests.post(
        f"{BASE_URL}/campaigns/",
        headers=headers,
        json={
            "name": f"Test Campaign {i+1}",
            "description": f"Test campaign for analytics",
            "target_role": "Software Engineer",
            "target_location": "Remote",
            "daily_limit": random.randint(5, 20)
        }
    )
    print(f"Created campaign: {response.json()}")
```

## Verification Checklist

- [ ] All campaign CRUD operations work
- [ ] Campaign status toggle works
- [ ] Campaign stats display correctly
- [ ] Analytics dashboard loads
- [ ] Timeline chart displays data
- [ ] Top campaigns list works
- [ ] Top recruiters list works
- [ ] Date range filter works
- [ ] Celery worker is running
- [ ] Celery beat is running
- [ ] Flower dashboard accessible
- [ ] Background tasks execute
- [ ] API endpoints respond correctly
- [ ] Error handling works
- [ ] UI is responsive
- [ ] Toast notifications appear

## Next Steps

After testing, you can:
1. Send actual emails through campaigns
2. Monitor email performance
3. Adjust campaign settings based on analytics
4. Set up follow-up automation
5. Export analytics data (future feature)

## Support

If you encounter issues:
1. Check backend logs: `docker-compose logs backend`
2. Check worker logs: `docker-compose logs celery-worker`
3. Review Flower dashboard: http://localhost:5555
4. Check browser console for frontend errors
5. Verify environment variables are set correctly
