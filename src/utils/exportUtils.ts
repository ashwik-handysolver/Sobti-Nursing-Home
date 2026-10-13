import { MeetingRecording } from '../types/meeting';

export function exportMeetingAsTxt(recording: MeetingRecording): void {
  const content = `=====================================================
MEETMIND AI - MEETING INTELLIGENCE REPORT
=====================================================
Title: ${recording.title}
Filename: ${recording.filename}
Date: ${recording.uploadDate}
Duration: ${recording.durationFormatted}
Detected Language: ${recording.detectedLanguage}
=====================================================

--- EXECUTIVE SUMMARY ---
${recording.summary.executiveSummary}

--- KEY TOPICS ---
${recording.summary.keyTopics
  .map(
    (t, idx) =>
      `${idx + 1}. ${t.title}\n   Summary: ${t.summary}\n   Points:\n${t.bullets
        .map((b) => `   - ${b}`)
        .join('\n')}`
  )
  .join('\n\n')}

--- ACTION ITEMS & TASKS ---
${recording.tasks
  .map(
    (task, idx) =>
      `[${task.status.toUpperCase()}] ${idx + 1}. ${task.description}\n   Owner: ${
        task.owner
      } | Priority: ${task.priority} | Due Date: ${task.dueDate} (${
        task.isExplicitDeadline ? 'Stated in Audio' : 'AI Suggested/Unspecified'
      })\n   Source: ${task.sourceRef || 'N/A'}`
  )
  .join('\n\n')}

${hasPlan(recording) ? txtPlan(recording) : ''}${recording.decisions?.length ? txtDecisions(recording) : ''}--- FULL TRANSCRIPT ---
${recording.transcript
  .map((seg) => `[${seg.timestamp}] ${seg.speaker}:\n${seg.text}`)
  .join('\n\n')}
`;

  downloadFile(`${sanitizeFilename(recording.title)}_Report.txt`, content, 'text/plain;charset=utf-8');
}

export function exportMeetingAsMarkdown(recording: MeetingRecording): void {
  const content = `# MeetMind AI Meeting Report: ${recording.title}

- **Date:** ${recording.uploadDate}
- **Audio File:** \`${recording.filename}\` (${recording.fileSizeFormatted}, ${recording.durationFormatted})
- **Detected Language:** ${recording.detectedLanguage}

---

## Executive Summary
${recording.summary.executiveSummary}

### Quick Skim Highlights
${recording.summary.quickBulletOverview.map((b) => `- ${b}`).join('\n')}

### Topics Discussed
${recording.summary.keyTopics
  .map(
    (topic) => `#### ${topic.title}
${topic.summary}

${topic.bullets.map((b) => `- ${b}`).join('\n')}`
  )
  .join('\n\n')}

---

## Action Items & Tasks

| # | Task | Owner | Priority | Due Date | Deadline Type | Status | Source |
|---|------|-------|----------|----------|---------------|--------|--------|
${recording.tasks
  .map(
    (t, idx) =>
      `| ${idx + 1} | ${t.description} | **${t.owner}** | ${t.priority} | ${
        t.dueDate
      } | ${t.isExplicitDeadline ? 'Explicit' : 'Suggested'} | \`${t.status}\` | ${
        t.sourceRef || 'N/A'
      } |`
  )
  .join('\n')}

---

${hasPlan(recording) ? mdPlan(recording) : ''}${recording.decisions?.length ? mdDecisions(recording) : ''}## Verbatim Transcript

${recording.transcript
  .map(
    (s) => `> **[${s.timestamp}] ${s.speaker}**:  
> ${s.text}`
  )
  .join('\n\n')}
`;

  downloadFile(`${sanitizeFilename(recording.title)}_Report.md`, content, 'text/markdown;charset=utf-8');
}

// Recordings analyzed before the analysis was narrowed to consultations also carry a plan and a
// decisions list. They are exported when present and left out otherwise.
const hasPlan = (recording: MeetingRecording) =>
  Boolean(recording.plan && (recording.plan.objective || recording.plan.phases?.length || recording.plan.timelineDetails?.length));

const txtPlan = (recording: MeetingRecording) => `--- EXECUTION PLAN & TIMELINE ---
Objective: ${recording.plan.objective}

Phases:
${recording.plan.phases
  .map(
    (p) =>
      `* ${p.phaseName} (${p.durationOrPeriod})\n  Milestones: ${p.milestones.join(
        ', '
      )}\n  Deliverables: ${p.keyDeliverables.join(', ')}`
  )
  .join('\n')}

Timeline Details:
${recording.plan.timelineDetails
  .map(
    (t) =>
      `- ${t.item}: ${t.date} [${t.dateType === 'stated' ? 'EXPLICIT DEADLINE' : 'AI SUGGESTED'}] - ${
        t.context
      }`
  )
  .join('\n')}

`;

const txtDecisions = (recording: MeetingRecording) => `--- KEY DECISIONS ---
${recording.decisions
  .map(
    (d, idx) =>
      `${idx + 1}. [${d.status.toUpperCase()}] ${d.decision}\n   Context: ${
        d.context
      }\n   Impact: ${d.impact}${
        d.pendingApprovals?.length
          ? `\n   Pending Approvals: ${d.pendingApprovals.join(', ')}`
          : ''
      }`
  )
  .join('\n\n')}

`;

const mdPlan = (recording: MeetingRecording) => `## Execution Plan
**Objective:** ${recording.plan.objective}

### Phases & Milestones
${recording.plan.phases
  .map(
    (p) => `### ${p.phaseName} (${p.durationOrPeriod})
- **Milestones:** ${p.milestones.join('; ')}
- **Deliverables:** ${p.keyDeliverables.join('; ')}`
  )
  .join('\n\n')}

### Timeline Verification
${recording.plan.timelineDetails
  .map(
    (t) =>
      `- **${t.item}**: \`${t.date}\` (${
        t.dateType === 'stated' ? '🔒 Stated in audio' : '💡 AI Suggested'
      }) - *${t.context}*`
  )
  .join('\n')}

### Risks & Unresolved Questions
${recording.plan.risksAndQuestions.map((r) => `- ⚠️ ${r}`).join('\n')}

---

`;

const mdDecisions = (recording: MeetingRecording) => `## Key Decisions

${recording.decisions
  .map(
    (d) => `### ${d.status === 'confirmed' ? '✅ Confirmed' : '📝 Proposal'}: ${d.decision}
- **Context:** ${d.context}
- **Impact:** ${d.impact}
${d.pendingApprovals?.length ? `- **Pending Approvals:** ${d.pendingApprovals.join(', ')}` : ''}`
  )
  .join('\n\n')}

---

`;

export function exportMeetingAsJson(recording: MeetingRecording): void {
  const jsonStr = JSON.stringify(recording, null, 2);
  downloadFile(`${sanitizeFilename(recording.title)}_Data.json`, jsonStr, 'application/json');
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
