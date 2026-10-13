import type {
  ClientLead,
  LeadFlag,
  LeadStage,
  LostReason,
  MeetingRecording,
  PipelineStage,
} from '../types/meeting';

// The steps a lead moves through before it ends as Converted or Lost
export const PIPELINE_STAGES: PipelineStage[] = [
  'New Lead',
  'Contacted',
  'Consultation Booked',
  'Consultation Completed',
];
export const LEAD_STAGES: LeadStage[] = [...PIPELINE_STAGES, 'Converted', 'Lost'];
export const LEAD_FLAGS: LeadFlag[] = ['On Hold', 'Follow-up Pending'];

export const STAGE_HINTS: Record<LeadStage, string> = {
  'New Lead': 'Patient enquiry received',
  Contacted: 'Counsellor spoke to patient',
  'Consultation Booked': 'Appointment scheduled',
  'Consultation Completed': 'Treatment discussed',
  Converted: 'Treatment booked',
  Lost: 'Did not proceed',
};

export const isPipelineStage = (stage: string): stage is PipelineStage =>
  (PIPELINE_STAGES as string[]).includes(stage);

// Still in play: neither converted nor lost
export const isOpenLead = (client: ClientLead) => isPipelineStage(client.stage);

// Stages used before the lifecycle existed, mapped to their closest equivalent
const LEGACY_STAGES: Record<string, LeadStage> = {
  'New Inquiry': 'New Lead',
  'Surgery Scheduled': 'Converted',
  'Post-Op Follow-Up': 'Converted',
  'Routine Eye Care': 'Consultation Completed',
};

// Brings a saved patient record up to the current lifecycle stages
export function normalizeLead(client: ClientLead): ClientLead {
  const saved = client.stage as string;
  const stage = LEGACY_STAGES[saved] || ((LEAD_STAGES as string[]).includes(saved) ? client.stage : 'New Lead');
  return stage === client.stage ? client : { ...client, stage };
}

// Moves a lead to a stage and keeps the related fields consistent. Marking a lead Lost
// records the stage it had reached, why, and when: the lost-lead figures are built from these.
export function withStage(
  client: ClientLead,
  stage: LeadStage,
  lost: { atStage?: PipelineStage; reason?: LostReason } = {}
): ClientLead {
  if (stage === 'Lost') {
    const reached =
      lost.atStage ||
      (isPipelineStage(client.stage) ? client.stage : client.lostAtStage) ||
      // A converted lead that later backs out was lost after its consultation
      'Consultation Completed';
    return {
      ...client,
      stage,
      lostAtStage: reached,
      lostReason: lost.reason || client.lostReason || 'Unknown',
      lostDate: (client.stage === 'Lost' && client.lostDate) || new Date().toISOString().slice(0, 10),
      flag: undefined,
    };
  }
  return {
    ...client,
    stage,
    lostAtStage: undefined,
    lostReason: undefined,
    lostDate: undefined,
    flag: stage === 'Converted' ? undefined : client.flag,
  };
}

// How far along the pipeline a lead got (0 = New Lead … 4 = Converted).
// A lost lead counts up to the stage it was lost at.
export function furthestStageIndex(client: ClientLead): number {
  if (client.stage === 'Converted') return PIPELINE_STAGES.length;
  const stage = client.stage === 'Lost' ? client.lostAtStage || 'New Lead' : client.stage;
  return Math.max(0, (PIPELINE_STAGES as string[]).indexOf(stage));
}

// Carries what a freshly analyzed recording found onto its lead: the conversion estimate,
// the concerns raised and the next step agreed. Fields the analysis left empty are kept as they were.
export function withAnalysis(
  client: ClientLead,
  analysis: Pick<MeetingRecording, 'estimatedConversionChance' | 'conversionBarriers' | 'agreedNextSteps'>
): ClientLead {
  const concerns = (analysis.conversionBarriers || []).map((b) => b.description).filter(Boolean);
  return {
    ...client,
    conversionChance:
      typeof analysis.estimatedConversionChance === 'number'
        ? analysis.estimatedConversionChance
        : client.conversionChance,
    conversionIssues: concerns.length ? concerns : client.conversionIssues,
    conversionNextStep: analysis.agreedNextSteps?.[0] || client.conversionNextStep,
  };
}
