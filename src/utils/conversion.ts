import { ClientLead, LostReason, MeetingRecording } from '../types/meeting';
import { PIPELINE_STAGES, furthestStageIndex } from './leads';

// Procedure names are free text on older records, so treatments are matched by keyword
const TREATMENT_KEYWORDS: [string, RegExp][] = [
  ['SMILE', /smile/i],
  ['LASIK', /lasik|contoura|prk/i],
  ['ICL / IPCL', /\bicl\b|ipcl/i],
  ['Cataract', /cataract|phaco|\biol\b|lens exchange/i],
  ['Glaucoma', /glaucoma|trabecul|\bslt\b|migs/i],
  ['Retina', /retina|\boct\b|vitre|anti-vegf/i],
  ['Squint', /squint|strabismus/i],
  ['Paediatric', /paediatric|pediatric/i],
];

// The treatment group a procedure name belongs to
export const categorizeTreatment = (procedureName: string): string =>
  TREATMENT_KEYWORDS.find(([, pattern]) => pattern.test(procedureName || ''))?.[0] || 'Other';

export const treatmentOf = (client: ClientLead): string => categorizeTreatment(client.procedureName);

export interface CountItem {
  label: string;
  value: number;
}

export interface ComparisonRow {
  label: string;
  leads: number;
  open: number;
  converted: number;
  lost: number;
  conversionRate: number; // percent of this group's leads that converted
}

// One row per group of leads (by treatment, by source, …), busiest first, to see which convert
export function compareLeads(clients: ClientLead[], groupOf: (client: ClientLead) => string): ComparisonRow[] {
  const groups = new Map<string, ClientLead[]>();
  clients.forEach((c) => groups.set(groupOf(c), [...(groups.get(groupOf(c)) || []), c]));
  return [...groups.entries()]
    .map(([label, leads]) => {
      const converted = leads.filter((c) => c.stage === 'Converted').length;
      const lost = leads.filter((c) => c.stage === 'Lost').length;
      return {
        label,
        leads: leads.length,
        open: leads.length - converted - lost,
        converted,
        lost,
        conversionRate: Math.round((converted / leads.length) * 100),
      };
    })
    .sort((a, b) => b.leads - a.leads || a.label.localeCompare(b.label));
}

export const NO_SOURCE = 'Not recorded';
export const compareTreatments = (clients: ClientLead[]) => compareLeads(clients, treatmentOf);
export const compareSources = (clients: ClientLead[]) => compareLeads(clients, (c) => c.leadSource || NO_SOURCE);

export interface RecordingConcern {
  text: string;
  category?: string; // the category the analysis filed it under, when it gave one
  excerpt?: string; // the words from the conversation it was taken from
}

// The concerns shown for a recording: the analysis's barriers, or failing that its negative
// factors, or the single hesitation it noted. The recording page and Insights both use this.
export function concernsOf(recording: MeetingRecording): RecordingConcern[] {
  if (recording.conversionBarriers && recording.conversionBarriers.length > 0) {
    return recording.conversionBarriers
      .filter((b) => b.description)
      .map((b) => ({ text: b.description, category: b.category, excerpt: b.supportingExcerpt }));
  }
  if (recording.conversionFactors?.negative?.length) {
    return recording.conversionFactors.negative.filter(Boolean).map((text) => ({ text }));
  }
  return recording.patientHesitation ? [{ text: recording.patientHesitation }] : [];
}

// Topics for grouping concerns, decided by what the concern says (most specific first)
const CONCERN_TOPICS: [string, RegExp][] = [
  ['Comparing other options', /another (clinic|hospital|centre|center|doctor)|competitor|elsewhere|second opinion|compar|cheaper/i],
  ['Cost and insurance', /price|pricing|cost|afford|expens|budget|\bemi\b|instal|insurance|tpa|claim|co-?pay|₹|rupee|financ|discount|package/i],
  ['Recovery and downtime', /recover|downtime|heal|after (the )?surgery|post-?op|restriction|water|bath|screen|driv|\brest\b|back to work|days off/i],
  ['Medical suitability', /diabet|sugar|eligib|suitab|candidate|cornea|pressure|retina|condition|medical history/i],
  ['Fear of the procedure', /fear|afraid|scared|anxi|nervous|worr|pain|risk|complication|safe|side effect/i],
  ['Timing and scheduling', /schedul|timing|availab|appointment|slot|date|travel|time off|leave|wedding|busy/i],
  ['Needs time or family input', /family|son|daughter|wife|husband|spouse|discuss|think|decide|later|wait|not ready|undecided|hesita|consult/i],
];

