// Supabase edge function: sends each clinic user a push notification with what needs attention today.
//
//   - Called every morning by pg_cron (see supabase/push.sql) with  Authorization: Bearer <CRON_SECRET>
//     -> one notification per user who has something due.
//   - Called by the app's "Send test notification" button with the signed-in user's token and
//     { "test": true } -> a notification for that user only, even when nothing is due.
//
// Deploy:   supabase functions deploy clever-action --no-verify-jwt
// Secrets:  supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@clinic.com CRON_SECRET=...
// (SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.)
// It checks the caller itself, which is why JWT verification is turned off at the gateway.

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const STALE_AFTER_DAYS = 7;
const OPEN_STAGES = new Set(['New Lead', 'Contacted', 'Consultation Booked', 'Consultation Completed']);

const env = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing secret ${name}`);
  return value;
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info' },
  });

// Today in India, as YYYY-MM-DD (the clinic's working day, whatever the server's time zone)
const todayIST = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);

const daysBetween = (from: string, to: string) =>
  Math.round((new Date(`${to}T00:00Z`).getTime() - new Date(`${from.slice(0, 10)}T00:00Z`).getTime()) / 86_400_000);

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

interface Digest {
  title: string;
  body: string;
  url: string;
  hasNews: boolean;
}

// What one user should hear about today: follow-ups due or overdue, and open leads going cold
async function buildDigest(admin: ReturnType<typeof createClient>, userId: string, today: string): Promise<Digest> {
  const [{ data: followUps }, { data: leads }] = await Promise.all([
    admin
      .from('follow_ups')
      .select('description, due_date, status')
      .eq('user_id', userId)
      .neq('status', 'Completed')
      .lte('due_date', today),
    admin.from('leads').select('name, stage, data').eq('user_id', userId),
  ]);

  const due = (followUps || []) as { description: string; due_date: string }[];
  const overdue = due.filter((f) => f.due_date < today).length;
  const dueToday = due.length - overdue;

  const stale = ((leads || []) as { name: string; stage: string | null; data: Record<string, any> }[]).filter((lead) => {
    const stage = lead.stage || lead.data?.stage;
    if (!OPEN_STAGES.has(stage) || lead.data?.flag === 'On Hold') return false;
    const last = [lead.data?.lastVisitDate, lead.data?.createdDate].filter(Boolean).sort().pop();
    return last ? daysBetween(last, today) >= STALE_AFTER_DAYS : false;
  });

  const parts: string[] = [];
  if (dueToday) parts.push(`${plural(dueToday, 'follow-up')} due today`);
  if (overdue) parts.push(`${overdue} overdue`);
  if (stale.length) {
    const names = stale.slice(0, 2).map((l) => l.name).join(', ');
    parts.push(`${plural(stale.length, 'lead')} not contacted in ${STALE_AFTER_DAYS}+ days (${names}${stale.length > 2 ? '…' : ''})`);
  }

  if (parts.length === 0) {
    return { title: 'All caught up', body: 'No follow-ups are due and no leads are going cold.', url: '/', hasNews: false };
  }
  return {
    title: due.length ? 'Follow-ups need attention' : 'Leads going cold',
    body: `${parts.join(' · ')}.`,
    // The app opens on the right page from ?page=
    url: due.length ? '/?page=follow-ups' : '/?page=dashboard',
    hasNews: true,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json(200, {});

  try {
    const supabaseUrl = env('SUPABASE_URL');
    const admin = createClient(supabaseUrl, env('SUPABASE_SERVICE_ROLE_KEY'));
    webpush.setVapidDetails(env('VAPID_SUBJECT'), env('VAPID_PUBLIC_KEY'), env('VAPID_PRIVATE_KEY'));

    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const body = await req.json().catch(() => ({}));
    const isCron = token && token === Deno.env.get('CRON_SECRET');

    // Work out whose devices to notify
    let userIds: string[];
    let force = false;
    if (isCron) {
      const { data } = await admin.from('push_subscriptions').select('user_id');
      userIds = [...new Set((data || []).map((row: { user_id: string }) => row.user_id))];
    } else {
      const asUser = createClient(supabaseUrl, env('SUPABASE_ANON_KEY'), {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data, error } = await asUser.auth.getUser();
      if (error || !data.user) return json(401, { error: 'Not signed in.' });
      userIds = [data.user.id];
      force = Boolean(body?.test);
    }

    const today = todayIST();
    let sent = 0;
    for (const userId of userIds) {
      const digest = await buildDigest(admin, userId, today);
      if (!digest.hasNews && !force) continue;

      const { data: subscriptions } = await admin
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', userId);

      for (const sub of subscriptions || []) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title: digest.title, body: digest.body, url: digest.url, tag: 'daily-digest' })
          );
          sent += 1;
        } catch (err: any) {
          // The browser unsubscribed or the address expired: forget this device
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await admin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          } else {
            console.error('Push failed', err?.statusCode, err?.body || err?.message);
          }
        }
      }
    }

    return json(200, { sent, users: userIds.length });
  } catch (err: any) {
    console.error(err);
    return json(500, { error: err?.message || 'Reminder function failed.' });
  }
});
