import type { ClientLead, LostReason, MeetingRecording } from '../types/meeting';

export const LOST_REASONS: LostReason[] = [
  'Price concerns',
  'Fear of surgery',
  'Chose another clinic',
  'Not ready to proceed',
  'Unsuitable for treatment',
  'Poor follow-up',
  'Scheduling conflicts',
  'Unknown',
];

export const LOST_REASON_HINTS: Partial<Record<LostReason, string>> = {
  'Unsuitable for treatment': 'As confirmed by the clinician',
};

// What to look for in a concern the analysis picked up, most specific first
const REASON_KEYWORDS: [LostReason, RegExp][] = [
  ['Chose another clinic', /another (clinic|hospital|centre|center|doctor)|competitor|elsewhere|second opinion/i],
  ['Unsuitable for treatment', /unsuitable|not suitable|not a candidate|contraindicat|ineligible|thin cornea/i],
  ['Price concerns', /price|pricing|cost|afford|expens|budget|\bemi\b|insurance|co-?pay|₹|rupee|financ|discount/i],
  ['Fear of surgery', /fear|afraid|scared|anxi|nervous|pain|risk|complication|safety|downtime|side effect/i],
  ['Scheduling conflicts', /schedul|timing|availability|appointment slot|travel|time off|leave from work|exam/i],
  ['Not ready to proceed', /not ready|think (it|about)|discuss with|family|postpone|later|wait|undecided|hesita/i],
  ['Poor follow-up', /follow-?up|unanswered|no response|call back|unclear next step/i],
];

// Fallback when a concern's wording matches nothing: the category the analysis filed it under
const CATEGORY_REASONS: Record<string, LostReason> = {
  'Price / Affordability': 'Price concerns',
  'Procedure Hesitation': 'Fear of surgery',
  'Timing / Availability': 'Scheduling conflicts',
  'Unclear Next Step': 'Poor follow-up',
  'Unanswered Questions': 'Poor follow-up',
  'Information Request': 'Not ready to proceed',
};

export interface LostReasonSuggestion {
  reason: LostReason;
  evidence: string; // the concern from the conversation that points to it
}

// Suggests why a lead was lost. Newer analyses name the likely reason outright; for older
// recordings it is worked out from the concerns they found. Either way it only proposes:
// the counsellor confirms or picks something else.
export function suggestLostReason(client: ClientLead, recordings: MeetingRecording[]): LostReasonSuggestion | null {
  const latestFirst = [...recordings].sort((a, b) => b.uploadDate.localeCompare(a.uploadDate));

  const named = latestFirst.find((r) => r.leadSignals?.lossReason);
  if (named) {
    return {
      reason: named.leadSignals!.lossReason!,
      evidence: named.patientHesitation || named.conversionBarriers?.[0]?.description || named.title,
    };
  }

  const concerns: { text: string; category?: string }[] = [
    ...latestFirst.flatMap((r) => [
      ...(r.conversionBarriers || []).map((b) => ({ text: b.description, category: b.category as string })),
      ...(r.conversionFactors?.negative || []).map((text) => ({ text })),
      ...(r.patientHesitation ? [{ text: r.patientHesitation }] : []),
    ]),
    ...(client.conversionIssues || []).map((text) => ({ text })),
  ].filter((c) => c.text);

  // The reason most concerns point to wins; ties go to the one mentioned first
  const tally = new Map<LostReason, { count: number; evidence: string }>();
  for (const concern of concerns) {
    const reason =
      REASON_KEYWORDS.find(([, pattern]) => pattern.test(concern.text))?.[0] ||
      (concern.category ? CATEGORY_REASONS[concern.category] : undefined);
    if (!reason) continue;
    const entry = tally.get(reason);
    if (entry) entry.count += 1;
    else tally.set(reason, { count: 1, evidence: concern.text });
  }

  let best: LostReasonSuggestion | null = null;
  let bestCount = 0;
  tally.forEach(({ count, evidence }, reason) => {
    if (count > bestCount) {
      best = { reason, evidence };
      bestCount = count;
    }
  });
  return best;
}
