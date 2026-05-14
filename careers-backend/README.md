# Careers Module - Backend

AI-powered job search automation platform with resume management, recruiter outreach, and analytics.

## Overview

The Careers Module is a comprehensive backend system built with FastAPI that provides:

- **Resume Management:** Upload, parse, and analyze resumes with AI
- **LinkedIn Scraping:** Find recruiters using Playwright automation
- **Email Generation:** AI-powered personalized outreach emails
- **Gmail Integration:** OAuth 2.0 flow for sending emails
- **Campaign Management:** Organize and track outreach efforts
- **Analytics Dashboard:** Performance metrics and insights
- **Background Jobs:** Celery-based task queue for async processing

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  /careers/resume  /careers/recruiters  /careers/outreach    │
│  /careers/analytics                                          │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────▼────────────────────────────────────┐
│                    FastAPI Backend (Port 8000)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Resumes    │  │  Recruiters  │  │  Campaigns   │      │
│  │     API      │  │     API      │  │     API      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼───────┐    │
│  │              Services Layer                         │    │
│  │  ResumeService  RecruiterService  CampaignService  │    │
│  │  PDFParser  AIService  EmailService  GmailService  │    │
│  └──────┬──────────────────┬──────────────────┬───────┘    │
└─────────┼──────────────────┼──────────────────┼────────────┘
          │                  │                  │
┌─────────▼──────────┐ ┌─────▼─────────┐ ┌─────▼──────────┐
│   PostgreSQL       │ │  Supabase     │ │    Redis       │
│   (Supabase)       │ │   Storage     │ │  (Cache/Queue) │
└────────────────────┘ └───────────────┘ └────────┬───────┘
                                                   │
                                         ┌─────────▼────────┐
                                         │  Celery Workers  │
                                         │  - parse_resume  │
                                         │  - send_email    │
                                         │  - follow_ups    │
                                         └──────────────────┘
```

## Tech Stack

- **Framework:** FastAPI 0.115+
- **Language:** Python 3.11+
- **Database:** PostgreSQL (via Supabase)
- **Storage:** Supabase Storage
- **Cache/Queue:** Redis
- **Task Queue:** Celery
- **Web Scraping:** Playwright
- **AI:** Google Gemini 2.0 Flash, OpenAI (fallback)
- **Email:** Gmail API (OAuth 2.0)
- **Container:** Docker & Docker Compose

## Project Structure

```
careers-backend/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration and environment variables
│   ├── celery_app.py           # Celery configuration
│   ├── tasks.py                # Background tasks
│   │
│   ├── api/                    # API route handlers
│   │   ├── resumes.py          # Resume endpoints
│   │   ├── recruiters.py       # Recruiter endpoints
│   │   ├── emails.py           # Email endpoints
│   │   ├── campaigns.py        # Campaign endpoints
│   │   ├── analytics.py        # Analytics endpoints
│   │   └── auth.py             # Gmail OAuth endpoints
│   │
│   ├── services/               # Business logic layer
│   │   ├── resume_service.py   # Resume CRUD operations
│   │   ├── pdf_parser.py       # PDF text extraction
│   │   ├── ai_service.py       # AI analysis (Gemini/OpenAI)
│   │   ├── storage_service.py  # Supabase Storage operations
│   │   ├── linkedin_scraper.py # LinkedIn automation
│   │   ├── recruiter_service.py# Recruiter CRUD operations
│   │   ├── email_service.py    # Email generation
│   │   ├── gmail_service.py    # Gmail API integration
│   │   ├── campaign_service.py # Campaign management
│   │   └── analytics_service.py# Analytics calculations
│   │
│   ├── schemas/                # Pydantic models
│   │   ├── resume.py
│   │   ├── recruiter.py
│   │   ├── email.py
│   │   ├── campaign.py
│   │   └── analytics.py
│   │
│   └── middleware/             # Middleware components
│       └── auth.py             # NextAuth JWT verification
│
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md
│   ├── API_REFERENCE.md
│   ├── DEPLOYMENT.md
│   ├── LINKEDIN_SCRAPING.md
│   ├── EMAIL_GENERATION.md
│   ├── GMAIL_OAUTH.md
│   ├── CAMPAIGNS_AND_ANALYTICS.md
│   └── TESTING_GUIDE.md
│
├── Dockerfile                  # Docker image definition
├── docker-compose.yml          # Multi-container setup
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## Features

