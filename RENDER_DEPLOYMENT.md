# Deploy Careers Backend — FREE Tier (Render + Vercel)

## Architecture (All Free)

| Service | Platform | Plan | Cost |
|---------|----------|------|------|
| Frontend + Cron Jobs | Vercel | Hobby (Free) | $0 |
| Database | Supabase | Free | $0 |
| FastAPI Backend | Render | Free Web Service | $0 |
| **Total** | | | **$0/month** |

### What's Different from Paid Setup
- ❌ No Redis (not needed)
- ❌ No Celery Worker/Beat (replaced by Vercel Cron)
- ⚠️ Backend sleeps after 15 min of inactivity (wakes in ~30s on first request)
- ⚠️ LinkedIn scraping disabled (Playwright too heavy for free tier)
- ✅ Everything else works: campaigns, analytics, email generation, Gmail OAuth

---

## Step 1 — Push Code to GitHub

```powershell
git add .
git commit -m "feat: free tier deployment config"
git push origin main
```

---

## Step 2 — Create Render Account

1. Go to **https://render.com**
2. Click **"Get Started for Free"**
3. Sign up with **GitHub**

---

## Step 3 — Deploy FastAPI Backend on Render

1. Click **"New +"** → **"Web Service"**
2. Select **"Build and deploy from a Git repository"**
3. Connect your repo: **pebelAIjob**
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `pebelai-careers-backend` |
| **Region** | Singapore (or closest to you) |
| **Branch** | `main` |
| **Root Directory** | `careers-backend` |
| **Runtime** | Docker |
| **Instance Type** | **Free** |

5. Click **"Advanced"** → Add environment variables (see below)
6. Click **"Create Web Service"**

---

## Step 4 — Set Environment Variables on Render

In Render → Your service → **Environment** tab → Add these:

| Key | Value |
|-----|-------|
| `APP_ENV` | `production` |
| `DEBUG` | `false` |
| `SECRET_KEY` | Any random 32+ char string |
| `INTERNAL_API_KEY` | Any random 32+ char string (save this — needed for Vercel too) |
| `ALLOWED_ORIGINS` | `https://www.pebelai.com` |
| `DATABASE_URL` | Your Supabase pooler URL (see below) |
| `SUPABASE_URL` | `https://hbtoxufjvldkywlmorun.supabase.co` |
| `SUPABASE_ANON_KEY` | Copy from your `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | Copy from your `.env.local` |
| `GEMINI_API_KEY` | Your Gemini API key |
| `GROQ_API_KEY` | Copy from your `.env.local` |
| `GOOGLE_CLIENT_ID` | Copy from your `.env.local` |
| `GOOGLE_CLIENT_SECRET` | Copy from your `.env.local` |
| `GOOGLE_REDIRECT_URI` | `https://www.pebelai.com/api/careers/gmail/callback` |

### How to Get DATABASE_URL

1. Go to https://supabase.com/dashboard/project/hbtoxufjvldkywlmorun
2. Click **"Connect"** button (top right)
3. Select **"Transaction Pooler"** tab
4. Copy the URI — looks like:
   ```
   postgresql://postgres.hbtoxufjvldkywlmorun:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
   ```
5. Replace `[PASSWORD]` with your database password

### How to Generate SECRET_KEY

Run in PowerShell:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 40 | ForEach-Object {[char]$_})
```

---

## Step 5 — Wait for Deploy (~5-10 min)

Render will:
1. Pull your code from GitHub
2. Build the Docker image
3. Start the service

Once it shows **"Live"**, copy your backend URL:
```
https://pebelai-careers-backend.onrender.com
```

Test it: open `https://pebelai-careers-backend.onrender.com/health`

---

## Step 6 — Update Vercel Environment Variables

Go to **Vercel Dashboard** → **pebel-a-ijob** → **Settings** → **Environment Variables**

Add/update these for **Production**:

| Key | Value |
|-----|-------|
| `CAREERS_API_URL` | `https://pebelai-careers-backend.onrender.com` |
| `CAREERS_INTERNAL_API_KEY` | Same value as `INTERNAL_API_KEY` in Render |