const CATEGORY_TOPICS: Record<string, string> = {
  'Price / Affordability': 'Cost and insurance',
  'Procedure Hesitation': 'Fear of the procedure',
  'Timing / Availability': 'Timing and scheduling',
  'Information Request': 'Questions left unanswered',
  'Unanswered Questions': 'Questions left unanswered',
  'Unclear Next Step': 'Questions left unanswered',
};

export const concernTopic = (concern: RecordingConcern): string =>
  CONCERN_TOPICS.find(([, pattern]) => pattern.test(concern.text))?.[0] ||
  (concern.category && CATEGORY_TOPICS[concern.category]) ||
  'Other concerns';

export interface ConcernTopicCount extends CountItem {
  examples: string[]; // the concerns themselves, newest first
}

// How many conversations each topic of concern came up in (counted once per conversation)
export function countConcerns(recordings: MeetingRecording[]): ConcernTopicCount[] {
  const topics = new Map<string, { value: number; examples: string[] }>();
  [...recordings]
    .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate))
    .forEach((r) => {
      const byTopic = new Map<string, string[]>();
      concernsOf(r).forEach((c) => {
        const topic = concernTopic(c);
        byTopic.set(topic, [...(byTopic.get(topic) || []), c.text]);
      });
      byTopic.forEach((texts, topic) => {
        const entry = topics.get(topic) || { value: 0, examples: [] };
        entry.value += 1;
        texts.forEach((t) => !entry.examples.includes(t) && entry.examples.push(t));
        topics.set(topic, entry);
      });
    });
  return [...topics.entries()]
    .map(([label, { value, examples }]) => ({ label, value, examples }))
    .sort((a, b) => b.value - a.value);
}

export interface ConversionOverview {
  totalLeads: number;
  newThisMonth: number;
  converted: number;
  lost: number;
  onHold: number;
  followUpPending: number;
  conversionRate: number | null; // percent, one decimal
  byTreatment: CountItem[];
  funnel: CountItem[]; // how many leads reached each step
  dropOff: CountItem[]; // lost leads, by the stage they were lost at
  lossReasons: CountItem[]; // lost leads, by why they did not proceed (most common first)
  lossInsight: string | null; // one sentence on the leading reason
  openLeads: number;
  pipelineValue: number; // ₹ of leads still open
  wonValue: number; // ₹ of converted leads
  lostValue: number; // ₹ of lost leads
  lostValueByReason: Record<string, number>;
}

// How each reason reads after "lost …" in a sentence
const REASON_PHRASES: Record<LostReason, string> = {
  'Price concerns': 'to price concerns',
  'Fear of surgery': 'to fear of surgery',
  'Chose another clinic': 'to another clinic',
  'Not ready to proceed': 'because they were not ready to proceed',
  'Unsuitable for treatment': 'because treatment was unsuitable',
  'Poor follow-up': 'to poor follow-up',
  'Scheduling conflicts': 'to scheduling conflicts',
  Unknown: 'for an unrecorded reason',
};