### 1. Resume Management
- Upload PDF resumes
- Extract text with PyPDF2
- AI-powered analysis (skills, experience, education)
- Store files in Supabase Storage
- List and view resumes
- Set active resume

### 2. LinkedIn Scraping
- Search recruiters by keywords and location
- Headless browser automation with Playwright
- Extract recruiter profiles (name, title, company, LinkedIn URL)
- Rate limiting and error handling
- Store results in database

### 3. Email Generation
- AI-powered personalized emails
- Multiple tone options (professional, friendly, enthusiastic)
- ATS keyword matching
- Resume and recruiter context integration
- Preview before sending

### 4. Gmail Integration
- OAuth 2.0 authentication flow
- Send emails via Gmail API
- Token refresh handling
- Connection status checking
- Disconnect/reconnect functionality

### 5. Campaign Management
- Create and organize campaigns
- Set daily email limits
- Track performance metrics
- Pause/resume campaigns
- Campaign-specific analytics

### 6. Analytics Dashboard
- Overview statistics
- Performance metrics (open rate, reply rate)
- Timeline visualization
- Top campaigns and recruiters
- Recent activity feed

### 7. Background Jobs
- Asynchronous resume parsing
- Queued email sending
- Scheduled daily limit resets
- Automated follow-up processing
- Task monitoring with Flower

## Installation

### Prerequisites

- Docker & Docker Compose
- Python 3.11+ (for local development)
- Node.js 18+ (for frontend)

### Environment Variables

Create a `.env` file in the `careers-backend` directory:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# Security
SECRET_KEY=your-secret-key-here
INTERNAL_API_KEY=your-internal-api-key

# AI Services
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...

