-- LBHT Research Repository storage foundation.
-- RLS policies are intentionally deferred until an authenticated administrative
-- access model is approved. This migration grants no anonymous public access.

create or replace function public.set_research_repository_updated_at()
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

create table if not exists public.research_sources (
  source_id text primary key,
  contract_name text not null,
  contract_version text not null,
  schema_version text not null,
  payload jsonb not null,
  record_version bigint not null default 1 check (record_version > 0),
  is_archived boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.research_sessions (
  session_id text primary key,
  contract_name text not null,
  contract_version text not null,
  schema_version text not null,
  payload jsonb not null,
  record_version bigint not null default 1 check (record_version > 0),
  is_archived boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recorded_observations (
  observation_id text primary key,
  contract_name text not null,
  contract_version text not null,
  schema_version text not null,
  payload jsonb not null,
  record_version bigint not null default 1 check (record_version > 0),
  is_archived boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytical_observations (
  analysis_id text primary key,
  contract_name text not null,
  contract_version text not null,
  schema_version text not null,
  payload jsonb not null,
  record_version bigint not null default 1 check (record_version > 0),
  is_archived boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.evidence_artifacts (
  evidence_id text primary key,
  contract_name text not null,
  contract_version text not null,
  schema_version text not null,
  payload jsonb not null,
  record_version bigint not null default 1 check (record_version > 0),
  is_archived boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.research_sources enable row level security;
alter table public.research_sessions enable row level security;
alter table public.recorded_observations enable row level security;
alter table public.analytical_observations enable row level security;
alter table public.evidence_artifacts enable row level security;

create index if not exists research_sources_payload_gin_idx on public.research_sources using gin (payload);
create index if not exists research_sessions_payload_gin_idx on public.research_sessions using gin (payload);
create index if not exists recorded_observations_payload_gin_idx on public.recorded_observations using gin (payload);
create index if not exists analytical_observations_payload_gin_idx on public.analytical_observations using gin (payload);
create index if not exists evidence_artifacts_payload_gin_idx on public.evidence_artifacts using gin (payload);

create index if not exists research_sources_contract_name_idx on public.research_sources (contract_name);
create index if not exists research_sources_contract_version_idx on public.research_sources (contract_version);
create index if not exists research_sources_schema_version_idx on public.research_sources (schema_version);
create index if not exists research_sources_is_archived_idx on public.research_sources (is_archived);
create index if not exists research_sources_is_deleted_idx on public.research_sources (is_deleted);
create index if not exists research_sources_created_at_idx on public.research_sources (created_at);
create index if not exists research_sources_updated_at_idx on public.research_sources (updated_at);

create index if not exists research_sessions_contract_name_idx on public.research_sessions (contract_name);
create index if not exists research_sessions_contract_version_idx on public.research_sessions (contract_version);
create index if not exists research_sessions_schema_version_idx on public.research_sessions (schema_version);
create index if not exists research_sessions_is_archived_idx on public.research_sessions (is_archived);
create index if not exists research_sessions_is_deleted_idx on public.research_sessions (is_deleted);
create index if not exists research_sessions_created_at_idx on public.research_sessions (created_at);
create index if not exists research_sessions_updated_at_idx on public.research_sessions (updated_at);

create index if not exists recorded_observations_contract_name_idx on public.recorded_observations (contract_name);
create index if not exists recorded_observations_contract_version_idx on public.recorded_observations (contract_version);
create index if not exists recorded_observations_schema_version_idx on public.recorded_observations (schema_version);
create index if not exists recorded_observations_is_archived_idx on public.recorded_observations (is_archived);
create index if not exists recorded_observations_is_deleted_idx on public.recorded_observations (is_deleted);
create index if not exists recorded_observations_created_at_idx on public.recorded_observations (created_at);
create index if not exists recorded_observations_updated_at_idx on public.recorded_observations (updated_at);

create index if not exists analytical_observations_contract_name_idx on public.analytical_observations (contract_name);
create index if not exists analytical_observations_contract_version_idx on public.analytical_observations (contract_version);
create index if not exists analytical_observations_schema_version_idx on public.analytical_observations (schema_version);
create index if not exists analytical_observations_is_archived_idx on public.analytical_observations (is_archived);
create index if not exists analytical_observations_is_deleted_idx on public.analytical_observations (is_deleted);
create index if not exists analytical_observations_created_at_idx on public.analytical_observations (created_at);
create index if not exists analytical_observations_updated_at_idx on public.analytical_observations (updated_at);

create index if not exists evidence_artifacts_contract_name_idx on public.evidence_artifacts (contract_name);
create index if not exists evidence_artifacts_contract_version_idx on public.evidence_artifacts (contract_version);
create index if not exists evidence_artifacts_schema_version_idx on public.evidence_artifacts (schema_version);
create index if not exists evidence_artifacts_is_archived_idx on public.evidence_artifacts (is_archived);
create index if not exists evidence_artifacts_is_deleted_idx on public.evidence_artifacts (is_deleted);
create index if not exists evidence_artifacts_created_at_idx on public.evidence_artifacts (created_at);
create index if not exists evidence_artifacts_updated_at_idx on public.evidence_artifacts (updated_at);

drop trigger if exists set_research_sources_updated_at on public.research_sources;
create trigger set_research_sources_updated_at before update on public.research_sources
for each row execute function public.set_research_repository_updated_at();

drop trigger if exists set_research_sessions_updated_at on public.research_sessions;
create trigger set_research_sessions_updated_at before update on public.research_sessions
for each row execute function public.set_research_repository_updated_at();

drop trigger if exists set_recorded_observations_updated_at on public.recorded_observations;
create trigger set_recorded_observations_updated_at before update on public.recorded_observations
for each row execute function public.set_research_repository_updated_at();

drop trigger if exists set_analytical_observations_updated_at on public.analytical_observations;
create trigger set_analytical_observations_updated_at before update on public.analytical_observations
for each row execute function public.set_research_repository_updated_at();

drop trigger if exists set_evidence_artifacts_updated_at on public.evidence_artifacts;
create trigger set_evidence_artifacts_updated_at before update on public.evidence_artifacts
for each row execute function public.set_research_repository_updated_at();
