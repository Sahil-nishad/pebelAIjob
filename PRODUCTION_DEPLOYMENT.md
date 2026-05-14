# 🚀 Production Deployment Guide

## Your Current Setup

| Component | Platform | Status |
|-----------|----------|--------|
| Frontend (Next.js) | **Vercel** | ✅ Already deployed |
| Database | **Supabase** | ✅ Already running |
| Careers Backend (FastAPI) | **Needs hosting** | ❌ Not deployed |
| Redis | **Needs hosting** | ❌ Not deployed |
| Celery Workers | **Needs hosting** | ❌ Not deployed |

## What You Need to Deploy

The careers backend needs a server that can run:
1. **FastAPI** (Python web server)
2. **Redis** (message queue for Celery)
3. **Celery Worker** (background tasks)
4. **Celery Beat** (scheduled tasks)

---

## 🎯 Recommended: Deploy on Railway (Easiest + Cheapest)

**Railway** is the easiest option - it supports Docker, has built-in Redis, and costs ~$5-20/month.

### Step 1: Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub
3. Connect your GitHub account

### Step 2: Create a New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Select your `pebelAIjob` repository
4. Railway will detect the project

### Step 3: Add Redis Service

1. In your Railway project, click "New"
2. Select "Database" → "Redis"
3. Railway will create a Redis instance
4. Copy the `REDIS_URL` from the Redis service variables

### Step 4: Deploy the Backend

1. Click "New" → "GitHub Repo"
2. Select your repo
3. Set the **Root Directory** to `careers-backend`
4. Railway will detect the Dockerfile and build it

### Step 5: Set Environment Variables

In the backend service settings, add these variables:

```env
# App
APP_ENV=production
DEBUG=false
API_HOST=0.0.0.0
API_PORT=8000

# Security
SECRET_KEY=<generate-a-strong-random-string-64-chars>
INTERNAL_API_KEY=<generate-another-random-string>
ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app,https://pebelai.com

# Database (from your Supabase project)
DATABASE_URL=postgresql://postgres.hbtoxufjvldkywlmorun:<YOUR-DB-PASSWORD>@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://hbtoxufjvldkywlmorun.supabase.co
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# Redis (from Railway Redis service)
REDIS_URL=<railway-redis-url>
CELERY_BROKER_URL=<railway-redis-url>
CELERY_RESULT_BACKEND=<railway-redis-url>

# AI
GEMINI_API_KEY=<your-gemini-api-key>
GROQ_API_KEY=<your-groq-api-key>

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=https://your-vercel-domain.vercel.app/api/careers/gmail/callback

# Rate Limiting
DEFAULT_DAILY_EMAIL_LIMIT=5
```

### Step 6: Add Celery Worker Service

1. Click "New" → "GitHub Repo" again
2. Select same repo, root directory: `careers-backend`
3. Override the start command:
   ```
   celery -A app.celery_app worker --loglevel=info --concurrency=2
   ```
4. Add the same environment variables as the backend

### Step 7: Add Celery Beat Service

1. Click "New" → "GitHub Repo" again
2. Select same repo, root directory: `careers-backend`
3. Override the start command:
   ```
   celery -A app.celery_app beat --loglevel=info
   ```
4. Add the same environment variables

### Step 8: Update Vercel Environment Variables

In your Vercel project settings, update:

```env
CAREERS_API_URL=https://your-railway-backend-url.railway.app
CAREERS_INTERNAL_API_KEY=<same-key-you-set-in-railway>
```

### Step 9: Update CORS & Redirect URIs

1. In Railway backend env vars, set `ALLOWED_ORIGINS` to your Vercel URL
2. In Google Cloud Console, add your production callback URL:
   - `https://your-vercel-domain.vercel.app/api/careers/gmail/callback`

### Step 10: Database Migration ✅ ALREADY DONE

The database migration has been applied. All careers tables are live in Supabase.

---

## 💰 Railway Pricing

| Service | Estimated Cost |
|---------|---------------|
| Backend (FastAPI) | ~$5/month |
| Redis | ~$5/month |
| Celery Worker | ~$5/month |
| Celery Beat | ~$3/month |
| **Total** | **~$18/month** |

Railway gives you $5 free credit/month on the Hobby plan ($5/month subscription).

---

## 🔄 Alternative: Deploy on Render (Free Tier Available)

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub

### Step 2: Create Redis Instance
1. Dashboard → New → Redis
2. Select free tier (or paid for persistence)
3. Copy the Internal URL

### Step 3: Deploy Backend as Web Service
1. Dashboard → New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Root Directory:** `careers-backend`
   - **Runtime:** Docker
   - **Instance Type:** Free (or Starter $7/month)
4. Add environment variables (same as Railway list above)

