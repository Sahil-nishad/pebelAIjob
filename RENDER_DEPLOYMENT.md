# Deploy Careers Backend on Render

## What You're Deploying

| Service | Type | Cost |
|---------|------|------|
| FastAPI Backend | Web Service (Docker) | $7/month |
| Redis | Managed Redis | $10/month |
| Celery Worker | Background Worker | $7/month |
| Celery Beat | Background Worker | $7/month |
| **Total** | | **~$31/month** |

> ✅ Database migration is already done on Supabase — no DB setup needed.

---

## Step 1 — Push Code to GitHub

First push all the new code to your GitHub repo so Render can pull it.

```powershell
cd c:\Users\sahil\OneDrive\Desktop\jobflow
git add .
git commit -m "feat: careers module - campaigns, analytics, render deployment"
git push origin main
```

---

## Step 2 — Create Render Account

1. Go to **https://render.com**
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (same account as your repo)
4. Authorize Render to access your repositories

---

## Step 3 — Create Redis First

Redis must exist before the other services can reference it.

1. In Render dashboard → click **"New +"**
2. Select **"Redis"**
3. Fill in:
   - **Name:** `pebelai-redis`
   - **Region:** `Singapore` (closest to your Supabase Tokyo region)
   - **Plan:** `Starter` ($10/month)
4. Click **"Create Redis"**
5. Wait ~1 minute for it to provision
6. **Copy the "Internal Redis URL"** — you'll need it for env vars
   - Looks like: `redis://red-xxxxx:6379`

---

## Step 4 — Deploy FastAPI Backend

1. In Render dashboard → click **"New +"**
2. Select **"Web Service"**
3. Select **"Build and deploy from a Git repository"**
4. Connect your GitHub repo: `pebelAIjob`
5. Fill in settings:
   - **Name:** `pebelai-careers-backend`
   - **Region:** `Singapore`
   - **Branch:** `main`
   - **Root Directory:** `careers-backend`
   - **Runtime:** `Docker`
   - **Dockerfile Path:** `./Dockerfile`
   - **Plan:** `Starter` ($7/month)
6. Click **"Advanced"** to add environment variables (see Step 6)
7. Click **"Create Web Service"**

---

## Step 5 — Deploy Celery Worker

1. In Render dashboard → click **"New +"**
2. Select **"Background Worker"**
3. Connect same GitHub repo: `pebelAIjob`
4. Fill in settings:
   - **Name:** `pebelai-celery-worker`
   - **Region:** `Singapore`
   - **Branch:** `main`
   - **Root Directory:** `careers-backend`
   - **Runtime:** `Docker`
   - **Dockerfile Path:** `./Dockerfile`
   - **Docker Command:** `celery -A app.celery_app worker --loglevel=info --concurrency=2`
   - **Plan:** `Starter` ($7/month)
5. Add same environment variables (see Step 6)
6. Click **"Create Background Worker"**

---

## Step 6 — Deploy Celery Beat

1. In Render dashboard → click **"New +"**
2. Select **"Background Worker"**
3. Connect same GitHub repo: `pebelAIjob`
4. Fill in settings:
   - **Name:** `pebelai-celery-beat`
   - **Region:** `Singapore`
   - **Branch:** `main`
   - **Root Directory:** `careers-backend`
   - **Runtime:** `Docker`
   - **Dockerfile Path:** `./Dockerfile`
   - **Docker Command:** `celery -A app.celery_app beat --loglevel=info`
   - **Plan:** `Starter` ($7/month)
5. Add same environment variables (see Step 6)
6. Click **"Create Background Worker"**

---

## Step 6 — Environment Variables

Add these to **each** of the 3 services (backend, worker, beat).

> In Render: Service → Environment → Add Environment Variable

### Required Variables

| Key | Value |
|-----|-------|
| `APP_ENV` | `production` |
| `DEBUG` | `false` |
| `SECRET_KEY` | Generate: use any 64-char random string |
| `INTERNAL_API_KEY` | Generate: use any 32-char random string |
| `ALLOWED_ORIGINS` | `https://www.pebelai.com` |
| `DATABASE_URL` | See below |
| `SUPABASE_URL` | `https://hbtoxufjvldkywlmorun.supabase.co` |
| `SUPABASE_ANON_KEY` | Your Supabase anon key (from .env.local) |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (from .env.local) |
| `REDIS_URL` | Internal Redis URL from Step 3 |
| `CELERY_BROKER_URL` | Same as REDIS_URL |
| `CELERY_RESULT_BACKEND` | Same as REDIS_URL |
| `GEMINI_API_KEY` | Your Gemini API key |
| `GROQ_API_KEY` | Your Groq API key (from .env.local) |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID (from .env.local) |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret (from .env.local) |
| `GOOGLE_REDIRECT_URI` | `https://www.pebelai.com/api/careers/gmail/callback` |

### DATABASE_URL (Supabase Connection Pooler)

