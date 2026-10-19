import { supabase } from '../lib/supabase';

// Recording audio lives in the private `recording-audio` bucket (see supabase/recordings.sql),
// at <user id>/<recording id>, so storage rules can limit each user to their own folder.
const BUCKET = 'recording-audio';
const SIGNED_URL_SECONDS = 12 * 60 * 60;

const db = () => {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
};

async function audioPath(recordingId: string): Promise<string> {
  const { data } = await db().auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) throw new Error('You are signed out. Log in again to save audio.');
  return `${userId}/${recordingId}`;
}

// Uploads the audio and returns where it was stored
export async function saveRecordingAudio(recordingId: string, audio: Blob): Promise<string> {
  const path = await audioPath(recordingId);
  const { error } = await db()
    .storage.from(BUCKET)
    .upload(path, audio, { upsert: true, contentType: audio.type || 'application/octet-stream' });
  if (error) throw new Error(`The audio could not be saved: ${error.message}`);
  return path;
}

export async function loadRecordingAudio(recordingId: string): Promise<Blob | null> {
  try {
    const { data, error } = await db().storage.from(BUCKET).download(await audioPath(recordingId));
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Could not load recording audio:', err);
    return null;
  }
}

export async function deleteRecordingAudio(recordingId: string): Promise<void> {
  try {
    const { error } = await db().storage.from(BUCKET).remove([await audioPath(recordingId)]);
    if (error) throw error;
  } catch (err) {
    console.warn('Could not delete recording audio:', err);
  }
}

// Temporary playback links for stored audio, keyed by storage path
export async function signedAudioUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await db().storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
  if (error) {
    console.warn('Could not create audio links:', error);
    return {};
  }
  return Object.fromEntries(
    (data || []).filter((d) => d.signedUrl && d.path).map((d) => [d.path as string, d.signedUrl])
  );
}