# Gmail OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Docker Setup (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services:
- **backend:** FastAPI app (http://localhost:8000)
- **redis:** Message broker (localhost:6379)
- **celery-worker:** Background task processor
- **celery-beat:** Task scheduler
- **flower:** Celery monitoring (http://localhost:5555)

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Run FastAPI
uvicorn app.main:app --reload --port 8000

# Run Celery worker (separate terminal)
celery -A app.celery_app worker --loglevel=info

# Run Celery beat (separate terminal)
celery -A app.celery_app beat --loglevel=info

# Run Flower (separate terminal)
celery -A app.celery_app flower --port=5555
```

## API Documentation

### Interactive Docs

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Key Endpoints

#### Resumes
```
POST   /api/v1/resumes/upload          Upload resume
GET    /api/v1/resumes/                List resumes
GET    /api/v1/resumes/{id}            Get resume details
PATCH  /api/v1/resumes/{id}            Update resume
DELETE /api/v1/resumes/{id}            Delete resume
```

#### Recruiters
```
POST   /api/v1/recruiters/search       Search LinkedIn
GET    /api/v1/recruiters/             List recruiters
GET    /api/v1/recruiters/{id}         Get recruiter details
DELETE /api/v1/recruiters/{id}         Delete recruiter
```

#### Emails
```
POST   /api/v1/emails/generate         Generate email
POST   /api/v1/emails/send             Send email
GET    /api/v1/emails/                 List emails
GET    /api/v1/emails/{id}             Get email details
```

#### Campaigns
```
POST   /api/v1/campaigns/              Create campaign
GET    /api/v1/campaigns/              List campaigns
GET    /api/v1/campaigns/{id}          Get campaign
PATCH  /api/v1/campaigns/{id}          Update campaign
DELETE /api/v1/campaigns/{id}          Delete campaign
GET    /api/v1/campaigns/{id}/stats    Get stats
```

#### Analytics
```
GET    /api/v1/analytics/dashboard     Dashboard stats
POST   /api/v1/analytics/              Detailed analytics
```

#### Gmail OAuth
```
GET    /api/v1/auth/gmail/status       Check connection
GET    /api/v1/auth/gmail/authorize    Start OAuth flow
GET    /api/v1/auth/gmail/callback     OAuth callback
POST   /api/v1/auth/gmail/disconnect   Disconnect Gmail
```

## Testing

### Run Tests
```bash
pytest
```

### Manual Testing
See `docs/TESTING_GUIDE.md` for comprehensive testing instructions.

### API Testing with curl
```bash
# Health check
curl http://localhost:8000/health

# List resumes
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/resumes/

# Create campaign
curl -X POST http://localhost:8000/api/v1/campaigns/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Campaign","daily_limit":5}'
```

## Monitoring

### Flower Dashboard
Access http://localhost:5555 to monitor:
- Active tasks
- Worker status
- Task history
- Task statistics

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f celery-worker
docker-compose logs -f celery-beat
```

## Deployment

### Production Checklist

- [ ] Set strong SECRET_KEY and INTERNAL_API_KEY
- [ ] Configure production DATABASE_URL
- [ ] Set up Redis cluster or managed Redis
- [ ] Configure ALLOWED_ORIGINS for CORS
- [ ] Enable HTTPS/SSL
- [ ] Set up monitoring and alerting
- [ ] Configure backup and recovery
- [ ] Scale Celery workers based on load
- [ ] Set up log aggregation
- [ ] Configure rate limiting

### Docker Production

```bash
# Build production image
docker build -t careers-backend:latest .

# Run with production env
docker-compose -f docker-compose.prod.yml up -d
```

### Cloud Deployment

See `docs/DEPLOYMENT.md` for platform-specific guides:
- AWS (ECS, Lambda)
- Google Cloud (Cloud Run, GKE)
- Azure (Container Instances, AKS)
- Heroku
- Railway
- Render

## Performance

### Optimization Tips

1. **Database:**
   - Use connection pooling
   - Add indexes on frequently queried columns
   - Enable query caching

2. **Celery:**
   - Scale workers horizontally
   - Use task priorities
   - Configure result expiration

3. **Redis:**
   - Use Redis cluster for high availability
   - Configure memory limits
   - Enable persistence

4. **API:**
   - Enable response caching
   - Use async endpoints
   - Implement rate limiting

## Security

### Best Practices

- Store secrets in environment variables
- Use HTTPS in production
- Validate all inputs
- Implement rate limiting
- Use JWT for authentication
- Enable CORS selectively
- Keep dependencies updated
- Use Supabase RLS policies

## Troubleshooting

### Common Issues

**Issue:** Celery tasks not running
```bash
# Check Redis connection
docker-compose ps redis

# Restart worker
docker-compose restart celery-worker

# Check logs
docker-compose logs celery-worker
```

**Issue:** LinkedIn scraping fails
```bash
# Install Playwright browsers
playwright install chromium

# Check logs for rate limiting
docker-compose logs backend | grep "rate limit"
```

**Issue:** Gmail OAuth not working
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- Check redirect URI in Google Console
- Ensure Gmail API is enabled

**Issue:** Database connection errors
- Verify DATABASE_URL format
- Check Supabase project status
- Review connection pool settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Documentation

- **Architecture:** `docs/ARCHITECTURE.md`
- **API Reference:** `docs/API_REFERENCE.md`
- **Deployment:** `docs/DEPLOYMENT.md`
- **LinkedIn Scraping:** `docs/LINKEDIN_SCRAPING.md`
- **Email Generation:** `docs/EMAIL_GENERATION.md`
- **Gmail OAuth:** `docs/GMAIL_OAUTH.md`
- **Campaigns & Analytics:** `docs/CAMPAIGNS_AND_ANALYTICS.md`
- **Testing Guide:** `docs/TESTING_GUIDE.md`

## License

Proprietary - All rights reserved

## Support

For issues or questions:
1. Check the documentation in `docs/`
2. Review the troubleshooting section
3. Check Flower dashboard for task errors
4. Review application logs

## Roadmap

- [ ] Email template library
- [ ] A/B testing for emails
- [ ] Advanced analytics
- [ ] CRM integration
- [ ] Mobile app
- [ ] Bulk operations
- [ ] Custom reporting
- [ ] Webhook support
- [ ] API rate limiting
- [ ] Multi-language support
