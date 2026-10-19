-- Push notifications for follow-ups.
-- Part 1: run in the SQL Editor straight away.

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint    text not null unique,         -- the browser's push address
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users manage their own push subscriptions" on public.push_subscriptions;
create policy "Users manage their own push subscriptions" on public.push_subscriptions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());


-- Part 2: the daily reminder, at 9:00 AM India time (03:30 UTC).
-- Before running it:
--   1. Deploy the edge function (see supabase/functions/clever-action/index.ts for the commands and secrets).
--   2. Enable the pg_cron and pg_net extensions (Database -> Extensions).
--   3. Replace YOUR-PROJECT-REF with your project's ref (the part before .supabase.co)
--      and YOUR_CRON_SECRET with CRON_SECRET from supabase/functions/.env.
--
-- select cron.schedule(
--   'follow-up-reminders',
--   '30 3 * * *',
--   $$
--   select net.http_post(
--     url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/clever-action',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer YOUR_CRON_SECRET'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
--
-- To stop it later:  select cron.unschedule('follow-up-reminders');
