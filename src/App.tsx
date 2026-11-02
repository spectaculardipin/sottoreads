import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Check,
  Clock,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import { SetupPanel } from './components/SetupPanel';
import { SessionPanel } from './components/SessionPanel';
import { TrainingDrawer } from './components/TrainingDrawer';
import { makeBatches, estimateDefaultWritingMs, estimateSpeechMs, splitWords, formatMs } from './lib/text';
import { predictMs, trainModel, DEFAULT_TRAINING_SETTINGS } from './lib/model';
import { createEngine } from './lib/tts';
import { MicMonitor } from './lib/vad';
import { parseFile } from './lib/files';
import {
  clearTraining,
  downloadJson,
  exportTraining,
  loadSettings,
  loadTraining,
  readJsonFile,
  saveSettings,
  saveTraining,
  validateBundle,
  type AppSettings,
} from './lib/storage';
import type {
  Batch,
  EngineId,
  RegressionModel,
  SessionStatus,
  SpeechHandle,
  TrainingRecord,
  TrainingSettings,
  VadUpdate,
  VoiceOption,
} from './lib/types';

const PREDICTED_GRACE_MS = 1200;
const AUTO_ADVANCE_PAUSE_MS = 900;
const SAMPLE_TEXT =
  'The morning light moved slowly across the desk. Small habits, repeated daily, become the quiet architecture of a good life. Read each phrase aloud, then write it down with care.';

type CompletionReason =
  | 'manual'
  | 'mic-silence'
  | 'mic-estimated'
  | 'predicted-auto'
  | 'predicted-manual';

interface SessionStats {
  batches: number;
  words: number;
  totalMs: number;
}

interface Runtime {
  engine: ReturnType<typeof createEngine>;
  batches: Batch[];
  index: number;
  activeHandle: SpeechHandle | null;
  handleCache: Map<string, SpeechHandle>;
  mic: MicMonitor | null;
  countdownTimer: number | null;
  advanceTimer: number | null;
  prefetchTimer: number | null;
  playbackEndedAt: number;
  gapBeforeMs: number;
  predictedMs: number | null;
  predictedTotal: number;
  extended: boolean;
  autoAdvanced: boolean;
  cancelled: boolean;
  token: number;
  completing: boolean;
  recorded: Set<number>;
  startedAt: number;
  lastCompletionAt: number;
  completedCount: number;
  completedWords: number;
}

interface ToastState {
  message: string;
  type: 'info' | 'error';
}

