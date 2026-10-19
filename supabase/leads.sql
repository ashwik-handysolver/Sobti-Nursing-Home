-- Leads (patients) for MeetMind.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

create table if not exists public.leads (
  id              text primary key,                                    -- the app's own lead id
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name            text not null,
  phone           text,
  email           text,
  stage           text,
  procedure_name  text,
  data            jsonb not null default '{}'::jsonb,                  -- the full lead record as the app uses it
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists leads_user_id_idx on public.leads (user_id);

-- Keep updated_at current
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

-- Row-level security: each signed-in user can only see and change the leads they created
alter table public.leads enable row level security;

drop policy if exists "Users read their own leads" on public.leads;
create policy "Users read their own leads" on public.leads
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "Users add their own leads" on public.leads;
create policy "Users add their own leads" on public.leads
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Users update their own leads" on public.leads;
create policy "Users update their own leads" on public.leads
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users delete their own leads" on public.leads;
create policy "Users delete their own leads" on public.leads
  for delete to authenticated using (user_id = auth.uid());