### Step 4: Deploy Celery Worker as Background Worker
1. Dashboard → New → Background Worker
2. Connect same repo
3. Settings:
   - **Root Directory:** `careers-backend`
   - **Build Command:** `docker build -t worker .`
   - **Start Command:** `celery -A app.celery_app worker --loglevel=info`
4. Add environment variables

### Step 5: Deploy Celery Beat as Background Worker
1. Dashboard → New → Background Worker
2. Same setup but start command:
   ```
   celery -A app.celery_app beat --loglevel=info
   ```

### Step 6: Update Vercel
Same as Railway Step 8 - update `CAREERS_API_URL` to your Render URL.

### Render Pricing

| Service | Free Tier | Paid |
|---------|-----------|------|
| Backend | ✅ (sleeps after 15min) | $7/month |
| Redis | ✅ (25MB, no persistence) | $10/month |
| Worker | ❌ | $7/month |
| Beat | ❌ | $7/month |
| **Total** | **Free (limited)** | **~$31/month** |

⚠️ Free tier limitations: Backend sleeps after 15 min of inactivity, Redis has no persistence, no background workers.

---

## 🔄 Alternative: Deploy on Fly.io

### Step 1: Install Fly CLI
```bash
# Windows (PowerShell)
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Or download from https://fly.io/docs/flyctl/install/
```

### Step 2: Login
```bash
fly auth login
```

### Step 3: Create fly.toml in careers-backend
```toml
app = "pebelai-careers-backend"
primary_region = "bom"  # Mumbai (closest to India)

[build]
  dockerfile = "Dockerfile"

[env]
  APP_ENV = "production"
  API_HOST = "0.0.0.0"
  API_PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512
```

### Step 4: Deploy
```bash
cd careers-backend
fly launch
fly deploy
```

### Step 5: Add Redis
```bash
fly redis create
```

### Step 6: Set Secrets
```bash
fly secrets set DATABASE_URL="postgresql://..." REDIS_URL="redis://..." ...
```

### Fly.io Pricing
| Service | Cost |
|---------|------|
| Backend (256MB) | ~$3/month |
| Redis (256MB) | ~$5/month |
| Worker (256MB) | ~$3/month |
| Beat (256MB) | ~$2/month |
| **Total** | **~$13/month** |

---

## 🎯 My Recommendation: Railway

**Why Railway is best for you:**
1. ✅ Easiest setup (connects to GitHub, auto-deploys)
2. ✅ Built-in Redis (one click)
3. ✅ Supports Docker natively
4. ✅ Auto-deploys on git push
5. ✅ Good free tier ($5 credit/month)
6. ✅ Simple environment variable management
7. ✅ Logs and monitoring built-in
8. ✅ Scales easily when needed

---

## 📋 Complete Deployment Checklist

### Pre-Deployment

