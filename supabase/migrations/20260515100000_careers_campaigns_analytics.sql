-- Careers Module: Campaigns, Analytics, and Outreach Emails
-- This migration adds campaign management, email tracking, and analytics tables

begin;

-- ============================================================================
-- 1. Create campaigns table
-- ============================================================================
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text,
  target_role text,
  target_location text,
  target_companies jsonb default '[]'::jsonb,
  status text not null default 'active',
  daily_limit integer not null default 5,
  emails_sent_today integer not null default 0,
  total_emails_sent integer not null default 0,
  total_opened integer not null default 0,
  total_replied integer not null default 0,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaigns_user_id_idx on public.campaigns(user_id);
create index if not exists campaigns_status_idx on public.campaigns(status);

-- ============================================================================
-- 2. Create outreach_emails table (tracks individual emails sent)
-- ============================================================================
create table if not exists public.outreach_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  recruiter_id uuid references public.career_recruiters(id) on delete set null,
  resume_id uuid references public.career_resumes(id) on delete set null,
  subject text not null,
  body text not null,
  email_type text not null default 'cold_email',
  status text not null default 'draft',
  sent_at timestamptz,
  opened_at timestamptz,
  replied_at timestamptz,
  bounced_at timestamptz,
  follow_up_scheduled_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists outreach_emails_user_id_idx on public.outreach_emails(user_id);
create index if not exists outreach_emails_campaign_id_idx on public.outreach_emails(campaign_id);
create index if not exists outreach_emails_recruiter_id_idx on public.outreach_emails(recruiter_id);
create index if not exists outreach_emails_status_idx on public.outreach_emails(status);

-- ============================================================================
-- 3. Create email_templates table
-- ============================================================================
create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  subject text not null,
  body text not null,
  variables jsonb default '[]'::jsonb,
  is_default boolean not null default false,
  template_type text not null default 'cold_email',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_templates_user_id_idx on public.email_templates(user_id);

-- ============================================================================
-- 4. Create careers_settings table
-- ============================================================================
create table if not exists public.careers_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  daily_email_limit integer not null default 5,
  auto_follow_up_enabled boolean not null default false,
  follow_up_delay_days integer not null default 3,
  preferred_email_time text,
  timezone text default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 5. Create analytics_events table
-- ============================================================================
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event_type text not null,
  event_data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_user_id_idx on public.analytics_events(user_id);
create index if not exists analytics_events_type_idx on public.analytics_events(event_type);
create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at);

-- ============================================================================
-- 6. Create follow_ups table
-- ============================================================================
create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  outreach_email_id uuid references public.outreach_emails(id) on delete cascade,
  follow_up_number integer not null default 1,
  subject text,
  body text,
  status text not null default 'scheduled',
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists follow_ups_user_id_idx on public.follow_ups(user_id);
create index if not exists follow_ups_status_idx on public.follow_ups(status);
create index if not exists follow_ups_scheduled_at_idx on public.follow_ups(scheduled_at);

-- ============================================================================
-- 7. Add is_active column to career_resumes if not exists
-- ============================================================================
alter table public.career_resumes
  add column if not exists is_active boolean not null default true;

-- ============================================================================
-- 8. Add additional columns to career_recruiters
-- ============================================================================
alter table public.career_recruiters
  add column if not exists location text,
  add column if not exists profile_image_url text,
  add column if not exists about text,
  add column if not exists is_verified boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

-- ============================================================================
-- 9. Enable RLS on new tables
-- ============================================================================
alter table public.campaigns enable row level security;
alter table public.outreach_emails enable row level security;
alter table public.email_templates enable row level security;
alter table public.careers_settings enable row level security;
alter table public.analytics_events enable row level security;
alter table public.follow_ups enable row level security;

-- ============================================================================
-- 10. RLS Policies - Campaigns
-- ============================================================================
create policy "Users can view their own campaigns"
  on public.campaigns for select
  using (auth.uid() = user_id);

create policy "Users can insert their own campaigns"
  on public.campaigns for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own campaigns"
  on public.campaigns for update
  using (auth.uid() = user_id);

create policy "Users can delete their own campaigns"
  on public.campaigns for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- 11. RLS Policies - Outreach Emails
-- ============================================================================
create policy "Users can view their own outreach emails"
  on public.outreach_emails for select
  using (auth.uid() = user_id);

create policy "Users can insert their own outreach emails"
  on public.outreach_emails for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own outreach emails"
  on public.outreach_emails for update
  using (auth.uid() = user_id);

create policy "Users can delete their own outreach emails"
  on public.outreach_emails for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- 12. RLS Policies - Email Templates
-- ============================================================================
create policy "Users can view their own email templates"
  on public.email_templates for select
  using (auth.uid() = user_id);

create policy "Users can insert their own email templates"
  on public.email_templates for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own email templates"
  on public.email_templates for update
  using (auth.uid() = user_id);

create policy "Users can delete their own email templates"
  on public.email_templates for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- 13. RLS Policies - Careers Settings
-- ============================================================================
create policy "Users can view their own careers settings"
  on public.careers_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own careers settings"
  on public.careers_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own careers settings"
  on public.careers_settings for update
  using (auth.uid() = user_id);

-- ============================================================================
-- 14. RLS Policies - Analytics Events
-- ============================================================================
create policy "Users can view their own analytics events"
  on public.analytics_events for select
  using (auth.uid() = user_id);

create policy "Users can insert their own analytics events"
  on public.analytics_events for insert
  with check (auth.uid() = user_id);

-- ============================================================================
-- 15. RLS Policies - Follow Ups
-- ============================================================================
create policy "Users can view their own follow ups"
  on public.follow_ups for select
  using (auth.uid() = user_id);

create policy "Users can insert their own follow ups"
  on public.follow_ups for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own follow ups"
  on public.follow_ups for update
  using (auth.uid() = user_id);

create policy "Users can delete their own follow ups"
  on public.follow_ups for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- 16. Service role bypass policies (for backend API)
-- ============================================================================
create policy "Service role can manage all campaigns"
  on public.campaigns for all
  using (auth.role() = 'service_role');

create policy "Service role can manage all outreach emails"
  on public.outreach_emails for all
  using (auth.role() = 'service_role');

create policy "Service role can manage all email templates"
  on public.email_templates for all
  using (auth.role() = 'service_role');

create policy "Service role can manage all careers settings"
  on public.careers_settings for all
  using (auth.role() = 'service_role');

create policy "Service role can manage all analytics events"
  on public.analytics_events for all
  using (auth.role() = 'service_role');

create policy "Service role can manage all follow ups"
  on public.follow_ups for all
  using (auth.role() = 'service_role');

commit;
