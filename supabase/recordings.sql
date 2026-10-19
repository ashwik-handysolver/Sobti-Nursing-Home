-- Recordings, follow-ups and recording audio for MeetMind.
-- Run once in the Supabase dashboard (SQL Editor -> New query -> paste -> Run), after leads.sql.

-- ---------------------------------------------------------------------------
-- Recordings: one row per analyzed consultation
-- ---------------------------------------------------------------------------
create table if not exists public.recordings (
  id           text primary key,                                    -- the app's own recording id
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lead_id      text,                                                -- the patient (leads.id) it belongs to
  title        text not null,
  upload_date  text,                                                -- 'YYYY-MM-DD HH:mm' in clinic local time
  audio_path   text,                                                -- object in the recording-audio bucket
  data         jsonb not null default '{}'::jsonb,                  -- transcript, summary, pitch review, etc.
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists recordings_user_id_idx on public.recordings (user_id);
create index if not exists recordings_lead_id_idx on public.recordings (lead_id);

-- ---------------------------------------------------------------------------
-- Follow-ups: one row per task taken from a recording (or added by hand)
-- ---------------------------------------------------------------------------
create table if not exists public.follow_ups (
  id            text primary key,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  recording_id  text not null references public.recordings (id) on delete cascade,
  lead_id       text,
  description   text not null,
  status        text not null default 'Pending',
  priority      text,
  due_date      date,                                               -- resolved calendar date, when known
  position      integer not null default 0,                         -- order within the recording
  data          jsonb not null default '{}'::jsonb,                 -- the full follow-up as the app uses it
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists follow_ups_user_id_idx on public.follow_ups (user_id);
create index if not exists follow_ups_recording_id_idx on public.follow_ups (recording_id);
create index if not exists follow_ups_due_date_idx on public.follow_ups (due_date);

-- updated_at trigger (the function is created by leads.sql; recreated here so this file runs on its own)
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists recordings_set_updated_at on public.recordings;
create trigger recordings_set_updated_at before update on public.recordings
  for each row execute function public.set_updated_at();

drop trigger if exists follow_ups_set_updated_at on public.follow_ups;
create trigger follow_ups_set_updated_at before update on public.follow_ups
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-level security: each signed-in user sees and changes only their own rows
-- ---------------------------------------------------------------------------
alter table public.recordings enable row level security;
alter table public.follow_ups enable row level security;

drop policy if exists "Users manage their own recordings" on public.recordings;
create policy "Users manage their own recordings" on public.recordings
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users manage their own follow-ups" on public.follow_ups;
create policy "Users manage their own follow-ups" on public.follow_ups
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Audio storage: a private bucket; files live under a folder named after the user's id
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('recording-audio', 'recording-audio', false, 47185920)   -- 45 MB, same limit as the upload screen
on conflict (id) do nothing;

drop policy if exists "Users read their own audio" on storage.objects;
create policy "Users read their own audio" on storage.objects
  for select to authenticated
  using (bucket_id = 'recording-audio' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users upload their own audio" on storage.objects;
create policy "Users upload their own audio" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'recording-audio' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users replace their own audio" on storage.objects;
create policy "Users replace their own audio" on storage.objects
  for update to authenticated
  using (bucket_id = 'recording-audio' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete their own audio" on storage.objects;
create policy "Users delete their own audio" on storage.objects
  for delete to authenticated
  using (bucket_id = 'recording-audio' and (storage.foldername(name))[1] = auth.uid()::text);
