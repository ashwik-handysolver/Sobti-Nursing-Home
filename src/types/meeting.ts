export type LanguageMode = 'auto' | 'en' | 'hi' | 'hinglish';

export type LeadStage =
  | 'New Inquiry'
  | 'Consultation Completed'
  | 'Surgery Scheduled'
  | 'Post-Op Follow-Up'
  | 'Routine Eye Care';

export interface ClientLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  condition: string; // e.g. "Cataract (Grade 3 Nuclear Sclerosis OD) & Toric IOL"
  procedureName: string; // e.g. "Phacoemulsification + Toric IOL (Right Eye)"
  procedureValue: string; // e.g. "₹65,000"
  numericValue: number; // e.g. 65000
  stage: LeadStage;
  assignedDoctor: string;
  createdDate: string;
  lastVisitDate: string;
  notes: string;
  recordingIds: string[]; // array of MeetingRecording ids

  // Sales & Medical Counselor Conversion Intelligence
  conversionChance: number; // 0 to 100%
  conversionIssues: string[]; // e.g. ["Insurance cashless query for premium Toric lens", "Fear of pain / postoperative downtime"]
  conversionNextStep: string; // e.g. "Provide TPA pre-authorization form and offer 0% EMI plan"
  urgencyLevel: 'High' | 'Medium' | 'Low';
  counselorNotes?: string;
}

export interface ConversionAnalytics {
  avgConversionChance: number;
  totalPipelineValue: number;
  highLikelihoodCount: number;
  mediumLikelihoodCount: number;
  lowLikelihoodCount: number;
  topObjections: { issue: string; count: number; percentage: number }[];
  stageCounts: { stage: LeadStage; count: number; value: number }[];
}

export interface TranscriptSegment {
  id: string;
  speaker: string;
  timestamp: string; // e.g. "00:15"
  startSeconds: number;
  text: string;
  translatedText?: string;
  isUnclear?: boolean;
}

export interface KeyTopic {
  title: string;
  summary: string;
  bullets: string[];
}

export interface MeetingSummary {
  executiveSummary: string;
  keyTopics: KeyTopic[];
  highlights: string[];
  challenges: string[];
  outcomes: string[];
  quickBulletOverview: string[];
}

export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface MeetingTask {
  id: string;
  description: string;
  owner: string; // e.g. "Dr. Mehta", "Patient (Ramesh)", "Clinic Nurse", "Optometrist"
  priority: TaskPriority;
  dueDate: string; // Stated deadline or "Not specified"
  dueDateISO?: string; // YYYY-MM-DD when the deadline resolves to a calendar date
  isExplicitDeadline: boolean; // true if specifically uttered in audio, false if suggested
  status: TaskStatus;
  sourceRef?: string; // e.g. "Dr. Mehta at 01:24"
  recordingId?: string;
  recordingTitle?: string;
  clientId?: string;
}

export interface MilestonePhase {
  phaseName: string;
  durationOrPeriod: string;
  milestones: string[];
  keyDeliverables: string[];
}

export interface RecommendedStep {
  step: string;
  owner?: string;
  suggestedDate?: string;
  isExplicitDate: boolean;
}

export interface TimelineItem {
  item: string;
  date: string;
  dateType: 'stated' | 'ai-suggested';
  context: string;
}

export interface MeetingPlan {
  objective: string;
  phases: MilestonePhase[];
  recommendedNextSteps: RecommendedStep[];
  dependenciesAndBlockers: string[];
  timelineDetails: TimelineItem[];
  risksAndQuestions: string[];
}

export interface KeyDecision {
  id: string;
  decision: string;
  context: string;
  status: 'confirmed' | 'proposal_suggestion';
  impact: string;
  pendingApprovals?: string[];
}

export interface ConversionBarrier {
  id: string;
  category:
    | 'Price / Affordability'
    | 'Procedure Hesitation'
    | 'Information Request'
    | 'Unanswered Questions'
    | 'Timing / Availability'
    | 'Unclear Next Step'
    | 'Other';
  description: string;
  supportingExcerpt?: string;
  isExplicit: boolean; // true if explicitly stated by patient, false if AI-inferred concern
}

// How likely the patient was to go ahead at one moment of the conversation
export interface ConversionPoint {
  seconds: number;
  timestamp: string; // e.g. "01:16"
  score: number; // 0-100
  reason: string; // what moved it
}

// A moment where a different response could have improved the outcome
export interface PitchMissedOpportunity {
  seconds: number;
  timestamp: string;
  whatHappened: string;
  suggestion: string; // what the salesperson could have said instead
}

// Review of how the salesperson handled the conversation
export interface PitchAnalysis {
  overallScore: number; // 0-100
  summary: string;
  ratings: {
    rapport: number; // each 1-5
    needsDiscovery: number;
    objectionHandling: number;
    clarity: number;
    closing: number;
  };
  strengths: string[];
  missedOpportunities: PitchMissedOpportunity[];
}

export interface ConversionFactors {
  positive: string[];
  negative: string[];
}

export interface MeetingRecording {
  id: string;
  title: string;
  filename: string;
  uploadDate: string;
  duration: number; // in seconds
  durationFormatted: string; // e.g. "04:12"
  fileSizeFormatted: string;
  detectedLanguage: string;
  languageMode: LanguageMode;
  transcript: TranscriptSegment[];
  summary: MeetingSummary;
  tasks: MeetingTask[];
  plan: MeetingPlan;
  decisions: KeyDecision[];
  status: 'completed' | 'processing' | 'failed';
  error?: string;
  isDemo?: boolean;
  audioUrl?: string; // object URL or generated sample tone
  clientId?: string; // linked client / patient id
  clientName?: string; // patient name
  salespersonName?: string; // counselor or salesperson name
  consultationType?: string; // e.g. "Cataract Pre-Op", "Refractive Consult", "Glaucoma Follow-Up"
  estimatedConversionChance?: number; // AI calculated conversion % from audio dialogue (0-100)
  conversionFactors?: ConversionFactors;
  pitchAnalysis?: PitchAnalysis;
  conversionTimeline?: ConversionPoint[]; // likelihood across the conversation, in time order
  conversionBarriers?: ConversionBarrier[];
  patientGoal?: string; // Why the patient contacted the clinic
  procedureDiscussed?: string; // Procedure or service discussed
  patientHesitation?: string; // Expressed interest or hesitation
  decisionsMade?: string[]; // Important decisions reached
  agreedNextSteps?: string[]; // Next actions agreed upon
}

export type ProcessingStage =
  | 'idle'
  | 'uploading'
  | 'transcribing'
  | 'analyzing'
  | 'generating'
  | 'completed'
  | 'error';
