import type { ClientLead, MeetingRecording } from '../types/meeting';
import { isOpenLead } from './leads';
import { daysSince } from './format';
import { flattenTasks } from './tasks';

// An open lead with no contact for this many days is called out as going cold
export const STALE_AFTER_DAYS = 7;

export interface PriorityLead {
  client: ClientLead;
  score: number; // 0-100, higher means call sooner
  daysSinceContact: number | null;
  overdueFollowUps: number;
  concern?: string; // the main thing holding the patient back
  nextStep?: string; // what was agreed or suggested
  reasons: string[]; // short, plain reasons it is on the list
}

// The latest day anyone spoke to the patient: their last visit or their latest recorded conversation
export function lastContactDate(client: ClientLead, recordings: MeetingRecording[]): string | undefined {
  const dates = [
    client.lastVisitDate,
    client.createdDate,
    ...recordings
      .filter((r) => r.clientId === client.id || client.recordingIds.includes(r.id))
      .map((r) => r.uploadDate?.slice(0, 10)),
  ].filter(Boolean) as string[];
  return dates.sort().pop();
}

// Open leads, ranked by who is most worth calling now. A lead scores higher the likelier it is to
// convert, the more the treatment is worth, the longer it has gone without contact (up to two weeks),
// and when a follow-up for it is overdue. Leads put on hold are left out.
export function rankPriorityLeads(clients: ClientLead[], recordings: MeetingRecording[]): PriorityLead[] {
  const open = clients.filter((c) => isOpenLead(c) && c.flag !== 'On Hold');
  if (open.length === 0) return [];

  const maxValue = Math.max(...open.map((c) => c.numericValue || 0), 1);
  const overdueByClient = new Map<string, number>();
  flattenTasks(recordings, clients)
    .filter((t) => t.status !== 'Completed' && t.urgency === 'overdue' && t.clientId)
    .forEach((t) => overdueByClient.set(t.clientId!, (overdueByClient.get(t.clientId!) || 0) + 1));

  return open
    .map((client) => {
      const chance = Number.isFinite(client.conversionChance) ? client.conversionChance : 50;
      const value = client.numericValue || 0;
      const days = daysSince(lastContactDate(client, recordings));
      const overdue = overdueByClient.get(client.id) || 0;

      const likelihood = chance / 100; // 0-1
      const worth = 0.5 + 0.5 * (value / maxValue); // 0.5-1
      const urgency = 1 + Math.min(days ?? 0, 14) / 28 + (overdue > 0 ? 0.25 : 0); // 1-1.75
      const score = Math.round((100 * likelihood * worth * urgency) / 1.75);

      const reasons: string[] = [];
      if (Number.isFinite(client.conversionChance)) reasons.push(`${client.conversionChance}% likely`);
      if (overdue > 0) reasons.push(`${overdue} overdue follow-up${overdue === 1 ? '' : 's'}`);
      if (days !== null && days >= STALE_AFTER_DAYS) reasons.push(`${days} days without contact`);
      if (client.flag === 'Follow-up Pending') reasons.push('Follow-up pending');

      return {
        client,
        score,
        daysSinceContact: days,
        overdueFollowUps: overdue,
        concern: client.conversionIssues?.[0],
        nextStep: client.conversionNextStep || undefined,
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score || (b.daysSinceContact ?? 0) - (a.daysSinceContact ?? 0));
}

// Open leads nobody has been in touch with for STALE_AFTER_DAYS or more, longest silence first
export function staleLeads(clients: ClientLead[], recordings: MeetingRecording[]) {
  return clients
    .filter((c) => isOpenLead(c) && c.flag !== 'On Hold')
    .map((client) => ({ client, days: daysSince(lastContactDate(client, recordings)) }))
    .filter((entry): entry is { client: ClientLead; days: number } => entry.days !== null && entry.days >= STALE_AFTER_DAYS)
    .sort((a, b) => b.days - a.days);
}
