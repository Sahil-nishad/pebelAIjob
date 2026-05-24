# PebelAI

**AI Interview Coach · Job Search Portal · Application Tracker**

PebelAI is a full-stack career platform built for Indian job seekers. It combines a real-time AI interview coach (voice + video), a Tinder-style AI-matched job search, and a Kanban-style application tracker — all in one place.

Live: [pebelai.com](https://www.pebelai.com)

---

## Features

### AI Interview Coach
- **Live Interview Room** — Google Meet-style video call UI with animated AI interviewer panel
- **Voice Interview** — Orb-based minimal voice UI
- **Text Interview** — Chat-based mock interview with bullet-point AI feedback
- **Deepgram nova-2 STT** — Accurate speech-to-text for Indian English; auto-listens after AI speaks, auto-stops after 1.2s of silence; no push-to-talk needed on any device
- **Deepgram Aura TTS** — Natural AI voice (Athena female / Orion male, switchable mid-session)
- **Web Speech API parallel preview** — Live interim transcript shown as user speaks
- **Camera + body language analysis** — Optional camera feed; screenshots analyzed by Llama 4 Scout vision model for eye contact, posture, and expression scores
- **Performance report** — Overall score, grade, per-skill breakdown (confidence, communication, technical, structure, relevance), question-by-question feedback, improvement tips
- **Experience levels** — Fresher / Professional / Experienced — adjusts question difficulty
- **Session types** — Behavioral, Technical, Case Study, Salary Negotiation, General Prep
- **Practice PDF** — Download 10 tailored Q&A pairs for offline study
- **Session history** — All past sessions saved to Supabase, resumable

### AI Job Search
- **Tinder-style card UI** — Swipe through AI-matched jobs one at a time
- **Resume-based matching** — Upload PDF/DOCX → AI extracts skills, job title, experience level → searches relevant jobs
- **ATS score** — Resume scored 0–100 for ATS compatibility with grade, breakdown, and quick-win tips; shown as a badge in the job search UI
- **Multiple job sources** — LinkedIn (guest API), Adzuna, Serper.dev Google Jobs, JSearch, RemoteOK
- **India-focused filtering** — Only shows jobs in Indian cities or remote; excludes foreign locations
- **7-day freshness filter** — No stale listings
- **Experience-level filtering** — Fresher resumes don't get senior/lead roles
- **Seen-jobs deduplication** — Seen job IDs stored in localStorage; next search always returns fresh jobs
- **Smart Apply** — Direct API submission for Greenhouse/Lever jobs; Assisted Apply modal with clipboard pre-fill for all others
- **Save jobs** — Saved to Supabase `saved_jobs` table

### Application Tracker
- **Kanban board** — Drag-and-drop across Applied → Interview → Offer → Rejected
- **Application detail** — Company, role, URL, salary, notes, contacts, interview rounds, excitement level
- **Reminders** — Due-date reminders linked to applications
- **Heatmap** — GitHub-style activity grid showing application consistency
- **Stats** — Total applied, response rate, interview conversion

### Other
- **Auth** — Email/password with verification, forgot/reset password flow; NextAuth sessions
- **Dashboard** — Streak tracker, consistency heatmap (driven by AI coach sessions), quick stats
- **Settings** — Profile management
- **SEO** — `sitemap.ts`, `robots.txt` with AI crawler rules, `llms.txt` for AI indexing
- **Admin panel** — Internal data view at `/admin`

---

## Tech Stack

### Frontend — Next.js 16 (App Router, Webpack)
| Package | Purpose |
|---|---|
| `next` 16.2 | App Router, API routes, SSR |
| `next-auth` 4 | Session management (email/password) |
| `@supabase/supabase-js` | Database client (Supabase Postgres) |
| `framer-motion` | Animations (card swipe, overlays, transitions) |
| `groq-sdk` | Groq LLM client (Llama 3.3 70B) |
| `@google/generative-ai` | Gemini fallback (optional) |
| `ogl` | WebGL shader for VoiceOrb animation |
| `recharts` | Charts (heatmap, stats) |
| `@dnd-kit/core` | Drag-and-drop Kanban |
| `react-hot-toast` | Toast notifications |
| `jspdf` | PDF export for practice Q&A |
| `lucide-react` | Icons |
| `tailwindcss` 4 | Styling |
| `date-fns` | Date formatting |
| `zustand` | Client state |
| `nodemailer` / `resend` | Email sending (verification, password reset) |

### Backend — FastAPI (Python, deployed on Render)
| Package | Purpose |
|---|---|
| `fastapi` | REST API |
| `asyncpg` | Async Postgres driver |
| `pdfplumber` | PDF text extraction |
| `python-docx` | DOCX text extraction |
| `httpx` | Async HTTP (job search APIs, Groq) |
| `pydantic-settings` | Config from env vars |
| `dateutil` | Date parsing for job freshness filter |

### AI / APIs
| Service | Used for |
|---|---|
| **Groq** (Llama 3.3 70B) | Interview coach responses, report generation, resume parsing, job matching |
| **Groq** (Llama 4 Scout vision) | Body language analysis from camera screenshots |
| **Deepgram nova-2** | Speech-to-text (Indian English, `en-IN`) |
| **Deepgram Aura** | Text-to-speech (Athena / Orion voices) |
| **Gemini 2.0 Flash** | Optional fallback for LLM calls |
| **Adzuna API** | Job search (India, 250 req/day free) |
| **Serper.dev** | Google Jobs search (2500 free searches) |
| **JSearch (RapidAPI)** | Job search (500 req/month free) |
| **RemoteOK** | Remote job listings (free) |
| **LinkedIn guest API** | Job listings (HTML scraping) |

### Infrastructure
| Service | Purpose |
|---|---|
| **Vercel** | Frontend hosting (`www.pebelai.com`) |
| **Render** (free tier) | FastAPI backend (`pebelaijob.onrender.com`) |
| **Supabase** | Postgres database + file storage (resumes) |
| **UptimeRobot** | Pings `/health` every 5 min to keep Render awake |

---

## Project Structure

```
app/
  (auth)/                    # Login, signup, forgot/reset password, verify email
  (dashboard)/
    dashboard/               # Main dashboard with heatmap + stats
    applications/            # Application tracker (list + detail)
    careers/                 # Job search + resume management
      resume/                # Resume upload, list, detail
    coach/                   # AI Interview Coach (text + voice + meet)
    reminders/               # Reminders list
    settings/                # Profile settings
  admin/                     # Internal admin panel
  about/                     # About page
  api/
    auth/                    # signup, login, forgot-password, reset-password, extension-token
    applications/            # CRUD + stats + heatmap + streak
    coach/
      start/                 # Create session + generate intro
      message/               # Text chat turn
      voice-message/         # Voice turn (strict interviewer prompt)
      tts/                   # Deepgram TTS proxy
      stt/                   # Deepgram STT proxy (HEAD = availability check)
      report/                # Post-interview performance report
      sessions/              # List + get + delete sessions
      generate-questions/    # Download Q&A PDF
    careers/
      jobs/search/           # Proxy → FastAPI job search
      jobs/save/             # Save job to Supabase
      jobs/apply/            # Smart Apply (Greenhouse/Lever + Assisted)
      resumes/               # List resumes
      resumes/upload/        # Upload + parse resume
      resumes/[id]/          # Get / update / delete resume
    reminders/               # CRUD reminders
    ai/status/               # AI service health check
    admin/data/              # Admin data endpoint

components/
  coach/
    MeetInterview.tsx        # Google Meet-style interview room
    VoiceInterview.tsx       # Orb-based voice interview
    VoiceOrb.tsx             # WebGL animated orb (OGL shaders)
    InterviewReport.tsx      # Post-interview report display
  ui/                        # Shared UI primitives

lib/
  useDeepgramSTT.ts          # MediaRecorder + RMS VAD + Deepgram STT hook
  groq.ts                    # Groq/Gemini unified chatCompletion()
  auth.ts                    # requireAuth() helper
  coach-session-store.ts     # In-memory session fallback
  coachPdf.ts                # PDF export for Q&A
  api.ts                     # authFetch() helper
  supabase.ts                # Supabase client

careers-backend/             # FastAPI backend (deployed on Render)
  app/
    api/
      jobs.py                # Job search + save + saved endpoints
      resumes.py             # Upload, list, get, parse, delete
    services/
      job_search_service.py  # Multi-source job aggregator
      job_matcher_service.py # AI scoring + ranking
      resume_service.py      # Parse + store resume data
      ai_service.py          # Groq/Gemini text generation + ATS scoring
      pdf_parser.py          # pdfplumber + python-docx
      storage_service.py     # Supabase Storage upload/delete
    middleware/auth.py       # Header-based auth (x-pebel-user-id)
    db/connection.py         # asyncpg connection pool
    schemas/resume.py        # Pydantic response models
    config.py                # Pydantic settings from env
    main.py                  # FastAPI app + CORS + /health

types/
  careers.ts                 # TypeScript interfaces
```

---

## Database Schema (Supabase Postgres)

| Table | Purpose |
|---|---|
| `users` | User accounts (id, email, name, password hash) |
| `email_verification_tokens` | Email verification |
| `password_reset_tokens` | Password reset |
| `auto_login_tokens` | Extension token auth |
| `applications` | Job applications (company, role, status, notes, etc.) |
| `reminders` | Due-date reminders linked to applications |
| `coach_sessions` | Interview coach sessions (messages JSON, scores) |
| `resumes` | Resume metadata + parsed data (skills, experience, ATS score) |
| `saved_jobs` | Jobs saved from the job search portal |
| `activity_log` | User activity for heatmap |
| `outreach_emails` | (Legacy) Outreach email records |

---

## Environment Variables

### Frontend (`.env.local` / Vercel)

```env
# Auth
NEXTAUTH_URL=https://www.pebelai.com
NEXTAUTH_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
GROQ_API_KEY=
GEMINI_API_KEY=          # optional — Groq is primary

# Voice
DEEPGRAM_API_KEY=        # required for STT + TTS

# Careers backend
CAREERS_API_URL=https://pebelaijob.onrender.com
CAREERS_INTERNAL_API_KEY=

# Email (password reset / verification)
RESEND_API_KEY=
EMAIL_FROM=
```

### Backend (`careers-backend/.env` / Render)

```env
DATABASE_URL=            # Supabase Postgres connection string (port 6543)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GROQ_API_KEY=
GEMINI_API_KEY=          # optional

ADZUNA_APP_ID=           # optional — job search
ADZUNA_APP_KEY=
SERPER_API_KEY=          # optional — Google Jobs
JSEARCH_API_KEY=         # optional — JSearch via RapidAPI

INTERNAL_API_KEY=        # must match CAREERS_INTERNAL_API_KEY on frontend
ALLOWED_ORIGINS=https://www.pebelai.com
```

---

## Local Development

### Frontend

```bash
npm install
npm run dev        # http://localhost:3000
```

### Backend

```bash
cd careers-backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The backend connects to Supabase directly — no local Postgres needed.

---

## Deployment

### Frontend → Vercel
- Push to `main` branch → auto-deploys
- Set all frontend env vars in Vercel dashboard
- Domain: `www.pebelai.com`

### Backend → Render
- Service: `careers-backend/`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check: `GET /health`
- UptimeRobot pings `/health` every 5 min to prevent cold starts (free tier)
- URL: `https://pebelaijob.onrender.com`

---

## Voice Interview Flow

```
AI finishes speaking (Deepgram TTS audio ends)
  → afterSpeak() fires
  → __pebelStartListening() called
  → deepgramSTT.startRecording(true) opens mic
  → MediaRecorder starts capturing audio
  → RMS voice activity detector monitors energy (requestAnimationFrame, 60Hz)
  → User speaks → RMS > 0.018 → hasStartedSpeaking = true
  → User pauses → RMS < 0.010 for 1.2s → recorder.stop()
  → Web Speech API (parallel) provides live interim text preview
  → Audio blob sent to /api/coach/stt → Deepgram nova-2 (en-IN)
  → Transcript returned → sendToCoach(text)
  → POST /api/coach/voice-message → Groq Llama 3.3 70B (max 150 tokens)
  → AI response text → speak(text) → Deepgram TTS → audio plays
  → Loop repeats
```

---

## Key Design Decisions

- **No Redis / Celery** — Free tier only. All processing is synchronous or inline async.
- **No push-to-talk** — Deepgram `MediaRecorder` works on all devices (desktop + mobile) with auto-silence detection. Push-to-talk was removed entirely.
- **Groq as primary LLM** — Fast (sub-second), free tier generous. Gemini is optional fallback.
- **Deepgram for STT** — Web Speech API is inaccurate for Indian English and technical terms. Deepgram nova-2 with `en-IN` language model is dramatically better.
- **Seen-jobs in localStorage** — No server-side job deduplication needed. Client sends seen IDs on each search; backend excludes them.
- **ATS score computed at upload** — Resume is scored once on upload, stored in DB, shown as a badge in the job search UI.
- **Report fallback** — If Groq JSON parsing fails, a valid fallback report is returned so the user always sees a result.
- **India-only job filter** — Whitelist of Indian cities + remote. Excludes Pakistan, Bangladesh, Sri Lanka, Nepal, and all other foreign locations.