---

## Step 7 — Redeploy Vercel

```powershell
git commit --allow-empty -m "chore: trigger redeploy"
git push origin main
```

---

## Step 8 — Update Google OAuth (for Gmail)

Go to https://console.cloud.google.com/apis/credentials

Edit your OAuth 2.0 Client ID:
- **Authorized redirect URIs** → Add:
  ```
  https://www.pebelai.com/api/careers/gmail/callback
  ```
- **Authorized JavaScript origins** → Add:
  ```
  https://www.pebelai.com
  ```

---

## Step 9 — Test

1. Open https://www.pebelai.com/careers/outreach
2. Click "New Campaign" → Create one
3. Open https://www.pebelai.com/careers/analytics
4. Check dashboard loads

---

## ✅ Done! Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Backend deployed on Render (Free tier)
- [ ] All env vars set on Render
- [ ] Backend health check passes
- [ ] `CAREERS_API_URL` set in Vercel (Production)
- [ ] `CAREERS_INTERNAL_API_KEY` set in Vercel (Production)
- [ ] Vercel redeployed
- [ ] Google OAuth redirect URI updated
- [ ] Campaign creation works on www.pebelai.com
- [ ] Analytics dashboard loads

---

## Free Tier Limitations

| Limitation | Impact | Workaround |
|-----------|--------|------------|
| Backend sleeps after 15 min | First request takes ~30s to wake | Normal after that |
| No Celery/Redis | No background workers | Vercel Cron handles scheduled tasks |
| No Playwright | LinkedIn scraping disabled | Add recruiters manually or upgrade later |
| 750 hours/month | Enough for 1 service 24/7 | Only 1 backend service needed |

### When to Upgrade ($7/month Starter)
- If cold starts bother you (backend stays awake)
- If you need LinkedIn scraping (Playwright)
- If you need more than 750 hours/month

---

## How Scheduled Tasks Work (Without Celery)

| Task | How It Runs | Schedule |
|------|-------------|----------|
| Reset daily email limits | Vercel Cron → Backend API | Daily at midnight UTC |
| Send reminders | Vercel Cron (existing) | Daily at 8 AM UTC |
| Resume parsing | Inline (during upload) | Immediate |
| Email sending | Inline (when user clicks send) | Immediate |

The Vercel Cron job at `/api/cron/careers-daily-reset` calls the backend's `/api/v1/campaigns/reset-daily` endpoint every day at midnight.

---

## Troubleshooting

### Backend shows "Service Unavailable"
- **Cause:** Backend is sleeping (free tier)
- **Fix:** Wait 30 seconds and refresh. It wakes up automatically.

### "Failed to connect to careers service"
- **Check:** `CAREERS_API_URL` in Vercel matches your Render URL
- **Check:** Backend is deployed and shows "Live" in Render

### Campaign creation fails
- **Check:** `INTERNAL_API_KEY` matches between Render and Vercel
- **Check:** `ALLOWED_ORIGINS` includes `https://www.pebelai.com`
- **Check:** `DATABASE_URL` uses port 6543 (pooler)

### Backend crashes on startup
- **Check:** All required env vars are set
- **Check:** `DATABASE_URL` is correct (test in Supabase SQL editor)
- **View logs:** Render → Service → Logs tab

### Vercel cron not running
- Cron jobs only run in Production (not Preview)
- Check Vercel → Project → Cron Jobs tab
- Verify `CRON_SECRET` is set

---

## Auto-Deploy

After initial setup, every `git push origin main` will:
- ✅ Auto-redeploy Vercel frontend
- ✅ Auto-redeploy Render backend

No manual steps needed!

---

## Future Upgrades (When Ready to Pay)

### Add Redis + Celery ($17/month extra)
1. Add Redis on Render ($10/month Starter)
2. Add Celery Worker ($7/month Background Worker)
3. Set `REDIS_URL` and `CELERY_BROKER_URL` env vars
4. Uncomment Playwright in Dockerfile for LinkedIn scraping

### Move to Starter Plan ($7/month)
- Backend stays awake (no cold starts)
- Better performance
- More memory (512MB → 512MB but always on)
