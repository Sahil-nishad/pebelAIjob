# Careers Module Setup Checklist

Use this checklist to set up and deploy the AI Recruiter Outreach Agent module.

## ✅ Prerequisites

- [ ] PostgreSQL database (Supabase)
- [ ] Redis instance (local or cloud)
- [ ] Python 3.11+ installed
- [ ] Node.js 18+ installed
- [ ] Git repository access
- [ ] Gemini API key (or OpenAI API key)
- [ ] Google OAuth credentials (for Gmail)

## 📦 Backend Setup

### 1. Database Migration
- [ ] Navigate to project root
- [ ] Run migration:
  ```bash
  psql $DATABASE_URL < supabase/migrations/20260515000000_careers_module_v2.sql
  ```
- [ ] Verify tables created in Supabase dashboard
- [ ] Check RLS policies are enabled

### 2. Backend Installation
- [ ] Navigate to `careers-backend/`
- [ ] Run setup script:
  ```bash
  chmod +x setup.sh
  ./setup.sh
  ```
- [ ] Or manually:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  playwright install chromium
  ```

### 3. Environment Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Fill in required variables:
  - [ ] `DATABASE_URL` - PostgreSQL connection string
  - [ ] `SUPABASE_URL` - Your Supabase project URL
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key
  - [ ] `SECRET_KEY` - Generate with `openssl rand -hex 32`
  - [ ] `INTERNAL_API_KEY` - Generate with `openssl rand -hex 32`
  - [ ] `GEMINI_API_KEY` - Get from Google AI Studio
  - [ ] `GOOGLE_CLIENT_ID` - From Google Cloud Console
  - [ ] `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
  - [ ] `REDIS_URL` - Redis connection string
  - [ ] `ALLOWED_ORIGINS` - Your frontend URL

### 4. Start Backend Services

**Option A: Docker (Recommended)**
- [ ] Ensure Docker is installed
- [ ] Run:
  ```bash
  docker-compose up -d
  ```
- [ ] Verify services:
  ```bash
  docker-compose ps
  ```

**Option B: Local Development**
- [ ] Start Redis:
  ```bash
  redis-server
  ```
- [ ] Start FastAPI:
  ```bash
  uvicorn app.main:app --reload --port 8000
  ```
- [ ] (Optional) Start Celery worker:
  ```bash
  celery -A app.celery_app worker --loglevel=info
  ```

### 5. Test Backend
- [ ] Run test script:
  ```bash
  python test_api.py
  ```
- [ ] Visit http://localhost:8000
- [ ] Check API docs: http://localhost:8000/docs
- [ ] Test health endpoint: http://localhost:8000/health

## 🎨 Frontend Setup

### 1. Environment Variables
- [ ] Open `.env.local` in project root
- [ ] Add/update:
  ```bash
  CAREERS_API_URL=http://localhost:8000
  CAREERS_INTERNAL_API_KEY=<same-as-backend>
  ```

### 2. Install Dependencies (if needed)
- [ ] Run:
  ```bash
  npm install
  ```

### 3. Start Development Server
- [ ] Run:
  ```bash
  npm run dev
  ```
- [ ] Visit http://localhost:3000/careers
- [ ] Verify dashboard loads
- [ ] Check stats display

## 🔐 Google OAuth Setup

### 1. Google Cloud Console
- [ ] Go to https://console.cloud.google.com
- [ ] Create new project or select existing
- [ ] Enable Gmail API
- [ ] Create OAuth 2.0 credentials
- [ ] Add authorized redirect URI:
  - Development: `http://localhost:3000/api/careers/gmail/callback`
  - Production: `https://pebelai.com/api/careers/gmail/callback`
- [ ] Copy Client ID and Client Secret

### 2. Update Environment
- [ ] Add to backend `.env`:
  ```bash
  GOOGLE_CLIENT_ID=your-client-id
  GOOGLE_CLIENT_SECRET=your-client-secret
  GOOGLE_REDIRECT_URI=http://localhost:3000/api/careers/gmail/callback
  ```

## 🧪 Testing

### Backend Tests
- [ ] Test resume upload endpoint
- [ ] Test AI parsing
- [ ] Test email generation
- [ ] Test authentication

### Frontend Tests
- [ ] Login to application
- [ ] Navigate to /careers
- [ ] Check dashboard stats
- [ ] Test quick actions

### Integration Tests
- [ ] Upload a test resume (PDF)
- [ ] Verify parsing completes
- [ ] Check extracted data
- [ ] Generate test email

