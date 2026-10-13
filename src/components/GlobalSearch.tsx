import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ClientLead, MeetingRecording } from '../types/meeting';
import { Avatar, Card, muted, SearchInput } from './ui';

interface GlobalSearchProps {
  recordings: MeetingRecording[];
  clients: ClientLead[];
  onOpenRecording: (recordingId: string, transcriptQuery?: string) => void;
  onOpenPatient: (patientId: string) => void;
}

interface Result {
  key: string;
  group: 'Patients' | 'Recordings' | 'In transcripts';
  title: string;
  subtitle: string;
  avatarName?: string;
  run: () => void;
}

const snippetAround = (text: string, query: string) => {
  const at = text.toLowerCase().indexOf(query);
  const start = Math.max(0, at - 30);
  const end = Math.min(text.length, at + query.length + 50);
  return (start > 0 ? '…' : '') + text.slice(start, end).trim() + (end < text.length ? '…' : '');
};

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ recordings, clients, onOpenRecording, onOpenPatient }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // "/" or Ctrl/Cmd+K focuses the search from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable;
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, []);

  const results = useMemo<Result[]>(() => {
    const q = query.toLowerCase().trim();
    if (q.length < 2) return [];

    const patients: Result[] = clients
      .filter((c) =>
        [c.name, c.condition, c.procedureName, c.phone, c.email].some((v) => v && v.toLowerCase().includes(q))
      )
      .slice(0, 4)
      .map((c) => ({
        key: `p-${c.id}`,
        group: 'Patients',
        title: c.name,
        subtitle: c.procedureName,
        avatarName: c.name,
        run: () => onOpenPatient(c.id),
      }));

    const recs: Result[] = recordings
      .filter((r) => [r.title, r.clientName, r.salespersonName].some((v) => v && v.toLowerCase().includes(q)))
      .slice(0, 4)
      .map((r) => ({
        key: `r-${r.id}`,
        group: 'Recordings',
        title: r.title,
        subtitle: r.clientName || 'Not linked',
        run: () => onOpenRecording(r.id),
      }));

    const transcripts: Result[] = [];
    if (q.length >= 3) {
      for (const r of recordings) {
        const hit = r.transcript.find(
          (s) => s.text.toLowerCase().includes(q) || (s.translatedText && s.translatedText.toLowerCase().includes(q))
        );
        if (!hit) continue;
        const source = hit.text.toLowerCase().includes(q) ? hit.text : hit.translatedText!;
        transcripts.push({
          key: `t-${r.id}`,
          group: 'In transcripts',
          title: snippetAround(source, q),
          subtitle: `${r.title} · ${hit.timestamp}`,
          run: () => onOpenRecording(r.id, query.trim()),
        });
        if (transcripts.length === 5) break;
      }
    }

    return [...patients, ...recs, ...transcripts];
  }, [query, recordings, clients, onOpenRecording, onOpenPatient]);

  const choose = (result: Result) => {
    result.run();
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const showPanel = isOpen && query.trim().length >= 2;

  return (
    <div ref={rootRef} className="relative flex-1 min-w-0 max-w-md">
      <SearchInput
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setIsOpen(false);
            inputRef.current?.blur();
          }
          if (e.key === 'Enter' && results[0]) choose(results[0]);
        }}
        placeholder="Search patients, recordings, transcripts"
        aria-label="Search everything"
        className="sm:pr-10"
        wrapperClassName=""
        trailing={
          <kbd className="hidden sm:block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-[11px] text-gray-400">
            /
          </kbd>
        }
      />

      {showPanel && (
        <Card className="absolute left-0 right-0 top-full mt-1.5 z-40 shadow-xl max-h-[70vh] overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <p className={`${muted} px-4 py-3`}>No results.</p>
          ) : (
            results.map((result, i) => (
              <React.Fragment key={result.key}>
                {(i === 0 || results[i - 1].group !== result.group) && (
                  <div className={`${muted} font-medium px-4 pt-2 pb-1`}>{result.group}</div>
                )}
                <button
                  onClick={() => choose(result)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
                >
                  {result.avatarName && <Avatar name={result.avatarName} />}
                  <span className="min-w-0">
                    <span className="block text-sm text-gray-900 dark:text-gray-100 truncate">{result.title}</span>
                    <span className={`${muted} block truncate`}>{result.subtitle}</span>
                  </span>
                </button>
              </React.Fragment>
            ))
          )}
        </Card>
      )}
    </div>
  );
};
