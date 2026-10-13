import { LanguageMode, MeetingRecording } from '../types/meeting';
import { apiKeyHeaders } from './apiKey';

// The parts of a recording that come from the AI analysis
export type AnalysisFields = Pick<
  MeetingRecording,
  'detectedLanguage' | 'transcript' | 'summary' | 'tasks' | 'plan' | 'decisions'
> &
  Partial<MeetingRecording>;

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });

// Sends audio to the server for analysis and returns the raw result
export async function requestAnalysis(
  audio: Blob,
  options: { filename: string; mimeType?: string; languageMode: LanguageMode; signal?: AbortSignal }
): Promise<any> {
  const audioBase64 = await blobToBase64(audio);

  const response = await fetch('/api/process-audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...apiKeyHeaders() },
    body: JSON.stringify({
      audioBase64,
      mimeType: options.mimeType || audio.type || 'audio/mp3',
      filename: options.filename,
      languagePreference: options.languageMode,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error || `Server error (${response.status}): ${response.statusText}`);
  }

  const resData = await response.json();
  if (!resData.success || !resData.data) {
    throw new Error(resData.error || 'The recording could not be analyzed.');
  }
  return resData.data;
}

// Turns the raw result into clean recording fields, dropping anything malformed
export function buildAnalysisFields(
  extracted: any,
  context: { recordingId: string; languageMode: LanguageMode; clientId?: string; filename?: string }
): AnalysisFields {
  const { recordingId, languageMode, clientId } = context;
  const pitch = extracted.pitchAnalysis;

  return {
    detectedLanguage:
      extracted.detectedLanguage ||
      (languageMode === 'hi' ? 'Hindi' : languageMode === 'en' ? 'English' : 'Hinglish / Bilingual'),
    salespersonName: extracted.salespersonName || undefined,
    consultationType: extracted.consultationType || undefined,
    estimatedConversionChance:
      typeof extracted.estimatedConversionChance === 'number' ? extracted.estimatedConversionChance : undefined,
    conversionFactors: extracted.conversionFactors || undefined,
    pitchAnalysis:
      pitch && typeof pitch.overallScore === 'number'
        ? {
            overallScore: Math.max(0, Math.min(100, Math.round(pitch.overallScore))),
            summary: String(pitch.summary || ''),
            ratings: {
              rapport: Number(pitch.ratings?.rapport) || 0,
              needsDiscovery: Number(pitch.ratings?.needsDiscovery) || 0,
              objectionHandling: Number(pitch.ratings?.objectionHandling) || 0,
              clarity: Number(pitch.ratings?.clarity) || 0,
              closing: Number(pitch.ratings?.closing) || 0,
            },
            strengths: Array.isArray(pitch.strengths) ? pitch.strengths.map(String) : [],
            missedOpportunities: Array.isArray(pitch.missedOpportunities)
              ? pitch.missedOpportunities
                  .filter((m: any) => m && m.suggestion)
                  .map((m: any) => ({
                    seconds: Math.max(0, Number(m.seconds) || 0),
                    timestamp: String(m.timestamp || ''),
                    whatHappened: String(m.whatHappened || ''),
                    suggestion: String(m.suggestion),
                  }))
              : [],
          }
        : undefined,
    conversionTimeline: Array.isArray(extracted.conversionTimeline)
      ? extracted.conversionTimeline
          .filter((p: any) => p && typeof p.seconds === 'number' && typeof p.score === 'number')
          .map((p: any) => ({
            seconds: Math.max(0, p.seconds),
            timestamp: String(p.timestamp || ''),
            score: Math.max(0, Math.min(100, Math.round(p.score))),
            reason: String(p.reason || ''),
          }))
          .sort((a: any, b: any) => a.seconds - b.seconds)
      : undefined,
    conversionBarriers: extracted.conversionBarriers || undefined,
    patientGoal: extracted.patientGoal || undefined,
    procedureDiscussed: extracted.procedureDiscussed || undefined,
    patientHesitation: extracted.patientHesitation || undefined,
    decisionsMade: extracted.decisionsMade || undefined,
    agreedNextSteps: extracted.agreedNextSteps || undefined,
    transcript: extracted.transcript || [],
    summary: extracted.summary || {
      executiveSummary: '',
      keyTopics: [],
      highlights: [],
      challenges: [],
      outcomes: [],
      quickBulletOverview: [],
    },
    tasks: (extracted.tasks || []).map((t: any, idx: number) => ({
      ...t,
      // Model-supplied ids ("task-1") repeat across recordings, so always namespace them
      id: `${recordingId}-task-${idx + 1}`,
      status: t.status || 'Pending',
      dueDateISO: /^\d{4}-\d{2}-\d{2}$/.test(t.dueDateISO || '') ? t.dueDateISO : undefined,
      isExplicitDeadline: Boolean(t.isExplicitDeadline),
      recordingId,
      recordingTitle: context.filename,
      clientId,
    })),
    plan: extracted.plan || {
      objective: '',
      phases: [],
      recommendedNextSteps: [],
      dependenciesAndBlockers: [],
      timelineDetails: [],
      risksAndQuestions: [],
    },
    decisions: (extracted.decisions || []).map((d: any, idx: number) => ({
      ...d,
      id: `${recordingId}-dec-${idx + 1}`,
      status: d.status || 'confirmed',
    })),
  };
}
