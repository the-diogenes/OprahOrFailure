-- Shotgun Oprah Finder — Supabase schema
-- Run this in the Supabase SQL Editor

-- ────────────────────────────────────────────────────────
-- Races
-- ────────────────────────────────────────────────────────
create table if not exists public.races (
  id                text primary key,
  seed_label        text not null,
  start_page_title  text not null,
  target_page_title text not null default 'Oprah Winfrey',
  max_clicks        integer not null default 8,
  mode              text not null default 'wait',
  host_prompt       text,
  status            text not null default 'running',
  created_at        timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────
-- Racer runs (one row per competitor per race)
-- ────────────────────────────────────────────────────────
create table if not exists public.racer_runs (
  id                   text primary key,
  race_id              text not null references public.races(id) on delete cascade,
  competitor_name      text not null,
  provider             text not null,
  model_id             text not null,
  status               text not null default 'pending',
  clicks               integer not null default 0,
  elapsed_ms           integer not null default 0,
  invalid_attempts     integer not null default 0,
  total_input_tokens   integer not null default 0,
  total_output_tokens  integer not null default 0,
  total_cost_usd       numeric(12, 8) not null default 0,
  created_at           timestamptz not null default now()
);

create index if not exists racer_runs_race_id_idx on public.racer_runs(race_id);

-- ────────────────────────────────────────────────────────
-- Turns (one row per click/attempt per racer)
-- ────────────────────────────────────────────────────────
create table if not exists public.turns (
  id                   text primary key,
  racer_run_id         text not null references public.racer_runs(id) on delete cascade,
  turn_index           integer not null,
  current_page_title   text not null,
  chosen_link          text,
  resulting_page_title text,
  public_scratchpad    text,
  confidence           numeric(5, 4) default 0,
  latency_ms           integer default 0,
  validation_status    text default 'ok',
  input_tokens         integer not null default 0,
  output_tokens        integer not null default 0,
  cost_usd             numeric(12, 8) not null default 0,
  created_at           timestamptz not null default now()
);

create index if not exists turns_racer_run_id_idx on public.turns(racer_run_id);

-- ────────────────────────────────────────────────────────
-- Wikipedia page cache (shared across all races)
-- ────────────────────────────────────────────────────────
create table if not exists public.wiki_page_cache (
  canonical_title  text primary key,
  page_id          integer,
  summary          text,
  links_json       jsonb,
  url              text,
  fetched_at       timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────
-- Row-Level Security (public read, no auth required for MVP)
-- ────────────────────────────────────────────────────────
alter table public.races enable row level security;
alter table public.racer_runs enable row level security;
alter table public.turns enable row level security;
alter table public.wiki_page_cache enable row level security;

-- Allow anyone to read and insert race data (anon key is sufficient for MVP)
create policy "Public read races"   on public.races           for select using (true);
create policy "Public insert races" on public.races           for insert with check (true);
create policy "Public upsert races" on public.races           for update using (true);

create policy "Public read racer_runs"   on public.racer_runs for select using (true);
create policy "Public insert racer_runs" on public.racer_runs for insert with check (true);
create policy "Public upsert racer_runs" on public.racer_runs for update using (true);

create policy "Public read turns"   on public.turns           for select using (true);
create policy "Public insert turns" on public.turns           for insert with check (true);
create policy "Public upsert turns" on public.turns           for update using (true);

create policy "Public read wiki_cache"   on public.wiki_page_cache for select using (true);
create policy "Public insert wiki_cache" on public.wiki_page_cache for insert with check (true);
create policy "Public upsert wiki_cache" on public.wiki_page_cache for update using (true);
