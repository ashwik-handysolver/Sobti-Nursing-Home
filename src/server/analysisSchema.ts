// The exact shape Gemini must return for an analyzed recording. Passing it as the response schema
// means a reply can't come back half-formed; the descriptions double as instructions for each field.
//
// Server files are also compiled as a Vercel function, so their local imports need the ".js" extension.
import { Type, type Schema } from '@google/genai';
import { CLINIC_PROCEDURES, LEAD_SOURCES } from '../data/clinic.js';
import { LOST_REASONS } from '../utils/lostReasons.js';

const str = (description: string): Schema => ({ type: Type.STRING, description });
const optionalStr = (description: string): Schema => ({ type: Type.STRING, nullable: true, description });
const int = (description: string): Schema => ({ type: Type.INTEGER, description });
const bool = (description: string): Schema => ({ type: Type.BOOLEAN, description });
const list = (items: Schema, description?: string): Schema => ({ type: Type.ARRAY, items, description });
const strings = (description: string): Schema => list({ type: Type.STRING }, description);
const choice = (options: readonly string[], description: string, nullable = false): Schema => ({
  type: Type.STRING,
  enum: [...options],
  nullable,
  description,
});
// Every property is required unless listed as optional
const obj = (properties: Record<string, Schema>, optional: string[] = [], description?: string): Schema => ({
  type: Type.OBJECT,
  properties,
  required: Object.keys(properties).filter((key) => !optional.includes(key)),
  propertyOrdering: Object.keys(properties),
  description,
});

const moment = {
  timestamp: str('Timestamp of the transcript line, e.g. "01:16"'),
  seconds: int('The same moment in seconds from the start'),
};

export const ANALYSIS_SCHEMA: Schema = obj({
  detectedLanguage: str('e.g. English, Hindi, or Hinglish - Hindi & English bilingual'),
  transcript: list(
    obj({
      id: str('"t1", "t2", …'),
      speaker: str('Name if stated in the audio, otherwise "Speaker 1", "Speaker 2"'),
      timestamp: str('Start of the line, e.g. "00:15"'),
      startSeconds: int('Start of the line in seconds'),
      text: str('Exact verbatim text in the language spoken'),
      isUnclear: bool('true when a word or name was muffled and marked "[unclear]"'),
    })
  ),
  summary: obj({
    executiveSummary: str('Two or three sentences on what the consultation covered and how it ended'),
    keyTopics: list(
      obj({
        title: str('Topic title'),
        summary: str('One-sentence explanation'),
        bullets: strings('Supporting points'),
      })
    ),
    outcomes: strings('What was concluded'),
    quickBulletOverview: strings('3 to 6 short points for fast skimming'),
  }),
  tasks: list(
    obj({
      id: str('"task-1", "task-2", …'),
      description: str('The action to take'),
      owner: str('Person responsible, or "Unassigned"'),
      priority: choice(['High', 'Medium', 'Low'], 'Based on the urgency discussed'),
      dueDate: str('The deadline as stated, or "Not specified"'),
      dueDateISO: optionalStr('YYYY-MM-DD when the deadline resolves to a calendar date, otherwise null'),
      isExplicitDeadline: bool('true only if a deadline was actually stated'),
      status: choice(['Pending'], 'Always "Pending"'),
      sourceRef: str('Who raised it and when, e.g. "Speaker 1 at 00:15"'),
    })
  ),
  consultationType: str('e.g. Cataract Evaluation, LASIK Refractive Consult, Glaucoma Review, Retina Check'),
  salespersonName: str('Name of the doctor or patient counsellor who led the conversation, or empty string'),
  estimatedConversionChance: int('0-100: how likely the patient is to go ahead with treatment at this clinic'),
  pitchAnalysis: obj({
    overallScore: int('0-100'),
    summary: str('Two sentences on how the consultation was handled'),
    ratings: obj({
      rapport: int('1-5'),
      needsDiscovery: int('1-5'),
      objectionHandling: int('1-5'),
      clarity: int('1-5'),
      closing: int('1-5'),
    }),
    strengths: strings('2 to 4 specific things done well'),
    missedOpportunities: list(
      obj({
        ...moment,
        whatHappened: str('What was said or left unaddressed'),
        suggestion: str('What the doctor or counsellor could have said instead, as a direct quote'),
      })
    ),
  }),
  conversionTimeline: list(
    obj({
      ...moment,
      score: int('0-100 likelihood of going ahead at this moment'),
      reason: str('At most 15 words on what was said that set or moved the likelihood'),
    })
  ),
  conversionFactors: obj({
    positive: strings('What counts in favour, e.g. "Strong motivation to stop wearing glasses"'),
    negative: strings('What counts against, e.g. "Waiting for insurance pre-authorization"'),
  }),
  conversionBarriers: list(
    obj(
      {
        id: str('"b-1", "b-2", …'),
        category: choice(
          [
            'Price / Affordability',
            'Procedure Hesitation',
            'Information Request',
            'Unanswered Questions',
            'Timing / Availability',
            'Unclear Next Step',
            'Other',
          ],
          'The kind of concern'
        ),
        description: str('The specific concern, explained clearly'),
        supportingExcerpt: optionalStr('Exact or near-exact quote from the conversation showing it'),
        isExplicit: bool('true if the patient said it outright, false if inferred'),
      },
      ['supportingExcerpt']
    )
  ),
  patientGoal: str('Why the patient contacted or visited the clinic'),
  procedureDiscussed: str('Name and details of the procedure or service discussed'),
  patientHesitation: str('Key hesitation, fear or unanswered question the patient expressed, or empty string'),
  agreedNextSteps: strings('Clear next steps agreed during the conversation, most important first'),
  leadSignals: obj(
    {
      treatment: choice([...CLINIC_PROCEDURES, 'Other'], 'The clinic service this conversation is mainly about'),
      leadSource: choice(LEAD_SOURCES, 'How the patient came to the clinic; null unless someone says so', true),
      suggestedStage: choice(
        ['Contacted', 'Consultation Booked', 'Consultation Completed', 'Converted'],
        'Where this lead stands at the end of the conversation; null if unclear',
        true
      ),
      lossReason: choice(
        LOST_REASONS.filter((reason) => reason !== 'Unknown'),
        'If this patient does not go ahead, the most likely reason; null if they showed no real hesitation',
        true
      ),
    },
    ['leadSource', 'suggestedStage', 'lossReason']
  ),
});
