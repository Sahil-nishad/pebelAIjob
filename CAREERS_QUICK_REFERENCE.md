# Careers Module - Quick Reference

## 🚀 Quick Start Commands

### Backend Setup
```bash
cd careers-backend
./setup.sh
cp .env.example .env
# Edit .env with your credentials
docker-compose up -d
```

### Test Backend
```bash
python test_api.py
curl http://localhost:8000/health
```

### Frontend Setup
```bash
# Add to .env.local
echo "CAREERS_API_URL=http://localhost:8000" >> .env.local
npm run dev
```

## 📍 Important URLs

| Service | URL | Description |
|---------|-----|-------------|
| Backend API | http://localhost:8000 | FastAPI server |
| API Docs | http://localhost:8000/docs | Swagger UI |
| Frontend | http://localhost:3000/careers | Careers dashboard |
| Celery Monitor | http://localhost:5555 | Flower UI |
| Redis | localhost:6379 | Cache/Queue |

## 🔑 Environment Variables

### Backend (.env)
```bash
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
SECRET_KEY=<generate-with-openssl>
INTERNAL_API_KEY=<generate-with-openssl>
GEMINI_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
REDIS_URL=redis://localhost:6379/0
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (.env.local)
```bash
CAREERS_API_URL=http://localhost:8000
CAREERS_INTERNAL_API_KEY=<same-as-backend>
```

## 📊 Database Tables

| Table | Purpose |
|-------|---------|
| resumes | Resume files and parsed data |
| recruiters | Recruiter profiles |
| recruiter_posts | Job postings |
| campaigns | Outreach campaigns |
| outreach_emails | Email drafts and sent emails |
| email_templates | Reusable templates |
| careers_settings | User preferences |
| scraping_jobs | Background tasks |
| analytics_events | Event tracking |
| followups | Follow-up automation |
| gmail_connections | Gmail OAuth tokens |

## 🛠️ Common Commands

### Docker
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down

# Rebuild
docker-compose up -d --build
```

### Database
```bash
# Apply migration
psql $DATABASE_URL < supabase/migrations/20260515000000_careers_module_v2.sql

# Connect to database
psql $DATABASE_URL

# Check tables
psql $DATABASE_URL -c "\dt"
```

### Backend
```bash
# Start development server
uvicorn app.main:app --reload --port 8000

# Start Celery worker
celery -A app.celery_app worker --loglevel=info

# Start Flower
celery -A app.celery_app flower --port=5555
```

### Testing
```bash
# Test backend
python test_api.py

# Test specific endpoint
curl -X GET http://localhost:8000/api/v1/auth/health

# Test with authentication
curl -X GET http://localhost:8000/api/v1/resumes/ \
  -H "Authorization: Bearer <token>"
```

## 🔧 API Endpoints

### Resumes
```bash
POST   /api/v1/resumes/upload      # Upload resume
GET    /api/v1/resumes/            # List resumes
GET    /api/v1/resumes/{id}        # Get resume
PATCH  /api/v1/resumes/{id}        # Update resume
DELETE /api/v1/resumes/{id}        # Delete resume
POST   /api/v1/resumes/parse       # Parse resume
```

### Recruiters
```bash
POST   /api/v1/recruiters/search   # Search recruiters
GET    /api/v1/recruiters/         # List recruiters
GET    /api/v1/recruiters/{id}     # Get recruiter
```

### Campaigns
```bash
POST   /api/v1/campaigns/          # Create campaign
GET    /api/v1/campaigns/          # List campaigns
GET    /api/v1/campaigns/{id}      # Get campaign
PATCH  /api/v1/campaigns/{id}      # Update campaign
DELETE /api/v1/campaigns/{id}      # Delete campaign
GET    /api/v1/campaigns/{id}/stats # Get stats
```

### Emails
```bash
POST   /api/v1/emails/generate     # Generate email
POST   /api/v1/emails/             # Create draft
GET    /api/v1/emails/             # List emails
GET    /api/v1/emails/{id}         # Get email
POST   /api/v1/emails/send         # Send email
```

### Analytics
```bash
GET    /api/v1/analytics/dashboard # Dashboard stats
POST   /api/v1/analytics/          # Detailed analytics
```

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port is in use
lsof -i :8000

# Check environment
cat .env | grep -v "^#"

# Check logs
docker-compose logs backend
```

### Database connection fails
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check if migration applied
psql $DATABASE_URL -c "SELECT * FROM resumes LIMIT 1"
```

### Redis connection fails
```bash
# Check if Redis is running
redis-cli ping

# Start Redis
redis-server

# Or use Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### Authentication errors
```bash
# Check NextAuth session
curl http://localhost:3000/api/auth/session

# Verify token
echo $TOKEN | base64 -d
```

## 📦 File Structure

```
careers-backend/
├── app/
│   ├── main.py              # Entry point
│   ├── config.py            # Settings
│   ├── api/                 # Routes
│   ├── services/            # Business logic
│   ├── schemas/             # Pydantic models
│   ├── middleware/          # Auth, etc.
│   └── db/                  # Database
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env

app/(dashboard)/careers/
├── page.tsx                 # Dashboard
├── resume/                  # Resume pages
├── recruiters/              # Recruiter pages
├── outreach/                # Campaign pages
└── analytics/               # Analytics pages
```

## 🔐 Security

### Generate Keys
```bash
# Secret key
openssl rand -hex 32

# API key
openssl rand -hex 32
```

### Check RLS
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

## 📈 Monitoring

### Check Service Health
```bash
# Backend
curl http://localhost:8000/health

# Redis
redis-cli ping

# Database
psql $DATABASE_URL -c "SELECT 1"
```

### View Logs
```bash
# Backend
docker-compose logs -f backend

# Celery
docker-compose logs -f celery-worker

# All services
docker-compose logs -f
```

## 🚀 Deployment

### Render.com
```bash
# Build command
pip install -r requirements.txt && playwright install chromium

# Start command
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Vercel
```bash
# Add environment variables
vercel env add CAREERS_API_URL

# Deploy
git push origin main
```

## 📚 Documentation

- **API Docs**: http://localhost:8000/docs
- **Implementation**: `CAREERS_MODULE_IMPLEMENTATION.md`
- **Summary**: `CAREERS_MODULE_SUMMARY.md`
- **Setup**: `CAREERS_SETUP_CHECKLIST.md`
- **Backend**: `careers-backend/README.md`

## 🆘 Quick Help

```bash
# Backend not responding
docker-compose restart backend

# Clear Redis cache
redis-cli FLUSHALL

# Reset database (DANGER!)
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# View all environment variables
docker-compose config
```

---

**Need Help?** Check the full documentation in `CAREERS_MODULE_IMPLEMENTATION.md`