function describeTopLoss(lostLeads: ClientLead[], month: string): string | null {
  const byReason = new Map<LostReason, ClientLead[]>();
  lostLeads.forEach((c) => {
    const reason = c.lostReason || 'Unknown';
    byReason.set(reason, [...(byReason.get(reason) || []), c]);
  });
  const top = [...byReason.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  if (!top) return null;
  const [reason, leads] = top;
  if (reason === 'Unknown') {
    return 'Most lost leads have no reason recorded. Add a reason when marking a lead as lost to see what is costing conversions.';
  }

  const n = leads.length;
  const thisMonth = leads.filter((c) => (c.lostDate || '').startsWith(month)).length;
  const when = thisMonth === 0 ? '' : thisMonth === n ? ' this month' : `, ${thisMonth} of them this month`;
  let sentence = `${n} ${n === 1 ? 'lead was' : 'leads were'} lost ${REASON_PHRASES[reason]}${when}.`;

  // Name a treatment only when it accounts for most of these leads
  const treatments = new Map<string, number>();
  leads.forEach((c) => treatments.set(treatmentOf(c), (treatments.get(treatmentOf(c)) || 0) + 1));
  const [treatment, count] = [...treatments.entries()].sort((a, b) => b[1] - a[1])[0];
  if (treatment !== 'Other' && count > n / 2) {
    sentence += n === 1 ? ` They were interested in ${treatment}.` : ` Most were interested in ${treatment}.`;
  }
  return sentence;
}

export function buildConversionOverview(clients: ClientLead[], maxTreatments = 4): ConversionOverview {
  const month = new Date().toISOString().slice(0, 7);
  const converted = clients.filter((c) => c.stage === 'Converted').length;
  const lostLeads = clients.filter((c) => c.stage === 'Lost');
  const open = clients.filter((c) => c.stage !== 'Converted' && c.stage !== 'Lost');

  const counts = new Map<string, number>();
  clients.forEach((c) => counts.set(treatmentOf(c), (counts.get(treatmentOf(c)) || 0) + 1));
  const other = counts.get('Other') || 0;
  counts.delete('Other');
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  // The smallest treatments fold into "Other" so the chart stays readable
  const shown = ranked.slice(0, maxTreatments);
  const folded = ranked.slice(maxTreatments).reduce((sum, [, n]) => sum + n, other);
  const byTreatment = shown.map(([label, value]) => ({ label, value }));
  if (folded > 0) byTreatment.push({ label: 'Other', value: folded });

  const reached = clients.map(furthestStageIndex);
  const funnelLabels = ['New leads', 'Contacted', 'Consultation booked', 'Consultation completed', 'Converted'];

  return {
    totalLeads: clients.length,
    newThisMonth: clients.filter((c) => (c.createdDate || '').startsWith(month)).length,
    converted,
    lost: lostLeads.length,
    onHold: clients.filter((c) => c.flag === 'On Hold').length,
    followUpPending: clients.filter((c) => c.flag === 'Follow-up Pending').length,
    conversionRate: clients.length ? Math.round((converted / clients.length) * 1000) / 10 : null,
    byTreatment,
    funnel: funnelLabels.map((label, step) => ({ label, value: reached.filter((index) => index >= step).length })),
    dropOff: PIPELINE_STAGES.map((stage) => ({
      label: stage,
      value: lostLeads.filter((c) => (c.lostAtStage || 'New Lead') === stage).length,
    })),
    lossReasons: [...new Set(lostLeads.map((c) => c.lostReason || 'Unknown'))]
      .map((reason) => ({
        label: reason as string,
        value: lostLeads.filter((c) => (c.lostReason || 'Unknown') === reason).length,
      }))
      .sort((a, b) => b.value - a.value),
    lossInsight: describeTopLoss(lostLeads, month),
    openLeads: open.length,
    pipelineValue: sumValue(open),
    wonValue: sumValue(clients.filter((c) => c.stage === 'Converted')),
    lostValue: sumValue(lostLeads),
    lostValueByReason: lostLeads.reduce<Record<string, number>>((acc, c) => {
      const reason = c.lostReason || 'Unknown';
      acc[reason] = (acc[reason] || 0) + (c.numericValue || 0);
      return acc;
    }, {}),
  };
}

const sumValue = (leads: ClientLead[]) => leads.reduce((sum, c) => sum + (c.numericValue || 0), 0);

// ---------- Time periods (leads are counted by the day they came in) ----------

export type PeriodId = 'month' | 'last-month' | '90d' | 'all';

export const PERIOD_OPTIONS: { id: PeriodId; label: string }[] = [
  { id: 'month', label: 'This month' },
  { id: 'last-month', label: 'Last month' },
  { id: '90d', label: '90 days' },
  { id: 'all', label: 'All time' },
];

const localISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function inPeriod(iso: string | undefined, period: PeriodId): boolean {
  if (period === 'all') return true;
  if (!iso) return false;
  const day = iso.slice(0, 10);
  const now = new Date();
  if (period === 'month') return day.slice(0, 7) === localISO(now).slice(0, 7);
  if (period === 'last-month') return day.slice(0, 7) === localISO(new Date(now.getFullYear(), now.getMonth() - 1, 1)).slice(0, 7);
  const start = new Date(now);
  start.setDate(start.getDate() - 89);
  return day >= localISO(start);
}

export const leadsInPeriod = (clients: ClientLead[], period: PeriodId) =>
  clients.filter((c) => inPeriod(c.createdDate, period));

// What patients who were eventually lost worried about, by topic
export function concernsAmongLost(clients: ClientLead[], recordings: MeetingRecording[]) {
  const lost = clients.filter((c) => c.stage === 'Lost');
  const ids = new Set(lost.map((c) => c.id));
  const recordingIds = new Set(lost.flatMap((c) => c.recordingIds || []));
  return countConcerns(recordings.filter((r) => (r.clientId && ids.has(r.clientId)) || recordingIds.has(r.id)));
}
