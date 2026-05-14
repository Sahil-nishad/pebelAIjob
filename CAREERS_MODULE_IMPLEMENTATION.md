# Careers Module Implementation Guide

## Overview

This document outlines the complete implementation of the AI Recruiter Outreach Agent module for PebelAI. The module automates the job search process by finding recruiters, generating personalized cold emails, and tracking outreach performance.

## Architecture

### Backend (FastAPI)
- **Location**: `careers-backend/`
- **Port**: 8000
- **Database**: PostgreSQL (Supabase)
- **Cache/Queue**: Redis
- **Background Jobs**: Celery

### Frontend (Next.js)
- **Location**: `app/(dashboard)/careers/`
- **API Proxy**: `app/api/careers/`
- **Integration**: NextAuth session tokens

## Implementation Status

### ✅ Phase 1: Foundation (COMPLETED)

#### Database Schema
- ✅ Created migration: `supabase/migrations/20260515000000_careers_module_v2.sql`
- ✅ Tables: resumes, recruiters, recruiter_posts, campaigns, outreach_emails, email_templates, careers_settings, scraping_jobs, analytics_events, followups
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance

#### Backend Structure
- ✅ FastAPI application setup (`careers-backend/app/main.py`)
- ✅ Configuration management (`app/config.py`)
- ✅ Database connection pool (`app/db/connection.py`)
- ✅ Authentication middleware (`app/middleware/auth.py`)
- ✅ Pydantic schemas for all entities
- ✅ API route structure (7 modules)

#### Core Services
- ✅ Resume service (`app/services/resume_service.py`)
- ✅ PDF parser (`app/services/pdf_parser.py`)
- ✅ AI service with Gemini/OpenAI (`app/services/ai_service.py`)
- ✅ Storage service for Supabase (`app/services/storage_service.py`)
- ✅ ATS matching algorithm

#### Frontend
- ✅ Main dashboard page (`app/(dashboard)/careers/page.tsx`)
- ✅ API proxy routes (resumes, analytics)
- ✅ Sidebar navigation updated

#### DevOps
- ✅ Dockerfile
- ✅ docker-compose.yml (backend, redis, celery, flower)
- ✅ Requirements.txt
- ✅ README.md

### 🚧 Phase 2: Core Features (IN PROGRESS)

#### Resume Management
- ✅ Upload endpoint
- ✅ PDF/DOCX parsing
- ✅ AI extraction (skills, experience, education, projects)
- ⏳ Frontend resume upload page
- ⏳ Resume list view
- ⏳ Resume detail view

#### Recruiter Search
- ⏳ LinkedIn scraping with Playwright
- ⏳ Email extraction from profiles
- ⏳ Recruiter database storage
- ⏳ Search results page
- ⏳ Recruiter detail view

#### Email Generation
- ✅ AI email generation service
- ✅ ATS matching algorithm
- ⏳ Email template system
- ⏳ Email preview UI
- ⏳ Email editor

#### Campaign Management
- ⏳ Campaign CRUD operations
- ⏳ Daily sending limits
- ⏳ Campaign dashboard
- ⏳ Campaign settings

### 📋 Phase 3: Advanced Features (TODO)

#### Gmail Integration
- ⏳ OAuth 2.0 flow
- ⏳ Token storage & refresh
- ⏳ Email sending via Gmail API
- ⏳ Email tracking (opens, clicks)
- ⏳ Reply detection

#### Background Jobs
- ⏳ Celery worker setup
- ⏳ Resume parsing task
- ⏳ Recruiter scraping task
- ⏳ Email sending task
- ⏳ Follow-up automation task

#### Analytics
- ⏳ Email performance tracking
- ⏳ Campaign analytics
- ⏳ Recruiter response rates
- ⏳ Timeline charts
- ⏳ Export reports

#### Settings
- ⏳ User preferences
- ⏳ Email templates
- ⏳ Daily limits by plan
- ⏳ Timezone settings
- ⏳ LinkedIn session cookie

## Next Steps

### Immediate (Week 1)

1. **Apply Database Migration**
   ```bash
   psql $DATABASE_URL < supabase/migrations/20260515000000_careers_module_v2.sql
   ```

2. **Set Up Backend Environment**
   ```bash
   cd careers-backend
   cp .env.example .env
   # Fill in environment variables
   pip install -r requirements.txt
   playwright install chromium
   ```

