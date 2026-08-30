-- LBHT FIE LE-3I-E2
-- Provider-neutral canonical NFL game identity + live schedule knowledge.
-- This table belongs to the shared Sports Knowledge / Research Repository database.
-- It must not contain provider-specific IDs as the canonical primary key.

create table if not exists public.nfl_canonical_games (
  game_id bigint primary key,
  season integer not null check (season >= 2000),
  week integer not null check (week between 1 and 22),
  game_type text not null default 'REG',
  away_team text not null check (away_team ~ '^[A-Z]{2,3}$'),
  home_team text not null check (home_team ~ '^[A-Z]{2,3}$'),
  kickoff timestamptz not null,
  status text not null default 'SCHEDULED',
  source_authority text not null default 'LBHT_CANONICAL_SCHEDULE',
  external_refs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nfl_canonical_games_distinct_teams check (away_team <> home_team),
  constraint nfl_canonical_games_football_identity_unique
    unique (season, week, game_type, away_team, home_team)
);

create index if not exists nfl_canonical_games_scope_idx
  on public.nfl_canonical_games (season, week, game_type, kickoff);

create index if not exists nfl_canonical_games_away_team_idx
  on public.nfl_canonical_games (season, week, away_team);

create index if not exists nfl_canonical_games_home_team_idx
  on public.nfl_canonical_games (season, week, home_team);

create or replace function public.set_nfl_canonical_games_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_nfl_canonical_games_updated_at
  on public.nfl_canonical_games;

create trigger set_nfl_canonical_games_updated_at
before update on public.nfl_canonical_games
for each row
execute function public.set_nfl_canonical_games_updated_at();

alter table public.nfl_canonical_games enable row level security;

-- No anonymous/user-facing policies are created here.
-- Canonical FIE server-side access remains governed through the PostgreSQL
-- research repository connection.
