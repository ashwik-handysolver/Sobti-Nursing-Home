import { GoogleGenAI, FileState, createPartFromUri } from '@google/genai';
import type { IncomingMessage, ServerResponse } from 'http';

const MODEL = 'gemini-3.8-flash';

// A key sent from the app's Settings takes priority over the server's own
function resolveApiKey(req: IncomingMessage): { key?: string; source: 'user' | 'server' | 'none' } {
  const header = req.headers['x-gemini-api-key'];
  const userKey = (Array.isArray(header) ? header[0] : header)?.trim();
  if (userKey) return { key: userKey, source: 'user' };
  const serverKey = process.env.GEMINI_API_KEY?.trim();
  return serverKey ? { key: serverKey, source: 'server' } : { source: 'none' };
}

const NO_KEY_MESSAGE = 'No Gemini API key is set. Add your key in Settings.';

// Gemini reports a bad key as a long JSON blob; turn it into one clear sentence
function describeGeminiError(err: any, fallback: string): string {
  const message = String(err?.message || '');
  if (/API key not valid|API_KEY_INVALID|PERMISSION_DENIED|UNAUTHENTICATED/i.test(message)) {
    return 'The Gemini API key was rejected. Check the key in Settings.';
  }
  if (/RESOURCE_EXHAUSTED|quota/i.test(message)) {
    return 'The Gemini API key has run out of quota. Check your plan and billing with Google.';
  }
  if (/NOT_FOUND|is not found|not supported/i.test(message)) {
    return `The model "${MODEL}" is not available for this API key.`;
  }
  return message || fallback;
}

function getAIClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Client accepts audio files up to 45MB; base64 encoding inflates that by ~4/3
const MAX_AUDIO_BYTES = 45 * 1024 * 1024;
const MAX_BODY_BYTES = Math.ceil((MAX_AUDIO_BYTES * 4) / 3) + 1024 * 1024;
// Gemini caps inline request payloads at ~20MB, so larger audio goes through the Files API
const INLINE_AUDIO_LIMIT_BYTES = 12 * 1024 * 1024;

// Helper to parse JSON body with large payload support
function readJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalSize = 0;
    const MAX_SIZE = MAX_BODY_BYTES;

    req.on('data', (chunk) => {
      totalSize += chunk.length;
      if (totalSize > MAX_SIZE) {
        reject(new Error('Audio file exceeds the maximum supported size of 45MB.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        if (!raw) {
          resolve({});
          return;
        }
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error('Invalid JSON payload in request body'));
      }
    });

    req.on('error', (err) => reject(err));
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(data));
}

