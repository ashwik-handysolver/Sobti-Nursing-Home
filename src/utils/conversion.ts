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

// How many conversations each kind of concern came up in (counted once per conversation)
export function countConcerns(recordings: MeetingRecording[]): CountItem[] {
  const counts = new Map<string, number>();
  recordings.forEach((r) => {
    new Set((r.conversionBarriers || []).map((b) => b.category)).forEach((category) => {
      counts.set(category, (counts.get(category) || 0) + 1);
    });
  });
  return [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
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
  };
}
