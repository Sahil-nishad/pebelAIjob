# Careers Module - System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                     (Next.js Frontend)                           │
│                   http://localhost:3000                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP/REST
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    NEXT.JS API ROUTES                            │
│                  (API Proxy Layer)                               │
│                                                                  │
│  /api/careers/resumes/*                                         │
│  /api/careers/recruiters/*                                      │
│  /api/careers/campaigns/*                                       │
│  /api/careers/emails/*                                          │
│  /api/careers/analytics/*                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP/REST + NextAuth JWT
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                   FASTAPI BACKEND                                │
│                 http://localhost:8000                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API ROUTES                             │  │
│  │  /api/v1/resumes/*                                       │  │
│  │  /api/v1/recruiters/*                                    │  │
│  │  /api/v1/campaigns/*                                     │  │
│  │  /api/v1/emails/*                                        │  │
│  │  /api/v1/analytics/*                                     │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                        │
│  ┌──────────────────────▼───────────────────────────────────┐  │
│  │                   SERVICES                                │  │
│  │  • ResumeService                                         │  │
│  │  • PDFParser                                             │  │
│  │  • AIService (Gemini/OpenAI)                            │  │
│  │  • StorageService (Supabase)                            │  │
│  │  • RecruiterScraperService (Playwright)                 │  │
│  │  • EmailService (Gmail API)                             │  │
│  │  • AnalyticsService                                      │  │
│  └──────────────────────┬───────────────────────────────────┘  │
└─────────────────────────┼────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  POSTGRESQL  │  │    REDIS     │  │   SUPABASE   │
│  (Supabase)  │  │   (Cache)    │  │   STORAGE    │
│              │  │              │  │              │
│  • resumes   │  │  • Sessions  │  │  • Resume    │
│  • recruiters│  │  • Queue     │  │    Files     │
│  • campaigns │  │  • Cache     │  │  • Images    │
│  • emails    │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

## 🔄 Data Flow

### 1. Resume Upload Flow

```
User Browser
    │
    │ 1. Upload PDF/DOCX
    ▼
Next.js API (/api/careers/resumes/upload)
    │
    │ 2. Forward with NextAuth JWT
    ▼
FastAPI Backend (/api/v1/resumes/upload)
    │
    │ 3. Verify JWT
    ▼
StorageService
    │
    │ 4. Upload to Supabase Storage
    ▼
ResumeService
    │
    │ 5. Create DB record
    ▼
Celery Task (async)
    │
    │ 6. Parse PDF
    ▼
PDFParser → AIService (Gemini)
    │
    │ 7. Extract structured data
    ▼
ResumeService
    │
    │ 8. Update DB with parsed data
    ▼
PostgreSQL
```

### 2. Recruiter Search Flow

```
User Browser
    │
    │ 1. Search "Software Engineer recruiter"
    ▼
Next.js API
    │
    │ 2. Forward request
    ▼
FastAPI Backend
    │
    │ 3. Create scraping job
    ▼
Celery Task (async)
    │
    │ 4. Launch Playwright
    ▼
LinkedIn Scraper
    │
    │ 5. Search LinkedIn
    │ 6. Extract profiles
    │ 7. Find emails
    ▼
RecruiterService
    │
    │ 8. Store in DB
    ▼
PostgreSQL
    │
    │ 9. Return results
    ▼
User Browser
```

### 3. Email Generation & Sending Flow

```
User Browser
    │
    │ 1. Generate email for recruiter
    ▼
FastAPI Backend
    │
    │ 2. Get recruiter + resume data
    ▼
AIService (Gemini)
    │
    │ 3. Generate personalized email
    │ 4. Calculate ATS match
    ▼
EmailService
    │
    │ 5. Create draft in DB
    ▼
User Reviews & Approves
    │
    │ 6. Send email
    ▼
Gmail API (OAuth)
    │
    │ 7. Send from user's Gmail
    ▼
EmailService
    │
    │ 8. Update status + tracking
    ▼
PostgreSQL
```

## 🔐 Authentication Flow

```
User Browser
    │
    │ 1. Login with NextAuth
    ▼
NextAuth
    │
    │ 2. Create JWT session token
    ▼
Browser Cookie
    │
    │ 3. API request with cookie
    ▼
Next.js API Route
    │
    │ 4. Extract JWT from cookie
    │ 5. Add to Authorization header
    ▼
FastAPI Backend
    │
    │ 6. Verify JWT
    │ 7. Extract user ID
    ▼
Protected Endpoint
```

## 📦 Component Breakdown

### Frontend (Next.js)

```
app/(dashboard)/careers/
├── page.tsx                    # Main dashboard
│   ├── Stats cards
│   ├── Quick actions
│   └── Getting started
│
├── resume/
│   ├── page.tsx               # Resume list
│   ├── upload/page.tsx        # Upload form
│   └── [id]/page.tsx          # Resume detail
│
├── recruiters/
│   ├── page.tsx               # Search & results
│   └── [id]/page.tsx          # Recruiter detail
│
├── outreach/
│   ├── page.tsx               # Campaign list
│   ├── new/page.tsx           # Create campaign
│   └── [id]/page.tsx          # Campaign detail
│
└── analytics/
    └── page.tsx               # Analytics dashboard
```

### Backend (FastAPI)

```
careers-backend/app/
├── main.py                    # FastAPI app
├── config.py                  # Settings
│
├── api/                       # API routes
│   ├── auth.py               # Gmail OAuth
│   ├── resumes.py            # Resume CRUD
│   ├── recruiters.py         # Recruiter search
│   ├── campaigns.py          # Campaign management
│   ├── emails.py             # Email generation
│   ├── analytics.py          # Analytics
│   └── settings.py           # User settings
│
├── services/                  # Business logic
│   ├── resume_service.py     # Resume operations
│   ├── pdf_parser.py         # PDF extraction
│   ├── ai_service.py         # AI integration
│   ├── storage_service.py    # File storage
│   ├── recruiter_scraper.py  # LinkedIn scraping
│   ├── email_service.py      # Email operations
│   └── analytics_service.py  # Analytics
│
├── schemas/                   # Pydantic models
│   ├── resume.py
│   ├── recruiter.py
│   ├── campaign.py
│   ├── email.py
│   └── analytics.py
│
├── middleware/
│   └── auth.py               # JWT verification
│
└── db/
    └── connection.py         # Database pool
```

## 🔄 Background Jobs (Celery)

```
┌─────────────────────────────────────────────────────────────┐
│                      CELERY WORKERS                          │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Task Queue (Redis)                                │    │
│  │                                                     │    │
│  │  • parse_resume_task                              │    │
│  │  • scrape_recruiters_task                         │    │
│  │  • send_email_task                                │    │
│  │  • send_follow_up_task                            │    │
│  │  • update_analytics_task                          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Workers (3 instances)                             │    │
│  │                                                     │    │
│  │  Worker 1: Resume parsing                         │    │
│  │  Worker 2: Recruiter scraping                     │    │
│  │  Worker 3: Email sending                          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Flower (Monitoring)                               │    │
│  │  http://localhost:5555                             │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 🗄️ Database Schema

```
┌─────────────────────────────────────────────────────────────┐
│                      POSTGRESQL                              │
│                                                              │
│  users (existing)                                           │
│    ├── id (PK)                                              │
│    ├── email                                                │
│    └── ...                                                  │
│                                                              │
│  resumes                                                    │
│    ├── id (PK)                                              │
│    ├── user_id (FK → users)                                │
│    ├── file_url                                             │
│    ├── extracted_skills (JSONB)                            │
│    ├── extracted_experience (JSONB)                        │
│    └── ...                                                  │
│                                                              │
│  recruiters                                                 │
│    ├── id (PK)                                              │
│    ├── recruiter_name                                       │
│    ├── company                                              │
│    ├── email                                                │
│    ├── linkedin_url                                         │
│    └── ...                                                  │
│                                                              │
│  campaigns                                                  │
│    ├── id (PK)                                              │
│    ├── user_id (FK → users)                                │
│    ├── name                                                 │
│    ├── daily_limit                                          │
│    ├── total_emails_sent                                    │
│    └── ...                                                  │
│                                                              │
│  outreach_emails                                            │
│    ├── id (PK)                                              │
│    ├── user_id (FK → users)                                │
│    ├── campaign_id (FK → campaigns)                        │
│    ├── recruiter_id (FK → recruiters)                      │
│    ├── email_subject                                        │
│    ├── email_body                                           │
│    ├── sent_status                                          │
│    ├── opened_at                                            │
│    ├── replied_at                                           │
│    └── ...                                                  │
│                                                              │
│  gmail_connections                                          │
│    ├── id (PK)                                              │
│    ├── user_id (FK → users)                                │
│    ├── refresh_token (encrypted)                           │
│    ├── access_token (encrypted)                            │
│    └── ...                                                  │
└─────────────────────────────────────────────────────────────┘
```

## 🌐 External Services

```
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL APIS                             │
│                                                              │
│  Google Gemini 2.0 Flash                                    │
│    • Resume parsing                                         │
│    • Email generation                                       │
│    • Skill extraction                                       │
│                                                              │
│  Gmail API (OAuth 2.0)                                      │
│    • Send emails                                            │
│    • Track delivery                                         │
│    • Read replies                                           │
│                                                              │
│  LinkedIn (Playwright)                                      │
│    • Search recruiters                                      │
│    • Extract profiles                                       │
│    • Find contact info                                      │
│                                                              │
│  Supabase                                                   │
│    • PostgreSQL database                                    │
│    • Storage (resume files)                                 │
│    • Authentication (RLS)                                   │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         VERCEL                               │
│                   (Next.js Frontend)                         │
│                  https://pebelai.com                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         │
┌────────────────────────▼────────────────────────────────────┐
│                      RENDER.COM                              │
│                   (FastAPI Backend)                          │
│              https://pebelai-careers.onrender.com            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Web Service (FastAPI)                               │  │
│  │  • Auto-scaling                                      │  │
│  │  • Health checks                                     │  │
│  │  • Environment variables                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Background Worker (Celery)                          │  │
│  │  • Resume parsing                                    │  │
│  │  • Recruiter scraping                                │  │
│  │  • Email sending                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────┬────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   SUPABASE   │  │   UPSTASH    │  │    GOOGLE    │
│              │  │              │  │              │
│  PostgreSQL  │  │    Redis     │  │  Gemini API  │
│  Storage     │  │              │  │  Gmail API   │
└──────────────┘  └──────────────┘  └──────────────┘
```

## 📊 Scaling Strategy

### Current (MVP)
- Single FastAPI instance
- Single Celery worker
- Shared Redis
- Supabase (managed)

### 100 Users
- 2 FastAPI instances
- 2 Celery workers
- Redis cache layer
- CDN for static files

### 1,000 Users
- 5 FastAPI instances (load balanced)
- 5 Celery workers (specialized)
- Redis cluster
- Database read replicas

### 10,000+ Users
- Auto-scaling FastAPI (10-50 instances)
- Celery worker pools (20+ workers)
- Redis cluster (3+ nodes)
- Database sharding
- CDN + edge caching

---

**Last Updated**: May 15, 2026  
**Architecture Version**: 1.0
