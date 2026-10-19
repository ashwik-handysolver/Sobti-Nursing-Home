import type { MeetingRecording, MeetingTask } from '../types/meeting';
import { describeDue } from '../utils/tasks';
import { signedAudioUrls } from '../utils/audioStore';
import { supabase } from './supabase';

// Reads and writes the `recordings` and `follow_ups` tables (see supabase/recordings.sql).
// In the app a recording carries its follow-ups in `tasks`; in the database they are separate rows.

const db = () => {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
};

// What is stored for a recording: everything except its follow-ups and the temporary audio link
export const recordingPayload = (recording: MeetingRecording) => {
  const { tasks, audioUrl, ...rest } = recording;
  return JSON.parse(JSON.stringify(rest)) as Omit<MeetingRecording, 'tasks' | 'audioUrl'>;
};

export interface FollowUpEntry {
  task: MeetingTask;
  recordingId: string;
  uploadDate: string;
  clientId?: string;
  position: number;
}

export const followUpEntries = (recordings: MeetingRecording[]): FollowUpEntry[] =>
  recordings.flatMap((r) =>
    r.tasks.map((task, position) => ({
      task,
      recordingId: r.id,
      uploadDate: r.uploadDate,
      clientId: r.clientId,
      position,
    }))
  );

export const followUpKey = (entry: FollowUpEntry) =>
  JSON.stringify([entry.task, entry.recordingId, entry.position, entry.clientId]);

export async function fetchRecordings(): Promise<MeetingRecording[]> {
  const [recRes, fuRes] = await Promise.all([
    db().from('recordings').select('id, audio_path, data').order('created_at', { ascending: false }),
    db().from('follow_ups').select('recording_id, position, data').order('position', { ascending: true }),
  ]);
  if (recRes.error) throw recRes.error;
  if (fuRes.error) throw fuRes.error;

  const tasksByRecording = new Map<string, MeetingTask[]>();
  for (const row of fuRes.data as { recording_id: string; data: MeetingTask }[]) {
    const list = tasksByRecording.get(row.recording_id) || [];
    list.push(row.data);
    tasksByRecording.set(row.recording_id, list);
  }

  const rows = recRes.data as { id: string; audio_path: string | null; data: MeetingRecording }[];
  const urls = await signedAudioUrls(rows.map((r) => r.audio_path).filter(Boolean) as string[]);

  return rows.map((row) => ({
    ...row.data,
    id: row.id,
    audioPath: row.audio_path || undefined,
    audioUrl: row.audio_path ? urls[row.audio_path] : undefined,
    tasks: tasksByRecording.get(row.id) || [],
  }));
}

export async function saveRecordings(recordings: MeetingRecording[]): Promise<void> {
  if (recordings.length === 0) return;
  const { error } = await db()
    .from('recordings')
    .upsert(
      recordings.map((r) => ({
        id: r.id,
        lead_id: r.clientId || null,
        title: r.title,
        upload_date: r.uploadDate,
        audio_path: r.audioPath || null,
        data: recordingPayload(r),
      }))
    );
  if (error) throw error;
}

export async function deleteRecordings(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await db().from('recordings').delete().in('id', ids);
  if (error) throw error;
}

export async function saveFollowUps(entries: FollowUpEntry[]): Promise<void> {
  if (entries.length === 0) return;
  const { error } = await db()
    .from('follow_ups')
    .upsert(
      entries.map(({ task, recordingId, uploadDate, clientId, position }) => ({
        id: task.id,
        recording_id: recordingId,
        lead_id: clientId || task.clientId || null,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: describeDue(task, uploadDate).iso,
        position,
        data: JSON.parse(JSON.stringify(task)),
      }))
    );
  if (error) throw error;
}

export async function deleteFollowUps(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await db().from('follow_ups').delete().in('id', ids);
  if (error) throw error;
}
