import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX } from 'lucide-react';
import { Card, IconButton } from './ui';

interface AudioPlayerProps {
  audioUrl?: string;
  duration: number; // total duration in seconds
  currentTime: number;
  onTimeUpdate: (time: number) => void;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, duration, currentTime, onTimeUpdate }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [loadedDuration, setLoadedDuration] = useState(0);

  // Sync external currentTime changes (e.g. clicking a transcript timestamp)
  useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 0.75 && !isDragging) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime, isDragging]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const effectiveDuration = duration > 0 ? duration : loadedDuration > 0 ? loadedDuration : 60;

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    if (audio.paused) {
      audio.play().catch((e) => {
        console.warn('Audio play error:', e);
      });
    } else {
      audio.pause();
    }
  };

  const skipSeconds = (seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(effectiveDuration, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = newTime;
    onTimeUpdate(newTime);
  };

  // Keyboard: Space plays/pauses, arrow keys skip 10 seconds
  const shortcutsRef = useRef({ togglePlay, skipSeconds });
  shortcutsRef.current = { togglePlay, skipSeconds };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName) || target.isContentEditable) return;
      if (e.key === ' ') {
        e.preventDefault();
        shortcutsRef.current.togglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        shortcutsRef.current.skipSeconds(-10);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        shortcutsRef.current.skipSeconds(10);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onTimeUpdate(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const cycleSpeed = () => {
    setPlaybackRate(SPEEDS[(SPEEDS.indexOf(playbackRate) + 1) % SPEEDS.length]);
  };

  return (
    <Card className="px-3 py-2.5 flex items-center gap-2 sm:gap-3 shadow-sm">
      <audio
        ref={audioRef}
        src={audioUrl}
        muted={isMuted}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (isFinite(d)) setLoadedDuration(d);
        }}
        onTimeUpdate={() => {
          if (audioRef.current && !isDragging) onTimeUpdate(audioRef.current.currentTime);
        }}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      <IconButton
        onClick={() => skipSeconds(-10)}
        className="hidden sm:block"
        title="Back 10 seconds (←)"
        aria-label="Back 10 seconds"
      >
        <RotateCcw className="w-4 h-4" />
      </IconButton>

      <button
        onClick={togglePlay}
        disabled={!audioUrl}
        className="w-9 h-9 shrink-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        title={!audioUrl ? 'Audio not available' : isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <IconButton
        onClick={() => skipSeconds(10)}
        className="hidden sm:block"
        title="Forward 10 seconds (→)"
        aria-label="Forward 10 seconds"
      >
        <RotateCw className="w-4 h-4" />
      </IconButton>

      <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">{formatTime(currentTime)}</span>
      <input
        type="range"
        min="0"
        max={effectiveDuration}
        step="0.5"
        value={Math.min(currentTime, effectiveDuration)}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
        onChange={handleSeek}
        aria-label="Audio progress"
        className="flex-1 min-w-0 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">{formatTime(effectiveDuration)}</span>

      <button
        onClick={cycleSpeed}
        className="px-2 py-1 text-xs font-medium tabular-nums rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        title="Playback speed"
      >
        {playbackRate}x
      </button>

      <IconButton
        onClick={() => setIsMuted(!isMuted)}
        title={isMuted ? 'Unmute' : 'Mute'}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </IconButton>
    </Card>
  );
};