function makeRuntime(engine: Runtime['engine'], batches: Batch[]): Runtime {
  return {
    engine,
    batches,
    index: 0,
    activeHandle: null,
    handleCache: new Map(),
    mic: null,
    countdownTimer: null,
    advanceTimer: null,
    prefetchTimer: null,
    playbackEndedAt: 0,
    gapBeforeMs: 0,
    predictedMs: null,
    predictedTotal: 0,
    extended: false,
    autoAdvanced: false,
    cancelled: false,
    token: 0,
    completing: false,
    recorded: new Set(),
    startedAt: 0,
    lastCompletionAt: 0,
    completedCount: 0,
    completedWords: 0,
  };
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function handleKey(batch: Batch, engine: EngineId, voice: string, speed: number): string {
  return `${engine}|${voice}|${speed.toFixed(2)}|${batch.text}`;
}

export default function App() {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [records, setRecords] = useState<TrainingRecord[]>(() => loadTraining().records);
  const [model, setModel] = useState<RegressionModel | null>(() => loadTraining().model);
  const [sessionActive, setSessionActive] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeWord, setActiveWord] = useState(-1);
  const [engineProgress, setEngineProgress] = useState(0);
  const [engineStatus, setEngineStatus] = useState('Preparing voice');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [vadUpdate, setVadUpdate] = useState<VadUpdate | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [predictedTotal, setPredictedTotal] = useState(0);
  const [predictedMs, setPredictedMs] = useState<number | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseLabel, setParseLabel] = useState('Reading file');
  const [parseProgress, setParseProgress] = useState(0);
  const [trainingOpen, setTrainingOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    batches: 0,
    words: 0,
    totalMs: 0,
  });

  const runtimeRef = useRef<Runtime | null>(null);
  const settingsRef = useRef(settings);
  const recordsRef = useRef(records);
  const modelRef = useRef(model);
  const textRef = useRef(text);
  const mountedRef = useRef(true);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const runtime = runtimeRef.current;
      if (runtime) {
        runtime.cancelled = true;
        clearRuntimeTimers(runtime);
        runtime.mic?.stop();
        runtime.engine.stop().catch(() => {});
        runtime.engine.dispose().catch(() => {});
        runtimeRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const updateVoices = () => {
      if (cancelled) return;
      const engine = createEngine(settings.engine);
      const list = engine.getVoices();
      setVoices(list);
      if (list.length > 0 && !list.some((voice) => voice.id === settings.voice)) {
        setSettings((current) => ({ ...current, voice: list[0].id }));
      }
    };

    updateVoices();

    if (settings.engine === 'browser' && 'speechSynthesis' in window) {
      const handler = () => updateVoices();
      window.speechSynthesis.addEventListener('voiceschanged', handler);
      return () => {
        cancelled = true;
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [settings.engine, settings.voice]);

  useEffect(() => {
    if (!toast) return;
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 5000);
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, [toast]);

  const showToast = useCallback((message: string, type: ToastState['type'] = 'info') => {
    setToast({ message, type });
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const updateTrainingSettings = useCallback((next: TrainingSettings) => {
    setSettings((current) => ({ ...current, training: next }));
  }, []);

  function clearRuntimeTimers(runtime: Runtime) {
    if (runtime.countdownTimer !== null) {
      window.clearInterval(runtime.countdownTimer);
      runtime.countdownTimer = null;
    }
    if (runtime.advanceTimer !== null) {
      window.clearTimeout(runtime.advanceTimer);
      runtime.advanceTimer = null;
    }
    if (runtime.prefetchTimer !== null) {
      window.clearTimeout(runtime.prefetchTimer);
      runtime.prefetchTimer = null;
    }
  }

  function stopMic(runtime: Runtime) {
    if (runtime.mic) {
      runtime.mic.stop();
      runtime.mic = null;
    }
  }

  async function stopAudio(runtime: Runtime) {
    const handle = runtime.activeHandle;
    runtime.activeHandle = null;
    if (handle) {
      await handle.stop().catch(() => {});
    }
    await runtime.engine.stop().catch(() => {});
  }

  async function disposeRuntime(runtime: Runtime) {
    runtime.cancelled = true;
    runtime.token += 1;
    clearRuntimeTimers(runtime);
    stopMic(runtime);
    await stopAudio(runtime);
    runtime.handleCache.clear();
    await runtime.engine.dispose().catch(() => {});
    if (runtimeRef.current === runtime) runtimeRef.current = null;
  }

  const handleFile = useCallback(
    async (file: File) => {
      setIsParsing(true);
      setParseProgress(0.05);
      setParseLabel('Reading file');
      try {
        const parsed = await parseFile(file, (progress) => {
          setParseLabel(progress.label);
          setParseProgress(progress.progress);
        });
        const normalized = parsed.trim();
        if (!normalized) {
          showToast('No text was found in that file.', 'error');
        } else {
          setText(normalized);
          setFileName(file.name);
          showToast(`Loaded ${file.name}.`);
        }
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Could not read that file.', 'error');
      } finally {
        setIsParsing(false);
        setParseProgress(0);
      }
    },
    [showToast],
  );

  const loadSample = useCallback(() => {
    setText(SAMPLE_TEXT);
    setFileName(null);
  }, []);

  const clearText = useCallback(() => {
    setText('');
    setFileName(null);
  }, []);

  async function startSession() {
    const words = splitWords(textRef.current);
    if (words.length === 0) {
      showToast('Add some text first.', 'error');
      return;
    }

    const nextBatches = makeBatches(textRef.current, settingsRef.current.batchSize);
    if (nextBatches.length === 0) {
      showToast('Could not split that text into batches.', 'error');
      return;
    }

    const existing = runtimeRef.current;
    if (existing) await disposeRuntime(existing);

    const runtime = makeRuntime(createEngine(settingsRef.current.engine), nextBatches);
    runtimeRef.current = runtime;
    setSessionActive(true);
    setCompleted(false);
    setStatus('preparing');
    setEngineProgress(0);
    setEngineStatus('Preparing voice');
    setErrorMessage(null);
    setBatches(nextBatches);
    setCurrentIndex(0);
    setActiveWord(-1);
    setCountdown(null);
    setPredictedMs(null);
    setPredictedTotal(0);
    setVadUpdate(null);
    setTrainingOpen(false);
    setSessionStats({ batches: 0, words: 0, totalMs: 0 });

    if (settingsRef.current.advanceMode === 'mic') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        showToast('Microphone permission was not granted. You can still use Next.', 'error');
        setSettings((current) => ({ ...current, advanceMode: 'manual' }));
      }
    }

    try {
      await runtime.engine.init(
        (progress, label) => {
          if (runtime.cancelled) return;
          setEngineProgress(progress);
          setEngineStatus(label);
        },
        { voice: settingsRef.current.voice, speed: settingsRef.current.speed },
      );

      if (runtime.cancelled) {
        await runtime.engine.dispose().catch(() => {});
        return;
      }

      const nextVoices = runtime.engine.getVoices();
      setVoices(nextVoices);
      setEngineProgress(1);
      setEngineStatus('Voice ready');
      setStatus('ready');
    } catch (error) {
      if (runtime.cancelled) return;
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'The voice could not be prepared.',
      );
      setEngineStatus('Voice unavailable');
    }
  }

  async function cancelStart() {
    const runtime = runtimeRef.current;
    if (runtime) {
      runtime.cancelled = true;
      runtime.token += 1;
      clearRuntimeTimers(runtime);
      stopMic(runtime);
      await runtime.engine.stop().catch(() => {});
      await runtime.engine.dispose().catch(() => {});
      if (runtimeRef.current === runtime) runtimeRef.current = null;
    }
    setSessionActive(false);
    setStatus('idle');
    setCompleted(false);
  }

  function beginSession() {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.startedAt = performance.now();
    setStatus('batch-preparing');
    void startBatch(0);
  }

  async function startBatch(index: number) {
    const runtime = runtimeRef.current;
    if (!runtime || runtime.cancelled) return;

    const token = ++runtime.token;
    runtime.completing = false;
    clearRuntimeTimers(runtime);
    stopMic(runtime);
    await stopAudio(runtime);
    if (runtime.cancelled || token !== runtime.token) return;

    const batch = runtime.batches[index];
    if (!batch) {
      endSession();
      return;
    }

    runtime.index = index;
    runtime.extended = false;
    runtime.autoAdvanced = false;
    runtime.playbackEndedAt = 0;
    runtime.gapBeforeMs = runtime.lastCompletionAt
      ? Math.max(0, performance.now() - runtime.lastCompletionAt)
      : 0;
    runtime.predictedMs = null;
    setCurrentIndex(index);
    setActiveWord(-1);
    setVadUpdate(null);
    setCountdown(null);
    setStatus('batch-preparing');

    const settingsNow = settingsRef.current;
    const key = handleKey(batch, runtime.engine.id, settingsNow.voice, settingsNow.speed);
    let handle = runtime.handleCache.get(key);

    if (!handle) {
      try {
        handle = await runtime.engine.prepare(batch.text, {
          voice: settingsNow.voice,
          speed: settingsNow.speed,
        });
      } catch (error) {
        if (token !== runtime.token) return;
        setStatus('error');
        setErrorMessage(
          error instanceof Error ? error.message : 'Could not prepare the audio for this batch.',
        );
        return;
      }
      runtime.handleCache.set(key, handle);
      pruneCache(runtime);
    }

    if (runtime.cancelled || token !== runtime.token) return;

    const prediction = predictMs(modelRef.current, batch.stats);
    runtime.predictedMs = prediction?.ms ?? estimateDefaultWritingMs(batch.stats);
    runtime.predictedTotal = runtime.predictedMs + PREDICTED_GRACE_MS;
    runtime.activeHandle = handle;
    setPredictedMs(runtime.predictedMs);
    setPredictedTotal(runtime.predictedTotal);
    setStatus('playing');

    // Prepare the next batch while this one plays.
    runtime.prefetchTimer = window.setTimeout(() => {
      void prefetchNext(index, token);
    }, 120);

    try {
      await handle.play((wordIndex) => {
        if (runtime.token === token) setActiveWord(wordIndex);
      });
    } catch (error) {
      if (runtime.cancelled || token !== runtime.token) return;
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Audio playback failed for this batch.',
      );
      return;
    }

    if (runtime.cancelled || token !== runtime.token) return;
    runtime.playbackEndedAt = performance.now();
    setActiveWord(-1);
    handlePlaybackEnd();
  }

  async function prefetchNext(index: number, token: number) {
    const runtime = runtimeRef.current;
    if (!runtime || runtime.cancelled || token !== runtime.token) return;
    const next = runtime.batches[index + 1];
    if (!next) return;

    const settingsNow = settingsRef.current;
    const key = handleKey(next, runtime.engine.id, settingsNow.voice, settingsNow.speed);
    if (runtime.handleCache.has(key)) return;

    try {
      const handle = await runtime.engine.prepare(next.text, {
        voice: settingsNow.voice,
        speed: settingsNow.speed,
      });
      if (runtime.cancelled || token !== runtime.token) {
        // The handle was never played. Discard it without stopping the shared player.
        return;
      }
      runtime.handleCache.set(key, handle);
      pruneCache(runtime);
    } catch {
      // Prefetch is best-effort. The batch will be prepared on demand.
    }
  }

  function pruneCache(runtime: Runtime) {
    while (runtime.handleCache.size > 4) {
      const firstKey = runtime.handleCache.keys().next().value;
      if (typeof firstKey !== 'string') break;
      // Do not call stop() on evicted handles: all handles share one audio player,
      // so stopping a cached handle could stop the currently playing batch.
      runtime.handleCache.delete(firstKey);
    }
  }

  function handlePlaybackEnd() {
    const runtime = runtimeRef.current;
    if (!runtime || runtime.cancelled) return;
    const mode = settingsRef.current.advanceMode;
    if (mode === 'mic') {
      startListening();
    } else if (mode === 'predicted') {
      startPredictedCountdown();
    } else {
      setStatus('your-turn');
      setCountdown(null);
    }
  }

  async function startListening() {
    const runtime = runtimeRef.current;
    if (!runtime || runtime.cancelled) return;
    const token = runtime.token;
    const batch = runtime.batches[runtime.index];
    if (!batch) return;

    const expectedSpeech = estimateSpeechMs(batch.words, settingsRef.current.speed);
    const monitor = new MicMonitor({
      silenceMs: 1300,
      minSpeechMs: 260,
      expectedSpeechMs: expectedSpeech,
      expectedWords: batch.words.length,
      onUpdate: (update) => {
        if (runtimeRef.current === runtime && runtime.token === token) {
          setVadUpdate(update);
        }
      },
      onComplete: (reason) => {
        if (runtimeRef.current !== runtime || runtime.token !== token) return;
        setVadUpdate(null);
        void completeBatch(reason === 'silence' ? 'mic-silence' : 'mic-estimated');
      },
    });

    runtime.mic = monitor;
    setStatus('listening');

    try {
      await monitor.start();
    } catch (error) {
      if (runtimeRef.current !== runtime || runtime.token !== token) return;
      setStatus('your-turn');
      setVadUpdate(null);
      showToast(
        error instanceof Error
          ? `${error.message} Use Next instead.`
          : 'Microphone unavailable. Use Next instead.',
        'error',
      );
      setSettings((current) => ({ ...current, advanceMode: 'manual' }));
    }
  }

  function startPredictedCountdown() {
    const runtime = runtimeRef.current;
    if (!runtime || runtime.cancelled) return;
    const token = runtime.token;
    const batch = runtime.batches[runtime.index];
    if (!batch) return;

    const predicted = runtime.predictedMs ?? estimateDefaultWritingMs(batch.stats);
    runtime.predictedTotal = predicted + PREDICTED_GRACE_MS;
    setPredictedTotal(runtime.predictedTotal);
    setCountdown(runtime.predictedTotal);
    setStatus('your-turn');

    const started = performance.now();
    runtime.countdownTimer = window.setInterval(() => {
      const active = runtimeRef.current;
      if (!active || active !== runtime || active.token !== token || active.extended) {
        if (runtime.countdownTimer !== null) {
          window.clearInterval(runtime.countdownTimer);
          runtime.countdownTimer = null;
        }
        return;
      }

      const remaining = Math.max(0, runtime.predictedTotal - (performance.now() - started));
      setCountdown(remaining);

      if (remaining <= 0) {
        if (runtime.countdownTimer !== null) {
          window.clearInterval(runtime.countdownTimer);
          runtime.countdownTimer = null;
        }
        runtime.autoAdvanced = true;
        setCountdown(0);
        setStatus('paused');
        runtime.advanceTimer = window.setTimeout(() => {
          if (runtimeRef.current === runtime && runtime.token === token) {
            void completeBatch('predicted-auto');
          }
        }, 700);
      }
    }, 120);
  }

  async function completeBatch(reason: CompletionReason) {
    const runtime = runtimeRef.current;
    if (!runtime || runtime.cancelled || runtime.completing) return;
    runtime.completing = true;
    runtime.token += 1;
    const token = runtime.token;

    clearRuntimeTimers(runtime);
    stopMic(runtime);
    setVadUpdate(null);
    setCountdown(null);
    await stopAudio(runtime);
    if (runtime.cancelled || token !== runtime.token) return;

    const batch = runtime.batches[runtime.index];
    if (!batch) {
      endSession();
      return;
    }

    const completedAt = performance.now();
    runtime.completedCount += 1;
    runtime.completedWords += batch.stats.wordCount;

    if (reason !== 'predicted-auto' && trainingEnabled()) {
      recordCompletion(runtime, batch, reason);
    }

    runtime.lastCompletionAt = completedAt;

    if (runtime.index >= runtime.batches.length - 1) {
      endSession();
      return;
    }

    setStatus('paused');
    runtime.advanceTimer = window.setTimeout(() => {
      if (runtimeRef.current === runtime && runtime.token === token) {
        void startBatch(runtime.index + 1);
      }
    }, AUTO_ADVANCE_PAUSE_MS);
  }

  function trainingEnabled(): boolean {
    return settingsRef.current.training.enabled;
  }

  function recordCompletion(runtime: Runtime, batch: Batch, reason: CompletionReason) {
    if (runtime.recorded.has(runtime.index)) return;
    const durationMs =
      runtime.playbackEndedAt > 0 ? performance.now() - runtime.playbackEndedAt : 0;
    if (durationMs < 350) return;

    const settingsNow = settingsRef.current;
    const gapBeforeMs = runtime.gapBeforeMs;

    const record: TrainingRecord = {
      id: newId(),
      createdAt: new Date().toISOString(),
      wordCount: batch.stats.wordCount,
      charCount: batch.stats.charCount,
      avgWordLength: batch.stats.avgWordLength,
      syllables: batch.stats.syllables,
      punctuation: batch.stats.punctuation,
      capitals: batch.stats.capitals,
      batchSize: settingsNow.batchSize,
      durationMs,
      gapBeforeMs,
      predictedMs: runtime.predictedMs ?? undefined,
      mode: settingsNow.advanceMode,
      engine: runtime.engine.id,
      speed: settingsNow.speed,
    };

    const nextRecords = [...recordsRef.current, record];
    const wasReady = Boolean(modelRef.current);
    const nextModel = trainModel(nextRecords, settingsNow.training);

    recordsRef.current = nextRecords;
    modelRef.current = nextModel;
    setRecords(nextRecords);
    setModel(nextModel);
    saveTraining({ records: nextRecords, model: nextModel });
    runtime.recorded.add(runtime.index);

    if (nextModel && !wasReady) {
      showToast('Your personal pace model is ready. Predicted advance is now available.');
    }

    void reason;
  }

  function next() {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const current = status;
    if (current === 'playing' || current === 'preparing' || current === 'batch-preparing') {
      skipCurrent();
      return;
    }
    if (current === 'your-turn' || current === 'listening' || current === 'paused') {
      void completeBatch(settingsRef.current.advanceMode === 'predicted' ? 'predicted-manual' : 'manual');
    }
  }

  async function skipCurrent() {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.token += 1;
    clearRuntimeTimers(runtime);
    stopMic(runtime);
    setVadUpdate(null);
    setCountdown(null);
    await stopAudio(runtime);
    if (runtime.index >= runtime.batches.length - 1) {
      endSession();
      return;
    }
    setStatus('paused');
    window.setTimeout(() => {
      if (runtimeRef.current === runtime) void startBatch(runtime.index + 1);
    }, 400);
  }

  async function previous() {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.token += 1;
    clearRuntimeTimers(runtime);
    stopMic(runtime);
    setVadUpdate(null);
    setCountdown(null);
    await stopAudio(runtime);
    if (runtime.index > 0) {
      void startBatch(runtime.index - 1);
    }
  }

  async function replay() {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const index = runtime.index;
    runtime.token += 1;
    clearRuntimeTimers(runtime);
    stopMic(runtime);
    setVadUpdate(null);
    setCountdown(null);
    await stopAudio(runtime);
    void startBatch(index);
  }

  function moreTime() {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.extended = true;
    if (runtime.countdownTimer !== null) {
      window.clearInterval(runtime.countdownTimer);
      runtime.countdownTimer = null;
    }
    setCountdown(null);
    setStatus('your-turn');
    showToast('Take your time. Click Next when you finish writing.');
  }

  async function endSession() {
    const runtime = runtimeRef.current;
    if (!runtime) {
      setSessionActive(false);
      setCompleted(false);
      setStatus('idle');
      return;
    }
    runtime.cancelled = true;
    runtime.token += 1;
    clearRuntimeTimers(runtime);
    stopMic(runtime);
    await stopAudio(runtime);
    runtime.handleCache.clear();
    await runtime.engine.dispose().catch(() => {});
    if (runtimeRef.current === runtime) runtimeRef.current = null;

    const totalMs = runtime.startedAt > 0 ? performance.now() - runtime.startedAt : 0;
    setSessionStats({
      batches: runtime.completedCount,
      words: runtime.completedWords,
      totalMs,
    });
    setSessionActive(false);
    setCompleted(true);
    setStatus('complete');
    setVadUpdate(null);
    setCountdown(null);
    setActiveWord(-1);
  }

  async function retry() {
    const runtime = runtimeRef.current;
    if (runtime) await disposeRuntime(runtime);
    await startSession();
  }

  async function backToSetup() {
    const runtime = runtimeRef.current;
    if (runtime) await disposeRuntime(runtime);
    setSessionActive(false);
    setCompleted(false);
    setStatus('idle');
  }

  async function handleEnd() {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const last = runtime.index >= runtime.batches.length - 1;
    if (!last && !window.confirm('End this session? Your completed batches are saved.')) {
      return;
    }
    await endSession();
  }

  function handleExport() {
    if (records.length === 0) {
      showToast('No training data to export yet.', 'error');
      return;
    }
    const bundle = exportTraining(records, model, settings.training);
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(`dictate-training-${date}.json`, bundle);
    showToast('Training data exported as JSON.');
  }

  async function handleImport(file: File) {
    try {
      const raw = await readJsonFile(file);
      const bundle = validateBundle(raw);
      if (!bundle) {
        showToast('That file is not a valid Dictate training export.', 'error');
        return;
      }

      const nextRecords = bundle.records;
      const nextModel = bundle.model ?? trainModel(nextRecords, bundle.settings);
      const nextTraining: TrainingSettings = {
        ...DEFAULT_TRAINING_SETTINGS,
        ...bundle.settings,
      };

      recordsRef.current = nextRecords;
      modelRef.current = nextModel;
      setRecords(nextRecords);
      setModel(nextModel);
      setSettings((current) => ({ ...current, training: nextTraining }));
      saveTraining({ records: nextRecords, model: nextModel });
      saveSettings({ ...settingsRef.current, training: nextTraining });
      showToast(
        `Imported ${nextRecords.length} training batches${nextModel ? ' and a pace model' : ''}.`,
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not import that file.', 'error');
    }
  }

  function handleReset() {
    if (!window.confirm('Delete all local training data? This cannot be undone.')) return;
    clearTraining();
    recordsRef.current = [];
    modelRef.current = null;
    setRecords([]);
    setModel(null);
    setSettings((current) => ({
      ...current,
      training: { ...current.training, enabled: false },
    }));
    showToast('Training data deleted from this browser.');
  }

  function handleRepeat() {
    setCompleted(false);
    setSessionActive(false);
    setStatus('idle');
    // Start a new session with the same text on the next tick so the UI resets first.
    window.setTimeout(() => void startSession(), 0);
  }

  function handleNewText() {
    setCompleted(false);
    setSessionActive(false);
    setStatus('idle');
  }

  const batch = batches[currentIndex] ?? null;
  const trainingOn = settings.training.enabled;
  const modelReady = Boolean(model);

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <button
            type="button"
            className="brand"
            onClick={() => {
              if (!sessionActive && !completed) return;
              if (window.confirm('Return to the setup screen? The current session will end.')) {
                void backToSetup();
              }
            }}
          >
            <span className="brand-mark">
              <BookOpen size={17} strokeWidth={2.2} />
            </span>
            <span className="brand-name">Dictate</span>
            <span className="brand-tag">read, write, keep pace</span>
          </button>
          <div className="header-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTrainingOpen(true)}>
              <Brain size={15} />
              Training
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {!sessionActive && !completed && (
          <SetupPanel
            text={text}
            onTextChange={setText}
            settings={settings}
            onSettingsChange={updateSettings}
            voices={voices}
            onStart={startSession}
            isParsing={isParsing}
            parseLabel={parseLabel}
            parseProgress={parseProgress}
            fileName={fileName}
            onFile={handleFile}
            onOpenTraining={() => setTrainingOpen(true)}
            recordsCount={records.length}
            modelReady={modelReady}
            onLoadSample={loadSample}
            onClear={clearText}
          />
        )}

        {sessionActive && (
          <SessionPanel
            status={status}
            batch={batch}
            batchIndex={currentIndex}
            batchCount={batches.length}
            activeWord={activeWord}
            advanceMode={settings.advanceMode}
            vadUpdate={vadUpdate}
            countdown={countdown}
            predictedTotal={predictedTotal}
            predictedMs={predictedMs}
            modelReady={modelReady}
            trainingEnabled={trainingOn}
            recordsCount={records.length}
            minSamples={settings.training.minSamples}
            engineProgress={engineProgress}
            engineStatus={engineStatus}
            errorMessage={errorMessage}
            onBegin={beginSession}
            onNext={next}
            onPrevious={previous}
            onReplay={replay}
            onMoreTime={moreTime}
            onEnd={handleEnd}
            onCancelStart={cancelStart}
            onRetry={retry}
            onBack={backToSetup}
            onOpenTraining={() => setTrainingOpen(true)}
          />
        )}

        {completed && (
          <CompletePanel
            stats={sessionStats}
            trainingEnabled={trainingOn}
            modelReady={modelReady}
            onRepeat={handleRepeat}
            onNewText={handleNewText}
            onOpenTraining={() => setTrainingOpen(true)}
          />
        )}
      </main>

      <TrainingDrawer
        open={trainingOpen}
        onClose={() => setTrainingOpen(false)}
        settings={settings.training}
        onSettingsChange={updateTrainingSettings}
        records={records}
        model={model}
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleReset}
      />

      {toast && (
        <div className={`toast${toast.type === 'error' ? ' error' : ''}`} role="status" aria-live="polite">
          <span>{toast.message}</span>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            style={{ color: 'inherit', width: 28, height: 28, minHeight: 28 }}
            onClick={() => setToast(null)}
            aria-label="Dismiss message"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

function CompletePanel({
  stats,
  trainingEnabled,
  modelReady,
  onRepeat,
  onNewText,
  onOpenTraining,
}: {
  stats: SessionStats;
  trainingEnabled: boolean;
  modelReady: boolean;
  onRepeat: () => void;
  onNewText: () => void;
  onOpenTraining: () => void;
}) {
  return (
    <div className="complete">
      <div className="complete-mark">
        <Check size={28} />
      </div>
      <h2>Session complete</h2>
      <p>
        You worked through {stats.batches.toLocaleString()} batch{stats.batches === 1 ? '' : 'es'} and{' '}
        {stats.words.toLocaleString()} words in {formatMs(stats.totalMs)}.
      </p>
      <div className="complete-stats">
        <div className="stat">
          <strong>{stats.words.toLocaleString()}</strong>
          <span>words written</span>
        </div>
        <div className="stat">
          <strong>{stats.batches.toLocaleString()}</strong>
          <span>batches completed</span>
        </div>
        <div className="stat">
          <strong>{formatMs(stats.totalMs)}</strong>
          <span>total time</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-primary" onClick={onRepeat}>
          <Volume2 size={16} />
          Repeat this text
        </button>
        <button type="button" className="btn" onClick={onNewText}>
          <ArrowLeft size={16} />
          Back to setup
        </button>
      </div>
      <div style={{ marginTop: 18, fontSize: 12, color: 'var(--muted)' }}>
        {trainingEnabled ? (
          <span className="pill ok">
            <Sparkles size={12} />
            {modelReady ? 'Pace model updated' : 'Training data saved'}
          </span>
        ) : (
          <button type="button" className="link-btn" onClick={onOpenTraining}>
            <Clock size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
            Turn on pace training to improve predictions
          </button>
        )}
      </div>
    </div>
  );
}
