import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileAudio, AlertCircle, X, Mic, MicOff, Square, Sparkles, Loader2 } from 'lucide-react';
import { ClientLead, LanguageMode, MeetingRecording, ProcessingStage } from '../types/meeting';
import { saveRecordingAudio } from '../utils/audioStore';
import { buildAnalysisFields, requestAnalysis } from '../utils/analyzeRecording';
import { Avatar, Button, IconButton, muted, SegmentedControl } from './ui';

interface AudioUploadZoneProps {
  mode?: 'upload' | 'record'; // upload a file, or record with the microphone
  onProcessingSuccess: (recording: MeetingRecording) => void;
  clients?: ClientLead[];
  defaultLanguage?: LanguageMode;
  preSelectedClient?: ClientLead | null;
  onClearPreSelectedClient?: () => void;
}

const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.webm', '.ogg', '.aac', '.flac'];
const MAX_FILE_SIZE_BYTES = 45 * 1024 * 1024; // 45MB max

const LANGUAGE_OPTIONS: { id: LanguageMode; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिंदी' },
];

const STAGE_LABELS: Partial<Record<ProcessingStage, string>> = {
  uploading: 'Uploading…',
  transcribing: 'Transcribing…',
  analyzing: 'Analyzing…',
  generating: 'Finishing up…',
  completed: 'Done',
};

