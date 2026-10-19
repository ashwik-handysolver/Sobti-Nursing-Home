import { supabase } from '../lib/supabase';

// Browser push notifications for follow-up reminders (see supabase/push.sql and the
// follow-up-reminders edge function)

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export type PushStatus = 'unsupported' | 'denied' | 'on' | 'off';

export const pushSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window &&
  Boolean(VAPID_PUBLIC_KEY);

const urlBase64ToUint8Array = (base64: string) => {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

const db = () => {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
};

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration('/sw.js');
  return registration ? registration.pushManager.getSubscription() : null;
}

export async function getPushStatus(): Promise<PushStatus> {
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  return (await currentSubscription()) ? 'on' : 'off';
}

export async function enablePush(): Promise<void> {
  if (!pushSupported()) throw new Error('This browser does not support notifications.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notifications are blocked. Allow them in the browser settings.');

  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
    }));

  const keys = subscription.toJSON().keys || {};
  const { error } = await db()
    .from('push_subscriptions')
    .upsert(
      { endpoint: subscription.endpoint, p256dh: keys.p256dh, auth: keys.auth, user_agent: navigator.userAgent },
      { onConflict: 'endpoint' }
    );
  if (error) throw new Error(`Could not save this device: ${error.message}`);
}

export async function disablePush(): Promise<void> {
  const subscription = await currentSubscription();
  if (!subscription) return;
  await db().from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
  await subscription.unsubscribe();
}

// Asks the edge function to send this user's reminder now
export async function sendTestPush(): Promise<string> {
  const { data, error } = await db().functions.invoke('clever-action', { body: { test: true } });
  if (error) throw new Error(error.message || 'The reminder function could not be reached.');
  return data?.sent ? 'Test notification sent.' : 'No device received it. Turn reminders off and on again.';
}

// Shows a notification from this tab when the page is not being looked at (e.g. an analysis that
// finished while the user switched to another tab). Needs notification permission, which turning on
// reminders in Settings grants; does nothing otherwise. `url` is opened when it is clicked.
export async function notifyIfAway(title: string, body: string, url = '/'): Promise<void> {
  try {
    if (typeof document === 'undefined' || !document.hidden) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration('/sw.js') : null;
    if (registration) {
      await registration.showNotification(title, { body, icon: '/logo-icon.png', tag: url, data: { url } });
    } else {
      const notification = new Notification(title, { body, icon: '/logo-icon.png' });
      notification.onclick = () => {
        window.focus();
        window.location.href = url;
      };
    }
  } catch {}
}
