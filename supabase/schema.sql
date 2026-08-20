-- RIACT database schema
-- Run this once in the Supabase SQL Editor on a new project.
--
-- This mirrors the production database: columns, types, defaults, nullability,
-- foreign keys and row-level security policies all match. User profile fields
-- (name, timezone) live in auth.users.user_metadata, so there is no profiles
-- table.

-- ---------------------------------------------------------------- locations
create table if not exists public.locations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid,
  name       text not null,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------- sessions
create table if not exists public.sessions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid,
  location_id        uuid references public.locations (id) on delete set null,
  location_name      text,
  start_time         timestamptz not null,
  end_time           timestamptz,        -- null while the session is active
  projected_end_time timestamptz,
  -- Default 0, never null: sessionNetMinutes() in src/lib/burnout.ts treats a
  -- null here as "not yet computed" and falls back to deriving from timestamps.
  net_study_minutes  integer default 0,
  total_minutes      integer default 0,
  created_at         timestamptz default now()
);

-- ------------------------------------------------------------------- breaks
create table if not exists public.breaks (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid references public.sessions (id) on delete cascade,
  start_time       timestamptz not null,
  end_time         timestamptz,          -- null while the break is running
  -- Same contract as above, for calculateBreakMinutes() in src/lib/utils.ts.
  duration_minutes integer default 0
);

-- -------------------------------------------------------------------- goals
create table if not exists public.goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid,
  location_name text,                    -- null = goal applies to all locations
  target_hours  numeric not null,
  timeframe     text,                    -- 'daily' | 'weekly'
  is_active     boolean default true,
  created_at    timestamptz default now()
);

-- ----------------------------------------------------------------- schedule
create table if not exists public.schedule (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,
  course_name text not null,
  day_of_week text not null,             -- 'Monday' … 'Sunday'
  start_time  time not null,
  end_time    time not null,
  location    text,
  created_at  timestamptz default now(),
  valid_from  date,                      -- null = no start bound
  valid_until date                       -- null = no end bound
);

-- One row per skipped occurrence of a recurring class.
create table if not exists public.schedule_exceptions (
  id             uuid primary key default gen_random_uuid(),
  schedule_id    uuid references public.schedule (id) on delete cascade,
  exception_date date not null,
  created_at     timestamptz default now()
);

-- ------------------------------------------------------- row-level security
alter table public.locations           enable row level security;
alter table public.sessions            enable row level security;
alter table public.breaks              enable row level security;
alter table public.goals               enable row level security;
alter table public.schedule            enable row level security;
alter table public.schedule_exceptions enable row level security;

-- Each policy omits WITH CHECK, so Postgres reuses the USING expression to
-- validate inserts and updates as well. That is also what keeps the nullable
-- user_id columns safe: auth.uid() = null evaluates to null rather than true,
-- so a row with no owner cannot be written.
create policy "Users can manage their own locations" on public.locations
  for all using (auth.uid() = user_id);

create policy "Users can manage their own sessions" on public.sessions
  for all using (auth.uid() = user_id);

create policy "Users can manage their own goals" on public.goals
  for all using (auth.uid() = user_id);

create policy "Users can manage own schedule" on public.schedule
  for all using (auth.uid() = user_id);

-- Child tables inherit ownership through their parent row. A missing parent
-- makes the subquery null, so the comparison is null and access is denied.
create policy "Users can manage their own breaks" on public.breaks
  for all using (
    auth.uid() = (
      select sessions.user_id from public.sessions
       where sessions.id = breaks.session_id
    )
  );

create policy "Users can manage own exceptions" on public.schedule_exceptions
  for all using (
    auth.uid() = (
      select schedule.user_id from public.schedule
       where schedule.id = schedule_exceptions.schedule_id
    )
  );

-- ---------------------------------------------------------------- indexes
-- Not present in the production database — added here for query performance
-- only. Safe to drop; the app is correct without them.
create index if not exists sessions_user_start_idx
  on public.sessions (user_id, start_time desc);

create index if not exists breaks_session_idx
  on public.breaks (session_id);
