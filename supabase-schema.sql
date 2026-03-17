-- MyCMO Database Schema
-- Run this in your Supabase SQL editor: https://app.supabase.com → SQL Editor

-- ─────────────────────────────────────────────
-- Sites: each website the user is tracking
-- ─────────────────────────────────────────────
create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  title text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- Runs: each time all agents are fired for a site
-- ─────────────────────────────────────────────
create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references sites(id) on delete cascade,
  triggered_by text default 'manual', -- 'manual' | 'cron'
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- Agent results: output from each agent per run
-- ─────────────────────────────────────────────
create table if not exists agent_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id) on delete cascade,
  agent_id text not null,
  result text,
  summary text,
  status text default 'done', -- 'done' | 'error'
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- PageSpeed: scores per run
-- ─────────────────────────────────────────────
create table if not exists pagespeed_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id) on delete cascade,
  performance int,
  accessibility int,
  best_practices int,
  seo int,
  lcp text,
  tbt text,
  cls text,
  fcp text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- Documents: Brand Voice, Product Info, etc.
-- ─────────────────────────────────────────────
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references sites(id) on delete cascade,
  type text not null, -- 'brand_voice' | 'product_info' | 'competitor_analysis'
  content text,
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- Competitors: tracked competitor URLs per site
-- ─────────────────────────────────────────────
create table if not exists competitors (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references sites(id) on delete cascade,
  url text not null,
  name text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- Indexes for fast lookups
-- ─────────────────────────────────────────────
create index if not exists idx_runs_site_id on runs(site_id);
create index if not exists idx_agent_results_run_id on agent_results(run_id);
create index if not exists idx_documents_site_id on documents(site_id);
create index if not exists idx_competitors_site_id on competitors(site_id);

-- ─────────────────────────────────────────────
-- RLS: disable for private personal use
-- (enable and add policies if you ever share access)
-- ─────────────────────────────────────────────
alter table sites disable row level security;
alter table runs disable row level security;
alter table agent_results disable row level security;
alter table pagespeed_results disable row level security;
alter table documents disable row level security;
alter table competitors disable row level security;