export const AudioUploadZone: React.FC<AudioUploadZoneProps> = ({
  onProcessingSuccess,
  clients = [],
  defaultLanguage = 'auto',
  preSelectedClient,
  onClearPreSelectedClient,
  mode = 'upload',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDuration, setFileDuration] = useState<number | null>(null);
  const [languageMode, setLanguageMode] = useState<LanguageMode>(
    defaultLanguage === 'hinglish' ? 'auto' : defaultLanguage
  );
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>(preSelectedClient?.id || '');

  useEffect(() => {
    if (preSelectedClient) {
      setSelectedClientId(preSelectedClient.id);
    }
  }, [preSelectedClient]);

  // Workflow states
  const [stage, setStage] = useState<ProcessingStage>('idle');
  const [progressPercent, setProgressPercent] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const progressTimerRef = useRef<number | null>(null);

  const clearProgressTimer = () => {
    if (progressTimerRef.current !== null) {
      clearTimeout(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  // Audio preview
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);

  // Mic recording state
  const [isRecording, setIsRecording] = useState(false);
  // Where the microphone stands in record mode: not asked yet, asking, allowed, blocked, or missing
  const [micState, setMicState] = useState<'unknown' | 'prompt' | 'requesting' | 'granted' | 'denied' | 'unavailable'>('unknown');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewAudioUrl) {
        URL.revokeObjectURL(previewAudioUrl);
      }
    };
  }, [previewAudioUrl]);

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
      }
      clearProgressTimer();
      // Closing the dialog mid-analysis cancels the request
      abortControllerRef.current?.abort();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const inspectAudioDuration = (file: File) => {
    const tempUrl = URL.createObjectURL(file);
    const audio = new Audio(tempUrl);
    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setFileDuration(Math.round(audio.duration));
      }
      URL.revokeObjectURL(tempUrl);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(tempUrl);
    };
  };

  const validateAndSetFile = (file: File) => {
    setErrorMsg(null);

    if (file.size === 0) {
      setErrorMsg('This file is empty. Choose a different recording.');
      return false;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg(`This file is ${(file.size / (1024 * 1024)).toFixed(1)} MB. The limit is 45 MB.`);
      return false;
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const isMimeAudio = file.type.startsWith('audio/') || file.type.startsWith('video/webm');
    const isExtAllowed = SUPPORTED_EXTENSIONS.includes(ext);

    if (!isMimeAudio && !isExtAllowed) {
      setErrorMsg('Unsupported file type. Use MP3, WAV, M4A, WebM, OGG, AAC or FLAC.');
      return false;
    }

    setSelectedFile(file);
    setFileDuration(null);
    inspectAudioDuration(file);
    setPreviewAudioUrl(URL.createObjectURL(file));
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFileDuration(null);
    setErrorMsg(null);
    setStage('idle');
    setPreviewAudioUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Microphone recording
  const startRecording = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const ext = mimeType.includes('mp4') ? 'm4a' : 'webm';
        const recordedFile = new File([blob], `consultation_${Date.now()}.${ext}`, { type: mimeType });
        validateAndSetFile(recordedFile);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);
      recordTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
      setMicState('granted');
    } catch (err: any) {
      console.error('Microphone error:', err);
      if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') setMicState('denied');
      else if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') setMicState('unavailable');
      else {
        setMicState('prompt');
        setErrorMsg('The microphone could not be started. Check that no other app is using it, then try again.');
      }
    }
  };

  // Clicking the button asks the browser for microphone access; recording starts once it's allowed
  const requestMicrophone = async () => {
    setMicState('requesting');
    await startRecording();
  };

  // In record mode, find out up front whether the browser has already been given access
  useEffect(() => {
    if (mode !== 'record') return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setMicState('unavailable');
      return;
    }
    let status: PermissionStatus | null = null;
    const apply = (state: PermissionState) =>
      setMicState((current) => (current === 'requesting' ? current : state === 'denied' ? 'denied' : state === 'granted' ? 'granted' : 'prompt'));
    navigator.permissions
      ?.query({ name: 'microphone' as PermissionName })
      .then((result) => {
        status = result;
        apply(result.state);
        result.onchange = () => apply(result.state);
      })
      .catch(() => setMicState('prompt'));
    if (!navigator.permissions) setMicState('prompt');
    return () => {
      if (status) status.onchange = null;
    };
  }, [mode]);

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
      }
    }
  };

  const cancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    clearProgressTimer();
    setStage('idle');
    setProgressPercent(0);
  };

  const handleStartProcessing = async () => {
    if (!selectedFile) return;

    // Every recording belongs to a patient
    const matchedClient = clients.find((c) => c.id === selectedClientId);
    if (!matchedClient) {
      setErrorMsg('Open this from a patient so the recording can be linked to them.');
      return;
    }

    setErrorMsg(null);
    setStage('uploading');
    setProgressPercent(15);

    abortControllerRef.current = new AbortController();

    try {
      setStage('transcribing');
      setProgressPercent(40);

      progressTimerRef.current = window.setTimeout(() => {
        setStage('analyzing');
        setProgressPercent(70);
      }, 3500);

      const extracted = await requestAnalysis(selectedFile, {
        filename: selectedFile.name,
        mimeType: selectedFile.type || 'audio/mp3',
        languageMode,
        signal: abortControllerRef.current.signal,
      });

      clearProgressTimer();
      setStage('generating');
      setProgressPercent(95);

      const durationVal = fileDuration || 0;
      const durMin = Math.floor(durationVal / 60);
      const durSec = Math.floor(durationVal % 60);
      const newRecId = `rec-${Date.now()}`;

      const newRecording: MeetingRecording = {
        id: newRecId,
        title: `${matchedClient.name} – ${extracted.consultationType || 'Consultation'}`,
        filename: selectedFile.name,
        uploadDate: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().replace('T', ' ').substring(0, 16),
        duration: durationVal,
        durationFormatted: `${durMin.toString().padStart(2, '0')}:${durSec.toString().padStart(2, '0')}`,
        fileSizeFormatted: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
        languageMode,
        isDemo: false,
        status: 'completed',
        // Separate object URL: the preview URL is revoked when this panel unmounts
        audioUrl: URL.createObjectURL(selectedFile),
        clientId: matchedClient.id,
        clientName: matchedClient.name,
        ...buildAnalysisFields(extracted, {
          recordingId: newRecId,
          languageMode,
          clientId: matchedClient.id,
          filename: selectedFile.name,
        }),
      };

      newRecording.audioPath = await saveRecordingAudio(newRecId, selectedFile);

      setProgressPercent(100);
      setStage('completed');
      setTimeout(() => {
        onProcessingSuccess(newRecording);
      }, 500);
    } catch (err: any) {
      clearProgressTimer();
      if (err.name === 'AbortError') {
        return;
      }
      console.error('Processing error:', err);
      setStage('error');
      setErrorMsg(err.message || 'The recording could not be processed.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isProcessing = stage !== 'idle' && stage !== 'error';

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.m4a,.webm,.ogg,.aac,.flac"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Patient & language */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <span className={`${muted} block mb-1`}>Patient</span>
          <div className="flex items-center gap-2.5 h-[38px]">
            <Avatar name={clients.find((c) => c.id === selectedClientId)?.name} />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {clients.find((c) => c.id === selectedClientId)?.name || 'No patient selected'}
            </span>
          </div>
        </div>

        <div>
          <span className={`${muted} block mb-1`}>Language</span>
          <SegmentedControl<LanguageMode>
            value={languageMode}
            onChange={setLanguageMode}
            options={LANGUAGE_OPTIONS}
            disabled={isProcessing}
          />
        </div>
      </div>

      {!selectedFile && mode === 'upload' ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg px-6 py-10 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/20'
              : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
          }`}
        >
          <UploadCloud className="w-8 h-8 mx-auto mb-3 text-gray-400" />
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Drop an audio file here, or <span className="text-blue-600 dark:text-blue-400">browse</span>
          </p>
          <p className={`${muted} mt-1`}>MP3, WAV, M4A, WebM · up to 45 MB</p>
        </div>
      ) : !selectedFile ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-6 py-8 text-center">
          {isRecording ? (
            <div className="space-y-5" aria-live="polite">
              <div className="flex items-center justify-center gap-2.5">
                <span className="relative flex w-3 h-3">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-rose-500 opacity-75 animate-ping" />
                  <span className="relative inline-flex w-3 h-3 rounded-full bg-rose-600" />
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recording</span>
              </div>
              <p className="text-4xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                {formatSeconds(recordingSeconds)}
              </p>
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
              >
                <Square className="w-4 h-4 fill-current" />
                Stop recording
              </button>
            </div>
          ) : micState === 'denied' ? (
            <div className="space-y-3">
              <span className="mx-auto w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <MicOff className="w-6 h-6" />
              </span>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">Microphone access is blocked</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm mx-auto">
                Click the lock or settings icon next to the address bar, allow the microphone for this site, then try again.
              </p>
              <Button variant="outline" type="button" onClick={requestMicrophone}>
                Try again
              </Button>
            </div>
          ) : micState === 'unavailable' ? (
            <div className="space-y-3">
              <span className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 flex items-center justify-center">
                <MicOff className="w-6 h-6" />
              </span>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">No microphone found</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm mx-auto">
                Connect a microphone, or open this page in a browser that supports recording, then try again.
              </p>
              <Button variant="outline" type="button" onClick={requestMicrophone}>
                Try again
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="mx-auto w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Mic className="w-6 h-6" />
              </span>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {micState === 'granted' ? 'Ready to record' : 'Allow microphone access'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm mx-auto">
                {micState === 'granted'
                  ? 'Recording starts when you press the button. Stop it when the consultation ends.'
                  : 'Your browser will ask for permission to use the microphone. Recording starts as soon as you allow it.'}
              </p>
              <Button type="button" onClick={requestMicrophone} disabled={micState === 'requesting' || micState === 'unknown'}>
                {micState === 'requesting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                {micState === 'requesting' ? 'Waiting for permission…' : micState === 'granted' ? 'Start recording' : 'Allow microphone'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 min-w-0">
              <FileAudio className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {selectedFile.name}
                </div>
                <div className={`${muted} tabular-nums`}>
                  {[formatFileSize(selectedFile.size), fileDuration !== null ? formatSeconds(fileDuration) : null]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>
            </div>
            {!isProcessing && (
              <IconButton onClick={removeSelectedFile} title="Remove file" aria-label="Remove file">
                <X className="w-4 h-4" />
              </IconButton>
            )}
          </div>

          {isProcessing ? (
            <div className="space-y-2">
              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">{STAGE_LABELS[stage]}</span>
                {stage !== 'completed' && (
                  <button
                    onClick={cancelProcessing}
                    className="text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Preview of the result that is being prepared */}
              <div className="grid grid-cols-5 gap-3 pt-2 animate-pulse" aria-hidden="true">
                <div className="col-span-2 space-y-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="h-2.5 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-8 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="h-2.5 w-full rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-2.5 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="col-span-3 space-y-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="h-2.5 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-2.5 w-full rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-2.5 w-full rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-2.5 w-11/12 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-2.5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-2.5 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            </div>
          ) : (
            <>
              {previewAudioUrl && <audio controls src={previewAudioUrl} className="w-full h-9" />}
              <div className="flex justify-end">
                <Button type="button" onClick={handleStartProcessing}>
                  <Sparkles className="w-4 h-4" />
                  <span>{stage === 'error' ? 'Try again' : 'Analyze recording'}</span>
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-sm text-rose-800 dark:text-rose-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