Get this from Supabase Dashboard:
1. Go to https://supabase.com/dashboard/project/hbtoxufjvldkywlmorun
2. Click **"Connect"** (top right)
3. Select **"Transaction pooler"** tab
4. Copy the connection string — it looks like:
   ```
   postgresql://postgres.hbtoxufjvldkywlmorun:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual Supabase database password

> ⚠️ Use port **6543** (pooler), NOT 5432 (direct). Render's servers need the pooler.

### Generate SECRET_KEY

Run this in PowerShell to generate a strong key:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

---

## Step 7 — Get Your Backend URL

After the backend deploys (~5-10 minutes):

1. Go to your `pebelai-careers-backend` service in Render
2. Copy the URL at the top — looks like:
   ```
   https://pebelai-careers-backend.onrender.com
   ```
3. Test it: open `https://pebelai-careers-backend.onrender.com/health` in browser
   - Should return: `{"status":"healthy",...}`

---

## Step 8 — Update Vercel Environment Variables

Now tell your frontend where the backend lives.

### Option A: Via Vercel Dashboard (Easiest)

1. Go to https://vercel.com/sahils-projects-2e05bd94/pebel-a-ijob/settings/environment-variables
2. Find `CAREERS_API_URL` → Edit
3. Set value to: `https://pebelai-careers-backend.onrender.com`
4. Make sure it's enabled for **Production**
5. Click Save

### Option B: Via CLI

```powershell
cd c:\Users\sahil\OneDrive\Desktop\jobflow
npx vercel env add CAREERS_API_URL production
# When prompted, enter: https://pebelai-careers-backend.onrender.com
```

Also verify `CAREERS_INTERNAL_API_KEY` matches what you set in Render:
```powershell
npx vercel env add CAREERS_INTERNAL_API_KEY production
# Enter the same INTERNAL_API_KEY you set in Render
```

---

## Step 9 — Redeploy Vercel

Trigger a fresh Vercel deployment to pick up the new env vars:

```powershell
cd c:\Users\sahil\OneDrive\Desktop\jobflow
git commit --allow-empty -m "chore: trigger redeploy with careers backend url"
git push origin main
```

Or just click **"Redeploy"** in the Vercel dashboard.

---

## Step 10 — Update Google OAuth

Your Gmail OAuth callback URL needs to be added to Google Cloud Console.

1. Go to https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Under **"Authorized redirect URIs"**, add:
   ```
   https://www.pebelai.com/api/careers/gmail/callback
   ```
4. Under **"Authorized JavaScript origins"**, add:
   ```
   https://www.pebelai.com
   ```
5. Click **Save**

---

## Step 11 — Test Everything

Once all services are deployed and Vercel is redeployed:

1. **Test backend health:**
   ```
   https://pebelai-careers-backend.onrender.com/health
   ```

2. **Test API docs:**
   ```
   https://pebelai-careers-backend.onrender.com/docs
   ```

3. **Test from frontend:**
   - Go to https://www.pebelai.com/careers/outreach
   - Create a campaign → should save successfully
   - Go to https://www.pebelai.com/careers/analytics
   - Should load dashboard stats

4. **Test resume upload:**
   - Go to https://www.pebelai.com/careers/resume/upload
   - Upload a PDF → should parse and save

---

## Deployment Checklist

- [ ] Code pushed to GitHub (`git push origin main`)
- [ ] Render account created (signed in with GitHub)
- [ ] Redis created (`pebelai-redis`, Singapore)
- [ ] Backend deployed (`pebelai-careers-backend`)
- [ ] Celery worker deployed (`pebelai-celery-worker`)
- [ ] Celery beat deployed (`pebelai-celery-beat`)
- [ ] All env vars set on all 3 services
- [ ] Backend health check passes (`/health`)
- [ ] `CAREERS_API_URL` updated in Vercel
- [ ] `CAREERS_INTERNAL_API_KEY` matches in Vercel + Render
- [ ] Vercel redeployed
- [ ] Google OAuth redirect URI updated
- [ ] Campaign creation works on pebelai.com
- [ ] Analytics dashboard loads on pebelai.com

---

## Troubleshooting

### Backend returns 502 from frontend
- Check `CAREERS_API_URL` in Vercel is set correctly
- Check `INTERNAL_API_KEY` matches between Vercel and Render
- Check backend logs in Render dashboard

### Backend crashes on startup
- Check `DATABASE_URL` is using port 6543 (pooler)
- Check all required env vars are set
- View logs: Render → Service → Logs tab

### Celery tasks not running
- Check `REDIS_URL` is the **Internal** Redis URL (not external)
- Check worker logs in Render dashboard
- Verify Redis service is running

### Gmail OAuth fails
- Check `GOOGLE_REDIRECT_URI` matches exactly what's in Google Console
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

### First deploy is slow
- Docker builds take 5-10 minutes on first deploy (Playwright is large)
- Subsequent deploys are faster (~2-3 min) due to layer caching

---

## Auto-Deploy on Push

Once set up, every `git push origin main` will:
1. ✅ Auto-redeploy Vercel (frontend)
2. ✅ Auto-redeploy Render backend + workers

No manual steps needed after initial setup.

---

## Cost Summary

| Service | Plan | Cost |
|---------|------|------|
| Vercel (frontend) | Hobby | Free |
| Supabase (database) | Free tier | Free |
| Render Redis | Starter | $10/month |
| Render Backend | Starter | $7/month |
| Render Worker | Starter | $7/month |
| Render Beat | Starter | $7/month |
| **Total** | | **$31/month** |

> 💡 You can skip Celery Beat initially (saves $7/month) — it only handles scheduled tasks like daily limit resets. Add it later when needed.