// Uploads large audio through the Gemini Files API and waits until it is ready to use
async function uploadAudioFile(ai: GoogleGenAI, audio: Buffer, mimeType: string) {
  let file = await ai.files.upload({
    file: new Blob([new Uint8Array(audio)], { type: mimeType }),
    config: { mimeType },
  });

  const deadline = Date.now() + 120_000;
  while (file.state === FileState.PROCESSING) {
    if (Date.now() > deadline) {
      throw new Error('Timed out waiting for Gemini to process the uploaded audio file.');
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    file = await ai.files.get({ name: file.name! });
  }

  if (file.state === FileState.FAILED || !file.uri) {
    throw new Error('Gemini could not process the uploaded audio file.');
  }
  return file;
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url?.split('?')[0] || '';

  // Health check
  if (url === '/api/health' && req.method === 'GET') {
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5);
    sendJson(res, 200, {
      status: 'ok',
      hasGeminiKey: hasKey,
      model: MODEL,
      version: '1.0.0',
    });
    return true;
  }

  // Check that a key works, without analyzing anything
  if (url === '/api/test-key' && req.method === 'POST') {
    const { key, source } = resolveApiKey(req);
    if (!key) {
      sendJson(res, 400, { ok: false, error: NO_KEY_MESSAGE });
      return true;
    }
    try {
      await getAIClient(key).models.get({ model: MODEL });
      sendJson(res, 200, { ok: true, source, model: MODEL });
    } catch (err: any) {
      sendJson(res, 400, { ok: false, source, error: describeGeminiError(err, 'The key could not be verified.') });
    }
    return true;
  }

  // Process Audio
  if (url === '/api/process-audio' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const { audioBase64, mimeType, filename, languagePreference } = body;

      if (!audioBase64 || !mimeType) {
        sendJson(res, 400, {
          error: 'Missing required audio data (audioBase64 and mimeType are required).',
        });
        return true;
      }

      const { key: apiKey } = resolveApiKey(req);
      if (!apiKey) {
        sendJson(res, 400, { error: NO_KEY_MESSAGE });
        return true;
      }

      const ai = getAIClient(apiKey);

      const langPrompt =
        languagePreference === 'hi'
          ? 'Language preference is Hindi. Transcribe Hindi speech accurately in Devanagari script, preserving any English technical terms in Latin script.'
          : languagePreference === 'en'
          ? 'Language preference is English.'
          : 'Language preference is Automatic detection. Accurately detect if speakers speak English, Hindi, or a mix of Hindi and English (Hinglish). Transcribe pure Hindi phrases in Devanagari script, while keeping English technical terms, brand names, and English clauses in English. Do not force everything into pure English.';

      const systemInstruction = `You are MeetMind AI, an elite multilingual audio meeting intelligence engine.
Your task is to transcribe audio recordings and extract structured executive insights.
Supported languages: English, Hindi, and Hinglish (conversations where speakers switch between Hindi and English within the same sentence).

CRITICAL RULES:
1. TRANSCRIPT ACCURACY:
- Transcribe verbatim what was spoken.
- If a sentence is spoken in Hindi or Hinglish, preserve the spoken language! Do not translate the entire transcript into English unless explicitly told. Use Devanagari script for Hindi words and standard Latin alphabet for English technical terms, metrics, and acronyms.
- Identify distinct speakers (e.g., "Speaker 1", "Speaker 2", or actual names if stated in audio).
- Provide accurate relative timestamps (e.g., "00:00", "00:15", "01:30") and approximate startSeconds number.
- If a word or name is muffled or uncertain, mark it clearly with "[unclear]" and set isUnclear: true rather than inventing content.

2. SUMMARY:
- Executive summary of the meeting.
- Key discussion topics with concise summaries and bullet points.
- Highlights, challenges faced, and outcomes.
- Concise bullet-point overview for fast skimming.
- Avoid unsupported conclusions.

3. TASKS & ACTION ITEMS:
- Extract ONLY tasks explicitly or strongly implied by the conversation.
- If no owner is mentioned, assign "Unassigned".
- If no deadline is stated, set dueDate to "Not specified" and set isExplicitDeadline to false.
- If a deadline WAS explicitly mentioned (e.g. "by Thursday", "October 24th"), set dueDate and set isExplicitDeadline to true.
- Whenever the deadline can be resolved to a calendar date, also set dueDateISO in YYYY-MM-DD format, counting relative dates ("tomorrow", "Thursday", "in 3 weeks") from today's date given in the prompt. Use null for recurring or open-ended deadlines.
- Assign justified priority ("High", "Medium", "Low") based on urgency discussed.
- Set status to "Pending" by default.
- Include sourceRef pointing to the speaker or timestamp where the task was discussed.

4. PLANNING & EXECUTION:
- Overarching meeting objective.
- Phases or milestones with key deliverables.
- Recommended next steps with owners and suggested target dates.
- Dependencies and blockers.
- Timeline items: MUST clearly distinguish between dateType "stated" (explicitly mentioned in the audio) vs dateType "ai-suggested" (recommended by AI). Never claim suggested dates were agreed upon!
- Risks and unresolved questions.

4b. CONVERSION TIMELINE:
- Track how likely the patient is to go ahead as the conversation unfolds, on the same 0-100 scale as estimatedConversionChance.
- Give 4 to 12 points in time order: the first at the start of the conversation, then one at each moment the likelihood clearly rose or fell, and the last one equal to estimatedConversionChance.
- Each point needs the timestamp and seconds of the transcript line that caused the change, and a reason of at most 15 words grounded in what was said. Do not invent swings the audio does not support.

4c. SALES PITCH REVIEW:
- Review how the salesperson, counselor or doctor handled the conversation, as constructive coaching.
- overallScore is 0-100. Rate rapport, needsDiscovery, objectionHandling, clarity and closing from 1 (poor) to 5 (excellent).
- summary: two sentences on the overall pitch, covering what carried it and what held it back.
- strengths: 2 to 4 specific things that were done well, each grounded in what was said.
- missedOpportunities: 1 to 5 moments where a different response would likely have raised the chance of conversion. For each give the timestamp and seconds of the transcript line, whatHappened (what was said or left unaddressed), and suggestion (the words the salesperson could have used instead, written as a direct quote in the language of the conversation).
- Suggestions must be honest and patient-first: never propose pressure tactics, false urgency, or medical claims the conversation does not support.

5. KEY DECISIONS:
- List confirmed decisions reached during the meeting.
- Distinguish confirmed decisions from mere proposals or ideas (status: "confirmed" vs "proposal_suggestion").
- Note context, expected impact, and any pending approvals.

Output MUST be strictly valid JSON matching the requested schema. No markdown wrapping outside the JSON.`;

      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const promptText = `${langPrompt}
Today's date: ${today} (${now.toLocaleDateString('en-US', { weekday: 'long' })})
File name: "${filename || 'meeting-audio'}"

Analyze this audio file thoroughly and produce the complete JSON structure:
{
  "detectedLanguage": "string (e.g. English, Hindi, or Hinglish - Hindi & English bilingual)",
  "transcript": [
    {
      "id": "t1",
      "speaker": "Speaker 1 / Name",
      "timestamp": "00:00",
      "startSeconds": 0,
      "text": "Exact verbatim text",
      "isUnclear": false
    }
  ],
  "summary": {
    "executiveSummary": "Concise high-level summary",
    "keyTopics": [
      {
        "title": "Topic title",
        "summary": "Short explanation",
        "bullets": ["Bullet 1", "Bullet 2"]
      }
    ],
    "highlights": ["Key highlight 1"],
    "challenges": ["Key challenge 1"],
    "outcomes": ["Key outcome 1"],
    "quickBulletOverview": ["Overview point 1", "Overview point 2"]
  },
  "tasks": [
    {
      "id": "task-1",
      "description": "Task action item",
      "owner": "Person name or Unassigned",
      "priority": "High" | "Medium" | "Low",
      "dueDate": "Stated date or Not specified",
      "dueDateISO": "YYYY-MM-DD or null",
      "isExplicitDeadline": boolean,
      "status": "Pending",
      "sourceRef": "Speaker 1 at 00:15"
    }
  ],
  "plan": {
    "objective": "Primary goal",
    "phases": [
      {
        "phaseName": "Phase 1: Setup",
        "durationOrPeriod": "Week 1",
        "milestones": ["Milestone 1"],
        "keyDeliverables": ["Deliverable 1"]
      }
    ],
    "recommendedNextSteps": [
      {
        "step": "Next step description",
        "owner": "Owner or Unassigned",
        "suggestedDate": "Date or AI Recommended",
        "isExplicitDate": boolean
      }
    ],
    "dependenciesAndBlockers": ["Dependency 1"],
    "timelineDetails": [
      {
        "item": "Milestone / Deliverable",
        "date": "Date string",
        "dateType": "stated" | "ai-suggested",
        "context": "Why this date or how derived"
      }
    ],
    "risksAndQuestions": ["Risk 1"]
  },
  "decisions": [
    {
      "id": "dec-1",
      "decision": "Decision summary",
      "context": "Context and background",
      "status": "confirmed" | "proposal_suggestion",
      "impact": "Clinical or surgical impact",
      "pendingApprovals": []
    }
  ],
  "consultationType": "e.g. Cataract Evaluation, LASIK Refractive Consult, Glaucoma Review, Retina Check, Routine Eye Care",
  "patientName": "Extracted patient name if mentioned, or empty string",
  "salespersonName": "Extracted salesperson or clinic counselor or doctor who led the conversation",
  "estimatedConversionChance": 85,
  "pitchAnalysis": {
    "overallScore": 75,
    "summary": "Two sentences on the overall pitch",
    "ratings": { "rapport": 4, "needsDiscovery": 3, "objectionHandling": 3, "clarity": 4, "closing": 3 },
    "strengths": ["Specific thing done well"],
    "missedOpportunities": [
      { "timestamp": "01:16", "seconds": 76, "whatHappened": "What was said or left unaddressed", "suggestion": "What the salesperson could have said instead" }
    ]
  },
  "conversionTimeline": [
    { "timestamp": "00:00", "seconds": 0, "score": 55, "reason": "What was said that set or moved the likelihood" }
  ],
  "conversionFactors": {
    "positive": ["Strong patient motivation for clear vision", "Clear financing/EMI options provided"],
    "negative": ["Concern over 15-day water avoidance", "Waiting for TPA insurance pre-authorization"]
  },
  "conversionBarriers": [
    {
      "id": "b-1",
      "category": "Price / Affordability" | "Procedure Hesitation" | "Information Request" | "Unanswered Questions" | "Timing / Availability" | "Unclear Next Step",
      "description": "Specific barrier explained clearly",
      "supportingExcerpt": "Exact or near-exact quote from conversation showing this barrier",
      "isExplicit": true
    }
  ],
  "patientGoal": "Why the patient contacted the clinic or visited",
  "procedureDiscussed": "Name and details of procedure or service discussed",
  "patientHesitation": "Key hesitation, fear, or unanswered questions expressed by patient",
  "decisionsMade": ["Agreed decisions"],
  "agreedNextSteps": ["Clear next steps agreed during discussion"],
  "conversionIssues": ["Primary issue or hesitation mentioned in dialogue, e.g. Insurance cashless TPA approval", "Downtime fear"],
  "conversionNextStep": "Clear concrete follow-up step for sales counselor or ophthalmology coordinator"
}`;

      const audioBuffer = Buffer.from(audioBase64, 'base64');
      if (audioBuffer.length > MAX_AUDIO_BYTES) {
        sendJson(res, 413, {
          error: 'Audio file exceeds the maximum supported size of 45MB.',
        });
        return true;
      }

      let uploadedFileName: string | undefined;
      let audioPart;
      if (audioBuffer.length > INLINE_AUDIO_LIMIT_BYTES) {
        const file = await uploadAudioFile(ai, audioBuffer, mimeType);
        uploadedFileName = file.name;
        audioPart = createPartFromUri(file.uri!, file.mimeType || mimeType);
      } else {
        audioPart = {
          inlineData: {
            mimeType,
            data: audioBase64,
          },
        };
      }

      let response;
      try {
        response = await ai.models.generateContent({
          model: MODEL,
          contents: {
            parts: [audioPart, { text: promptText }],
          },
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });
      } finally {
        if (uploadedFileName) {
          ai.files.delete({ name: uploadedFileName }).catch((e) => {
            console.warn('Failed to delete uploaded audio from Gemini Files:', e);
          });
        }
      }

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini model returned an empty response. Audio may be silent or corrupted.');
      }

      let parsedData: any;
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseError) {
        // Fallback cleanup if model included codeblocks
        const cleaned = responseText.replace(/```json\n?|```/g, '').trim();
        parsedData = JSON.parse(cleaned);
      }

      sendJson(res, 200, {
        success: true,
        data: parsedData,
      });
      return true;
    } catch (err: any) {
      console.error('Error in /api/process-audio:', err);
      sendJson(res, 500, {
        error: describeGeminiError(err, 'Failed to process audio recording with Gemini.'),
      });
      return true;
    }
  }

  if (url.startsWith('/api/')) {
    sendJson(res, 404, { error: `Unknown API route: ${req.method} ${url}` });
    return true;
  }

  return false;
}