- [ ] Get a Gemini API key (https://aistudio.google.com/app/apikey)
- [ ] Run database migration on Supabase
- [ ] Generate strong SECRET_KEY (use: `openssl rand -hex 32`)
- [ ] Generate INTERNAL_API_KEY (use: `openssl rand -hex 32`)
- [ ] Note your Vercel production URL

### Deploy Backend (Railway)

- [ ] Create Railway account
- [ ] Create new project
- [ ] Add Redis service
- [ ] Deploy backend from GitHub (root: `careers-backend`)
- [ ] Set all environment variables
- [ ] Verify backend is running (visit URL)
- [ ] Deploy Celery worker (same repo, custom start command)
- [ ] Deploy Celery beat (same repo, custom start command)

### Connect Frontend

- [ ] Get Railway backend URL
- [ ] Update Vercel env vars:
  - `CAREERS_API_URL=https://your-backend.railway.app`
  - `CAREERS_INTERNAL_API_KEY=your-key`
- [ ] Redeploy Vercel (or push a commit)

### Post-Deployment

- [ ] Test campaign creation on production
- [ ] Test analytics dashboard
- [ ] Test resume upload
- [ ] Verify Celery tasks are running
- [ ] Update Google OAuth redirect URIs
- [ ] Test Gmail OAuth flow on production

---

## 🔐 Security Checklist for Production

- [ ] Use strong, unique SECRET_KEY (64+ chars)
- [ ] Use strong INTERNAL_API_KEY
- [ ] Set ALLOWED_ORIGINS to only your domain
- [ ] Set DEBUG=false
- [ ] Use Supabase connection pooler URL (port 6543)
- [ ] Enable HTTPS (Railway/Render do this automatically)
- [ ] Don't expose Redis publicly
- [ ] Rotate API keys periodically
- [ ] Enable Supabase RLS policies

---

## 🗄️ Database Migration

Before the backend works, you need the careers tables in Supabase.

### Option 1: Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard
2. Select your project (hbtoxufjvldkywlmorun)
3. Go to SQL Editor
4. Click "New Query"
5. Paste the contents of `supabase/migrations/20260515000000_careers_module_v2.sql`
6. Click "Run"

### Option 2: Supabase CLI

```bash
npx supabase db push
```

---

## 🔄 CI/CD (Auto-Deploy on Push)

### Railway
Railway auto-deploys when you push to your connected branch. No extra setup needed.

### Vercel
Vercel already auto-deploys on push to main. No extra setup needed.

### Workflow
```
git push origin main
  ├── Vercel auto-deploys frontend
  └── Railway auto-deploys backend + workers
```

---

## 📊 Monitoring in Production

### Railway Dashboard
- View logs in real-time
- Monitor CPU/memory usage
- Check deployment status
- View environment variables

### Supabase Dashboard
- Monitor database queries
- Check storage usage
- View auth logs
- Monitor API usage

### Vercel Dashboard
- View deployment logs
- Monitor function invocations
- Check error rates
- View analytics

---

## 🐛 Troubleshooting Production

### Backend not responding
1. Check Railway logs
2. Verify environment variables
3. Check if service is sleeping (free tier)
4. Verify DATABASE_URL is correct

### Frontend can't reach backend
1. Check CAREERS_API_URL in Vercel env vars
2. Verify CORS settings (ALLOWED_ORIGINS)
3. Check if backend URL is correct
4. Look at Vercel function logs

### Celery tasks not running
1. Check worker logs in Railway
2. Verify REDIS_URL is correct
3. Check Redis service is running
4. Verify CELERY_BROKER_URL matches REDIS_URL

### Database errors
1. Check Supabase dashboard for errors
2. Verify migration was run
3. Check connection pooler URL (use port 6543 for production)
4. Verify RLS policies

### Gmail OAuth not working
1. Update redirect URI in Google Console
2. Add production URL to authorized origins
3. Check GOOGLE_CLIENT_ID and SECRET are set
4. Verify callback URL matches

---

## 💡 Production Tips

1. **Use Supabase connection pooler** (port 6543) instead of direct connection (port 5432)
2. **Set concurrency=2** for Celery worker to save memory
3. **Enable auto-sleep** on Railway to save costs when not in use
4. **Monitor Redis memory** - clear old results periodically
5. **Set up alerts** for failed tasks and errors
6. **Use environment-specific configs** (don't hardcode URLs)
7. **Keep secrets in platform env vars** (never in code)

---

## 📝 Summary of Changes Needed

### In Vercel (Frontend)
```env
# Update these in Vercel Dashboard → Settings → Environment Variables
CAREERS_API_URL=https://your-backend.railway.app
CAREERS_INTERNAL_API_KEY=your-production-key
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

### In Railway (Backend)
```env
# Set these in Railway Dashboard → Service → Variables
APP_ENV=production
DEBUG=false
SECRET_KEY=<strong-random-64-char-string>
INTERNAL_API_KEY=<same-as-vercel-CAREERS_INTERNAL_API_KEY>
ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app
DATABASE_URL=postgresql://postgres.hbtoxufjvldkywlmorun:<password>@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://hbtoxufjvldkywlmorun.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
REDIS_URL=<from-railway-redis-service>
CELERY_BROKER_URL=<from-railway-redis-service>
CELERY_RESULT_BACKEND=<from-railway-redis-service>
GEMINI_API_KEY=<your-gemini-key>
GROQ_API_KEY=<your-groq-key>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=https://your-vercel-domain.vercel.app/api/careers/gmail/callback
```

### In Google Cloud Console
```
Authorized redirect URIs:
  - https://your-vercel-domain.vercel.app/api/careers/gmail/callback
  - https://your-vercel-domain.vercel.app/api/auth/callback/google

Authorized JavaScript origins:
  - https://your-vercel-domain.vercel.app
```

### In Supabase
```
Run migration: supabase/migrations/20260515000000_careers_module_v2.sql
```

---

## ⏱️ Time Estimate

| Step | Time |
|------|------|
| Create Railway account | 2 min |
| Add Redis | 1 min |
| Deploy backend | 5 min |
| Set env vars | 5 min |
| Deploy workers | 5 min |
| Run DB migration | 3 min |
| Update Vercel env vars | 3 min |
| Update Google Console | 3 min |
| Test everything | 10 min |
| **Total** | **~37 minutes** |

---

## 🎉 After Deployment

Once everything is deployed:

1. **Visit your production site**
2. **Navigate to /careers/outreach** - Create a campaign
3. **Navigate to /careers/analytics** - View dashboard
4. **Upload a resume** - Test parsing
5. **Search recruiters** - Test LinkedIn scraping
6. **Generate an email** - Test AI generation
7. **Check Railway logs** - Verify tasks are running

**Your careers module will be live and fully functional!** 🚀