3. **Start Backend Services**
   ```bash
   # Option 1: Docker (recommended)
   docker-compose up -d
   
   # Option 2: Local development
   uvicorn app.main:app --reload --port 8000
   ```

4. **Test Resume Upload**
   - Create resume upload page
   - Test PDF parsing
   - Verify AI extraction

### Short Term (Week 2-3)

5. **Implement LinkedIn Scraping**
   - Create Playwright scraper service
   - Handle authentication
   - Extract recruiter profiles
   - Store in database

6. **Build Email Generation Flow**
   - Create email generation UI
   - Implement template system
   - Add email preview
   - Test AI generation

7. **Gmail OAuth Integration**
   - Set up OAuth consent screen
   - Implement authorization flow
   - Store tokens securely
   - Test email sending

### Medium Term (Week 4-6)

8. **Campaign Management**
   - Create campaign CRUD
   - Implement daily limits
   - Build campaign dashboard
   - Add bulk actions

9. **Analytics Dashboard**
   - Track email events
   - Calculate metrics
   - Build charts
   - Export functionality

10. **Background Jobs**
    - Set up Celery workers
    - Implement async tasks
    - Add job monitoring
    - Error handling

### Long Term (Week 7+)

11. **Follow-up Automation**
    - Detect no-reply
    - Generate follow-up emails
    - Schedule sending
    - Track sequences

12. **Advanced Features**
    - A/B testing for emails
    - Smart sending times
    - Recruiter scoring
    - Integration with job boards

## Deployment

### Backend Deployment (Render.com)

1. Create new Web Service
2. Connect GitHub repo
3. Set build command:
   ```bash
   pip install -r requirements.txt && playwright install chromium
   ```
4. Set start command:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. Add environment variables
6. Deploy

### Frontend Integration

1. Update `.env.local`:
   ```bash
   CAREERS_API_URL=https://your-backend.onrender.com
   CAREERS_INTERNAL_API_KEY=your-secret-key
   ```

2. Deploy to Vercel (automatic on push)

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Database Schema

### Key Tables

**resumes**
- Stores uploaded resume files
- Extracted structured data (skills, experience, education)
- Links to user

**recruiters**
- Recruiter profiles from LinkedIn
- Contact information
- Company details

**campaigns**
- Outreach campaign organization
- Daily sending limits
- Performance metrics

**outreach_emails**
- Email drafts and sent emails
- Tracking data (opens, replies, bounces)
- Links to recruiter and campaign

**analytics_events**
- Event tracking for analytics
- User actions and email events

## Security Considerations

1. **Authentication**
   - NextAuth JWT tokens
   - Internal API key for service-to-service
   - Row Level Security in database

2. **Data Privacy**
   - User data isolation
   - Encrypted token storage
   - GDPR compliance

3. **Rate Limiting**
   - Daily email limits per plan
   - API rate limiting
   - Scraping throttling

4. **Email Sending**
   - User's own Gmail account
   - OAuth 2.0 (no password storage)
   - Respect Gmail sending limits

## Testing

### Backend Tests
```bash
cd careers-backend
pytest tests/
```

### Frontend Tests
```bash
npm run test
```

### Manual Testing Checklist
- [ ] Resume upload (PDF)
- [ ] Resume upload (DOCX)
- [ ] Resume parsing accuracy
- [ ] Recruiter search
- [ ] Email generation
- [ ] Email sending
- [ ] Campaign creation
- [ ] Analytics display
- [ ] Daily limit enforcement

## Monitoring

### Celery Monitoring (Flower)
- URL: `http://localhost:5555`
- Monitor task queue
- View task history
- Worker status

### Application Logs
```bash
# Docker
docker-compose logs -f backend

# Local
tail -f logs/app.log
```

### Database Monitoring
- Supabase Dashboard
- Query performance
- Table sizes
- Active connections

## Support

For issues or questions:
1. Check backend logs
2. Check Celery worker logs
3. Verify environment variables
4. Test API endpoints directly
5. Check database migrations

## License

Proprietary - PebelAI

---

**Last Updated**: May 15, 2026
**Status**: Phase 1 Complete, Phase 2 In Progress
**Next Milestone**: Resume upload page + LinkedIn scraping