## 🚀 Deployment

### Backend Deployment (Render.com)
- [ ] Create new Web Service on Render
- [ ] Connect GitHub repository
- [ ] Set build command:
  ```bash
  pip install -r requirements.txt && playwright install chromium
  ```
- [ ] Set start command:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```
- [ ] Add all environment variables from `.env`
- [ ] Deploy and wait for build
- [ ] Test deployed API: `https://your-app.onrender.com/health`

### Redis Deployment
- [ ] Option 1: Upstash (free tier)
  - Create account at https://upstash.com
  - Create Redis database
  - Copy connection string
  - Update `REDIS_URL` in Render
- [ ] Option 2: Redis Cloud
- [ ] Option 3: Self-hosted

### Frontend Deployment (Vercel)
- [ ] Update `.env.local` with production values:
  ```bash
  CAREERS_API_URL=https://your-backend.onrender.com
  ```
- [ ] Add environment variables to Vercel dashboard
- [ ] Push to GitHub (auto-deploys)
- [ ] Verify deployment at https://pebelai.com/careers

### Database (Supabase)
- [ ] Verify migration applied
- [ ] Check RLS policies
- [ ] Create Storage bucket: `resumes`
- [ ] Set bucket to private
- [ ] Test file upload

## 📊 Monitoring

### Backend Monitoring
- [ ] Check Render logs
- [ ] Monitor API response times
- [ ] Set up error alerts
- [ ] (Optional) Add Sentry for error tracking

### Celery Monitoring
- [ ] Access Flower: http://localhost:5555
- [ ] Monitor task queue
- [ ] Check worker status
- [ ] Review failed tasks

### Database Monitoring
- [ ] Supabase dashboard
- [ ] Check table sizes
- [ ] Monitor query performance
- [ ] Review slow queries

## 🔧 Post-Deployment

### 1. Create Test Data
- [ ] Create test user account
- [ ] Upload test resume
- [ ] Verify parsing works
- [ ] Test email generation

### 2. Configure Rate Limits
- [ ] Set daily email limits per plan
- [ ] Configure scraping throttle
- [ ] Set API rate limits

### 3. Documentation
- [ ] Share API documentation with team
- [ ] Document deployment process
- [ ] Create user guide
- [ ] Write troubleshooting guide

## 🐛 Troubleshooting

### Backend Issues
- [ ] Check logs: `docker-compose logs -f backend`
- [ ] Verify environment variables
- [ ] Test database connection
- [ ] Check Redis connection
- [ ] Verify API keys are valid

### Frontend Issues
- [ ] Check browser console
- [ ] Verify API URL is correct
- [ ] Test authentication
- [ ] Check CORS settings

### Database Issues
- [ ] Verify migration applied
- [ ] Check RLS policies
- [ ] Test connection string
- [ ] Review table permissions

## 📈 Next Steps

After setup is complete:

### Week 1
- [ ] Build resume upload page
- [ ] Test PDF parsing thoroughly
- [ ] Implement resume list view
- [ ] Add resume detail page

### Week 2
- [ ] Implement LinkedIn scraping
- [ ] Build recruiter search UI
- [ ] Test email generation
- [ ] Create email preview

### Week 3
- [ ] Complete Gmail OAuth flow
- [ ] Implement email sending
- [ ] Add campaign management
- [ ] Build analytics dashboard

### Week 4+
- [ ] Follow-up automation
- [ ] Advanced analytics
- [ ] A/B testing
- [ ] Performance optimization

## ✅ Completion Checklist

- [ ] Backend running and accessible
- [ ] Frontend integrated with backend
- [ ] Database migration applied
- [ ] Redis connected
- [ ] API authentication working
- [ ] Resume upload functional
- [ ] AI parsing working
- [ ] Dashboard displaying stats
- [ ] Deployed to production
- [ ] Monitoring set up
- [ ] Documentation complete

## 🆘 Support

If you encounter issues:

1. Check the logs first
2. Review environment variables
3. Test API endpoints directly
4. Verify database connection
5. Check Redis connection
6. Review error messages
7. Consult documentation

## 📚 Resources

- Backend API Docs: http://localhost:8000/docs
- Implementation Guide: `CAREERS_MODULE_IMPLEMENTATION.md`
- Summary: `CAREERS_MODULE_SUMMARY.md`
- Backend README: `careers-backend/README.md`

---

**Last Updated**: May 15, 2026  
**Status**: Ready for Setup  
**Estimated Setup Time**: 2-3 hours
