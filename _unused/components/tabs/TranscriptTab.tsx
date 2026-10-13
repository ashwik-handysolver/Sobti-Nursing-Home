import React, { useState, useMemo } from 'react';
import { Search, Copy, Check, Download, Globe2, AlertTriangle, Play } from 'lucide-react';
import { TranscriptSegment } from '../../types/meeting';

interface TranscriptTabProps {
  transcript: TranscriptSegment[];
  onSeek: (seconds: number) => void;
  currentPlaybackTime: number;
}

export const TranscriptTab: React.FC<TranscriptTabProps> = ({
  transcript,
  onSeek,
  currentPlaybackTime,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLanguage, setViewLanguage] = useState<'original' | 'en' | 'hi'>('original');
  const [copied, setCopied] = useState(false);

  // Filter segments based on search
  const filteredSegments = useMemo(() => {
    if (!searchQuery.trim()) return transcript;
    const q = searchQuery.toLowerCase();
    return transcript.filter(
      (s) =>
        s.text.toLowerCase().includes(q) ||
        s.speaker.toLowerCase().includes(q) ||
        (s.translatedText && s.translatedText.toLowerCase().includes(q))
    );
  }, [transcript, searchQuery]);

  const copyEntireTranscript = () => {
    const text = transcript
      .map((s) => {
        const content =
          viewLanguage === 'en' && s.translatedText
            ? s.translatedText
            : s.text;
        return `[${s.timestamp}] ${s.speaker}:\n${content}`;
      })
      .join('\n\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadTranscriptTxt = () => {
    const text = transcript
      .map((s) => {
        const content =
          viewLanguage === 'en' && s.translatedText
            ? s.translatedText
            : s.text;
        return `[${s.timestamp}] ${s.speaker}:\n${content}`;
      })
      .join('\n\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meeting_transcript_${viewLanguage}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Highlight search matches
  const renderHighlightedText = (text: string) => {
    if (!searchQuery.trim()) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark
          key={i}
          className="bg-amber-200 dark:bg-amber-800 text-slate-900 dark:text-slate-100 rounded-xs px-0.5"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Determine avatar background color from speaker name
  const getSpeakerColor = (speaker: string) => {
    const colors = [
      'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    ];
    let hash = 0;
    for (let i = 0; i < speaker.length; i++) hash += speaker.charCodeAt(i);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search words, names, speakers, or topics..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
          {searchQuery && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-400">
              {filteredSegments.length} matches
            </span>
          )}
        </div>

        {/* Translation Switcher & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Language toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
            <Globe2 className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1" />
            <button
              onClick={() => setViewLanguage('original')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewLanguage === 'original'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Spoken (Original)
            </button>
            <button
              onClick={() => setViewLanguage('en')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewLanguage === 'en'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              English
            </button>
          </div>

          <button
            onClick={copyEntireTranscript}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={downloadTranscriptTxt}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Download TXT file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>TXT</span>
          </button>
        </div>
      </div>


      {/* Transcript Segments List */}
      <div className="space-y-3">
        {filteredSegments.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No matching transcript text found
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Try a different keyword or reset search query.
            </p>
          </div>
        ) : (
          filteredSegments.map((segment) => {
            const isCurrentlyPlaying =
              currentPlaybackTime >= segment.startSeconds &&
              currentPlaybackTime < segment.startSeconds + 12;

            const speakerColor = getSpeakerColor(segment.speaker);
            const displayText =
              viewLanguage === 'en' && segment.translatedText
                ? segment.translatedText
                : segment.text;

            return (
              <div
                key={segment.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCurrentlyPlaying
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${speakerColor}`}
                    >
                      {segment.speaker}
                    </span>

                    {/* Timestamp seek button */}
                    <button
                      onClick={() => onSeek(segment.startSeconds)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-950 hover:text-indigo-600 text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 transition-colors cursor-pointer group"
                      title="Jump audio player to this timestamp"
                    >
                      <Play className="w-2.5 h-2.5 fill-current opacity-60 group-hover:opacity-100 text-indigo-600" />
                      <span>{segment.timestamp}</span>
                    </button>
                  </div>

                  {segment.isUnclear && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/60">
                      <AlertTriangle className="w-3 h-3" />
                      Unclear speech marked
                    </span>
                  )}
                </div>

                <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-normal">
                  {renderHighlightedText(displayText)}
                </p>

                {/* If translated view and original has Devanagari, optionally show original toggle */}
                {viewLanguage === 'en' && segment.translatedText && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-400 italic">
                    Original: {segment.text}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
