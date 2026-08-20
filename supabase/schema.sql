-- RIACT database schema
-- Run this once in the Supabase SQL Editor on a new project.
--
-- This mirrors the production database column-for-column: types, defaults and
-- nullability all match. User profile fields (name, timezone) live in
-- auth.users.user_metadata, so there is no profiles table.

-- ---------------------------------------------------------------- locations
create table if not exists public.locations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete cascade,
  name       text not null,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------- sessions
create table if not exists public.sessions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users (id) on delete cascade,
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
  user_id       uuid references auth.users (id) on delete cascade,
  location_name text,                    -- null = goal applies to all locations
  target_hours  numeric not null,
  timeframe     text,                    -- 'daily' | 'weekly'
  is_active     boolean default true,
  created_at    timestamptz default now()
);

-- ----------------------------------------------------------------- schedule
create table if not exists public.schedule (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete cascade,
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

-- Tables owned directly by a user. The with-check clause also makes the
-- nullable user_id above safe: auth.uid() = null never evaluates true, so a
-- row without an owner cannot be inserted.
create policy "own locations" on public.locations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own sessions" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own goals" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own schedule" on public.schedule
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Child tables inherit ownership through their parent row.
create policy "own breaks" on public.breaks
  for all using (
    exists (select 1 from public.sessions s
             where s.id = breaks.session_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.sessions s
             where s.id = breaks.session_id and s.user_id = auth.uid())
  );

create policy "own schedule exceptions" on public.schedule_exceptions
  for all using (
    exists (select 1 from public.schedule c
             where c.id = schedule_exceptions.schedule_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.schedule c
             where c.id = schedule_exceptions.schedule_id and c.user_id = auth.uid())
  );

-- ---------------------------------------------------------------- indexes
-- Performance only — the app is correct without these.
create index if not exists sessions_user_start_idx
  on public.sessions (user_id, start_time desc);

create index if not exists breaks_session_idx
  on public.breaks (session_id);
