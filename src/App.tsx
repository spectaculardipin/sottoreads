import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  Volume2,
  X,
} from 'lucide-react';
import { SetupPanel } from './components/SetupPanel';
import { SessionPanel } from './components/SessionPanel';
import { TrainingPanel } from './components/TrainingPanel';
import { BrainMenu } from './components/BrainMenu';
import { TrainingGuide } from './components/TrainingGuide';
import { makeBatches, makeTrainingBatches, splitWords, formatMs } from './lib/text';
import { adjustMsPerChar, predictMs, trainModel } from './lib/model';
import { createEngine } from './lib/tts';
import { parseFile } from './lib/files';
import {
  clearTraining,
  downloadJson,
  loadSettings,
  loadTraining,
  readJsonFile,
  saveSettings,
  saveTraining,
  type AppSettings,
} from './lib/storage';
import type {
  Batch,
  EngineId,
  FeedbackRating,
  SessionStatus,
  SpeechHandle,
  TrainingModel,
  TrainingRecord,
  VoiceOption,
} from './lib/types';

const SAMPLE_TEXT =
  'The morning light moved slowly across the desk. Small habits, repeated daily, become the quiet architecture of a good life. Read each phrase aloud, then write it down with care.';

type CompletionReason = 'manual' | 'smart-auto' | 'smart-manual';

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
  pendingPrepares: Map<string, Promise<SpeechHandle>>;
  batchStartAt: number;
  startedAt: number;
  predictedMs: number | null;
  predictedTotal: number;
  timer: number | null;
  prefetchTimer: number | null;
  cancelled: boolean;
  token: number;
  completing: boolean;
  completedCount: number;
  completedWords: number;
  training: boolean;
  trainingRecords: TrainingRecord[];
  recorded: Set<number>;
}

interface ToastState {
  message: string;
  type: 'info' | 'error';
}

function makeRuntime(engine: Runtime['engine'], batches: Batch[], training = false): Runtime {
  return {
    engine,
    batches,
    index: 0,
    activeHandle: null,
    handleCache: new Map(),
    pendingPrepares: new Map(),
    batchStartAt: 0,
    startedAt: 0,
    predictedMs: null,
    predictedTotal: 0,
    timer: null,
    prefetchTimer: null,
    cancelled: false,
    token: 0,
    completing: false,
    completedCount: 0,
    completedWords: 0,
    training,
    trainingRecords: [],
    recorded: new Set(),
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
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>(
    () => loadTraining().records,
  );
  const [model, setModel] = useState<TrainingModel | null>(() => loadTraining().model);
  const [sessionActive, setSessionActive] = useState(false);
  const [trainingMode, setTrainingMode] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeWord, setActiveWord] = useState(-1);
  const [engineProgress, setEngineProgress] = useState(0);
  const [engineStatus, setEngineStatus] = useState('Preparing voice');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [predictedMs, setPredictedMs] = useState<number | null>(null);
  const [predictedTotal, setPredictedTotal] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [parseLabel, setParseLabel] = useState('Reading file');
  const [parseProgress, setParseProgress] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<FeedbackRating | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    batches: 0,
    words: 0,
    totalMs: 0,
  });

  const runtimeRef = useRef<Runtime | null>(null);
  const settingsRef = useRef(settings);
  const trainingRecordsRef = useRef(trainingRecords);
  const modelRef = useRef(model);
  const textRef = useRef(text);
  const mountedRef = useRef(true);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    trainingRecordsRef.current = trainingRecords;
  }, [trainingRecords]);

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

  function clearRuntimeTimers(runtime: Runtime) {
    if (runtime.timer !== null) {
      window.clearInterval(runtime.timer);
      runtime.timer = null;
    }
    if (runtime.prefetchTimer !== null) {
      window.clearTimeout(runtime.prefetchTimer);
      runtime.prefetchTimer = null;
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
    await stopAudio(runtime);
    runtime.handleCache.clear();
    runtime.pendingPrepares.clear();
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

  async function startTrainingSession() {
    const trainingBatches = makeTrainingBatches();
    if (trainingBatches.length === 0) {
      showToast('Training text could not be prepared.', 'error');
      return;
    }

    const existing = runtimeRef.current;
    if (existing) await disposeRuntime(existing);

    const runtime = makeRuntime(createEngine(settingsRef.current.engine), trainingBatches, true);
    runtimeRef.current = runtime;
    setSessionActive(true);
    setTrainingMode(true);
    setCompleted(false);
    setStatus('preparing');
    setEngineProgress(0);
    setEngineStatus('Preparing voice');
    setErrorMessage(null);
    setBatches(trainingBatches);
    setCurrentIndex(0);
    setActiveWord(-1);
    setPredictedMs(null);
    setPredictedTotal(0);
    setShowFeedback(false);
    setFeedbackRating(null);
    setSessionStats({ batches: 0, words: 0, totalMs: 0 });

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

  async function startSession() {
    const words = splitWords(textRef.current);
    if (words.length === 0) {
      showToast('Add some text first.', 'error');
      return;
    }

    const nextBatches = makeBatches(
      textRef.current,
      settingsRef.current.batchSize,
      settingsRef.current.batchMode,
    );
    if (nextBatches.length === 0) {
      showToast('Could not split that text into batches.', 'error');
      return;
    }

    if (
      settingsRef.current.advanceMode === 'smart' &&
      (!settingsRef.current.trainingCompleted || !modelRef.current)
    ) {
      showToast('Complete the short training session before using Smart mode.', 'error');
      return;
    }

    const existing = runtimeRef.current;
    if (existing) await disposeRuntime(existing);

    const runtime = makeRuntime(createEngine(settingsRef.current.engine), nextBatches);
    runtimeRef.current = runtime;
    setSessionActive(true);
    setTrainingMode(false);
    setCompleted(false);
    setStatus('preparing');
    setEngineProgress(0);
    setEngineStatus('Preparing voice');
    setErrorMessage(null);
    setBatches(nextBatches);
    setCurrentIndex(0);
    setActiveWord(-1);
    setPredictedMs(null);
    setPredictedTotal(0);
    setShowFeedback(false);
    setFeedbackRating(null);
    setSessionStats({ batches: 0, words: 0, totalMs: 0 });

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
      await runtime.engine.stop().catch(() => {});
      await runtime.engine.dispose().catch(() => {});
      if (runtimeRef.current === runtime) runtimeRef.current = null;
    }
    setSessionActive(false);
    setTrainingMode(false);
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
    await stopAudio(runtime);
    if (runtime.cancelled || token !== runtime.token) return;

    const batch = runtime.batches[index];
    if (!batch) {
      endSession();
      return;
    }

    runtime.index = index;
    runtime.predictedMs = null;
    runtime.predictedTotal = 0;
    setCurrentIndex(index);
    setActiveWord(-1);
    setPredictedMs(null);
    setPredictedTotal(0);
    setStatus('batch-preparing');

    const settingsNow = settingsRef.current;
    let handle: SpeechHandle;
    try {
      handle = await ensureHandle(runtime, batch, settingsNow);
    } catch (error) {
      if (token !== runtime.token) return;
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not prepare the audio for this batch.',
      );
      return;
    }

    if (runtime.cancelled || token !== runtime.token) return;

    if (!runtime.training && settingsNow.advanceMode === 'smart' && modelRef.current) {
      const predicted = predictMs(modelRef.current, batch.stats.charCount);
      runtime.predictedMs = predicted;
      runtime.predictedTotal = predicted ?? 0;
      setPredictedMs(predicted);
      setPredictedTotal(runtime.predictedTotal);
    }

    // Clock starts with dictation, not after it finishes.
    runtime.batchStartAt = performance.now();
    runtime.activeHandle = handle;
    setStatus('playing');

    runtime.prefetchTimer = window.setTimeout(() => {
      void prefetchUpcoming(index, token);
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
    setActiveWord(-1);
    handlePlaybackEnd();
  }

  async function ensureHandle(
    runtime: Runtime,
    batch: Batch,
    settingsNow: AppSettings,
  ): Promise<SpeechHandle> {
    const key = handleKey(batch, runtime.engine.id, settingsNow.voice, settingsNow.speed);
    const cached = runtime.handleCache.get(key);
    if (cached) return cached;

    let pending = runtime.pendingPrepares.get(key);
    if (!pending) {
      pending = runtime.engine.prepare(batch.text, {
        voice: settingsNow.voice,
        speed: settingsNow.speed,
      });
      runtime.pendingPrepares.set(key, pending);
    }

    try {
      const handle = await pending;
      runtime.handleCache.set(key, handle);
      pruneCache(runtime);
      return handle;
    } finally {
      runtime.pendingPrepares.delete(key);
    }
  }

  async function prefetchUpcoming(index: number, token: number) {
    const runtime = runtimeRef.current;
    if (!runtime || runtime.cancelled || token !== runtime.token) return;
    const settingsNow = settingsRef.current;

    // Keep the next three batches ready so playback can start without a gap.
    for (let offset = 1; offset <= 3; offset += 1) {
      const next = runtime.batches[index + offset];
      if (!next) return;
      try {
        await ensureHandle(runtime, next, settingsNow);
      } catch {
        // Prefetch is best-effort; startBatch retries when the batch is reached.
      }
      if (runtime.cancelled || token !== runtime.token) return;
    }
  }

  function pruneCache(runtime: Runtime) {
    while (runtime.handleCache.size > 5) {
      const firstKey = runtime.handleCache.keys().next().value;
      if (typeof firstKey !== 'string') break;
      runtime.handleCache.delete(firstKey);
    }
  }

  function handlePlaybackEnd() {
    const runtime = runtimeRef.current;
    if (!runtime || runtime.cancelled) return;
    if (runtime.training) {
      setStatus('your-turn');
      return;
    }
    const mode = settingsRef.current.advanceMode;
    if (mode === 'smart' && runtime.predictedMs) {
      startSmartTimer();
    } else {
      setStatus('your-turn');
    }
  }

  function startSmartTimer() {
    const runtime = runtimeRef.current;
    if (!runtime || runtime.cancelled) return;
    const token = runtime.token;
    const total = runtime.predictedTotal ?? 0;
    // The estimate covers time since dictation started, not time after playback ends.
    const started = runtime.batchStartAt;
    setStatus('your-turn');
    setPredictedTotal(total);

    runtime.timer = window.setInterval(() => {
      const active = runtimeRef.current;
      if (!active || active !== runtime || active.token !== token) {
        if (runtime.timer !== null) {
          window.clearInterval(runtime.timer);
          runtime.timer = null;
        }
        return;
      }

      const remaining = Math.max(0, total - (performance.now() - started));
      setPredictedTotal(remaining);

      if (remaining <= 0) {
        if (runtime.timer !== null) {
          window.clearInterval(runtime.timer);
          runtime.timer = null;
        }
        void completeBatch('smart-auto');
      }
    }, 120);
  }

  async function completeBatch(_reason: CompletionReason) {
    const runtime = runtimeRef.current;
    if (!runtime || runtime.cancelled || runtime.completing) return;
    runtime.completing = true;
    runtime.token += 1;
    const token = runtime.token;

    clearRuntimeTimers(runtime);
    await stopAudio(runtime);
    if (runtime.cancelled || token !== runtime.token) return;

    const batch = runtime.batches[runtime.index];
    if (!batch) {
      endSession();
      return;
    }

    // Timing: from dictation start to completion.
    const durationMs = Math.max(0, performance.now() - runtime.batchStartAt);
    runtime.completedCount += 1;
    runtime.completedWords += batch.stats.wordCount;

    if (runtime.training && durationMs > 350 && !runtime.recorded.has(runtime.index)) {
      runtime.recorded.add(runtime.index);
      runtime.trainingRecords.push({
        id: newId(),
        createdAt: new Date().toISOString(),
        charCount: batch.stats.charCount,
        durationMs,
      });
    }

    if (runtime.index >= runtime.batches.length - 1) {
      endSession();
      return;
    }

    // Go straight to the next batch; its audio is already prepared.
    void startBatch(runtime.index + 1);
  }

  function next() {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const current = status;
    if (current === 'playing') {
      // The reader may finish writing before the audio ends; stop and complete now.
      void completeBatch('manual');
      return;
    }
    if (current === 'preparing' || current === 'batch-preparing') {
      return;
    }
    if (current === 'your-turn' || current === 'paused') {
      void completeBatch('smart-manual');
    }
  }

  async function previous() {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.token += 1;
    clearRuntimeTimers(runtime);
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
    await stopAudio(runtime);
    void startBatch(index);
  }

  function moreTime() {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    if (runtime.timer !== null) {
      window.clearInterval(runtime.timer);
      runtime.timer = null;
    }
    runtime.predictedMs = null;
    runtime.predictedTotal = 0;
    setPredictedMs(null);
    setPredictedTotal(0);
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
    await stopAudio(runtime);
    runtime.handleCache.clear();
    runtime.pendingPrepares.clear();
    await runtime.engine.dispose().catch(() => {});
    if (runtimeRef.current === runtime) runtimeRef.current = null;

    if (runtime.training) {
      const records = runtime.trainingRecords;
      const nextModel = trainModel(records);
      if (nextModel) {
        trainingRecordsRef.current = records;
        modelRef.current = nextModel;
        setTrainingRecords(records);
        setModel(nextModel);
        const nextSettings = {
          ...settingsRef.current,
          trainingCompleted: true,
          msPerChar: nextModel.msPerChar,
          advanceMode: 'smart' as const,
        };
        settingsRef.current = nextSettings;
        setSettings(nextSettings);
        saveSettings(nextSettings);
        saveTraining({ records, model: nextModel });
        showToast(`Training complete — Smart mode unlocked (${records.length} batches).`);
      } else {
        showToast('Not enough timing data yet. Complete at least 3 training batches.', 'error');
      }
      setSessionActive(false);
      setCompleted(false);
      setStatus('idle');
      setActiveWord(-1);
      setShowFeedback(false);
      setTrainingMode(false);
      return;
    }

    const totalMs =
      runtime.startedAt > 0 ? performance.now() - runtime.startedAt : 0;
    setSessionStats({
      batches: runtime.completedCount,
      words: runtime.completedWords,
      totalMs,
    });
    setSessionActive(false);
    setCompleted(true);
    setStatus('complete');
    setActiveWord(-1);
    setShowFeedback(Boolean(modelRef.current));
  }

  async function retry() {
    const runtime = runtimeRef.current;
    if (runtime) await disposeRuntime(runtime);
    if (trainingMode) {
      await startTrainingSession();
    } else {
      await startSession();
    }
  }

  async function backToSetup() {
    const runtime = runtimeRef.current;
    if (runtime) await disposeRuntime(runtime);
    setSessionActive(false);
    setTrainingMode(false);
    setCompleted(false);
    setStatus('idle');
  }

  async function handleEnd() {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const last = runtime.index >= runtime.batches.length - 1;
    if (!last && !window.confirm('End this session?')) {
      return;
    }
    await endSession();
  }

  function handleSubmitFeedback() {
    if (!feedbackRating) return;
    const nextModel = modelRef.current
      ? adjustMsPerChar(modelRef.current, feedbackRating)
      : null;
    const nextMsPerChar = nextModel?.msPerChar ?? null;
    setModel(nextModel);
    modelRef.current = nextModel;
    setSettings((current) => ({
      ...current,
      msPerChar: nextMsPerChar,
    }));
    saveSettings({ ...settingsRef.current, msPerChar: nextMsPerChar });
    saveTraining({ records: trainingRecordsRef.current, model: nextModel });
    setShowFeedback(false);
    showToast('Thanks — your pace estimate was adjusted.');
  }

  function handleExport() {
    if (trainingRecords.length === 0) {
      showToast('No training data to export yet.', 'error');
      return;
    }
    downloadJson(`dictate-training-${new Date().toISOString().slice(0, 10)}.json`, {
      records: trainingRecords,
      model,
      msPerChar: settings.msPerChar,
    });
    showToast('Training data exported as JSON.');
  }

  async function handleImport(file: File) {
    try {
      const raw = await readJsonFile(file);
      if (!raw || typeof raw !== 'object') throw new Error('Invalid file.');
      const data = raw as { records?: unknown; model?: unknown; msPerChar?: number };
      const records = Array.isArray(data.records)
        ? data.records.filter(
            (r: unknown) =>
              r &&
              typeof r === 'object' &&
              typeof (r as { charCount?: number }).charCount === 'number' &&
              typeof (r as { durationMs?: number }).durationMs === 'number',
          )
        : [];
      const nextModel = data.model && (data.model as { version?: number }).version === 1
        ? (data.model as TrainingModel)
        : trainModel(records as TrainingRecord[]);
      const nextMsPerChar = data.msPerChar ?? nextModel?.msPerChar ?? null;

      trainingRecordsRef.current = records as TrainingRecord[];
      setTrainingRecords(records as TrainingRecord[]);
      setModel(nextModel);
      modelRef.current = nextModel;
      setSettings((current) => ({
        ...current,
        trainingCompleted: Boolean(nextModel),
        msPerChar: nextMsPerChar,
        advanceMode: nextModel ? current.advanceMode : 'manual',
      }));
      saveTraining({
        records: records as TrainingRecord[],
        model: nextModel,
      });
      saveSettings({
        ...settingsRef.current,
        trainingCompleted: Boolean(nextModel),
        msPerChar: nextMsPerChar,
      });
      showToast(
        `Imported ${records.length} training batches${
          nextModel ? ' and a pace model' : ''
        }.`,
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not import that file.', 'error');
    }
  }

  function handleReset() {
    if (!window.confirm('Delete all local training data? This cannot be undone.')) return;
    clearTraining();
    trainingRecordsRef.current = [];
    setTrainingRecords([]);
    setModel(null);
    modelRef.current = null;
    setSettings((current) => ({
      ...current,
      trainingCompleted: false,
      msPerChar: null,
      advanceMode: 'manual',
    }));
    saveSettings({
      ...settingsRef.current,
      trainingCompleted: false,
      msPerChar: null,
    });
    showToast('Training data deleted from this browser.');
  }

  function handleRepeat() {
    setCompleted(false);
    setSessionActive(false);
    setTrainingMode(false);
    setStatus('idle');
    setShowFeedback(false);
    setFeedbackRating(null);
    window.setTimeout(() => void startSession(), 0);
  }

  function handleNewText() {
    setCompleted(false);
    setSessionActive(false);
    setTrainingMode(false);
    setStatus('idle');
    setShowFeedback(false);
    setFeedbackRating(null);
  }

  const batch = batches[currentIndex] ?? null;
  const smartReady =
    settings.advanceMode === 'smart' &&
    settings.trainingCompleted &&
    Boolean(model);

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
            <span className="brand-name">SottoReads</span>
            <span className="brand-tag">read, write, keep pace</span>
          </button>
          <div className="header-actions">
            <BrainMenu
              onExport={handleExport}
              onImport={handleImport}
              onReset={handleReset}
              onLearn={() => setGuideOpen(true)}
            />
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
            onStartTraining={() => setGuideOpen(true)}
            onExport={handleExport}
            onImport={handleImport}
            onReset={handleReset}
            onLoadSample={loadSample}
            onClear={clearText}
          />
        )}

        {sessionActive && trainingMode && (
          <TrainingPanel
            batches={makeTrainingBatches()}
            currentIndex={currentIndex}
            batch={batch}
            status={status}
            activeWord={activeWord}
            engineStatus={engineStatus}
            errorMessage={errorMessage}
            predictedMs={predictedMs}
            onBegin={beginSession}
            onNext={next}
            onPrevious={previous}
            onReplay={replay}
            onEnd={handleEnd}
            onCancelStart={cancelStart}
            onRetry={retry}
            onBack={backToSetup}
          />
        )}

        {sessionActive && !trainingMode && (
          <SessionPanel
            status={status}
            batch={batch}
            batchIndex={currentIndex}
            batchCount={batches.length}
            activeWord={activeWord}
            advanceMode={settings.advanceMode}
            predictedMs={predictedMs}
            predictedTotal={predictedTotal}
            smartReady={smartReady}
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
          />
        )}

        {completed && (
          <CompletePanel
            stats={sessionStats}
            showFeedback={showFeedback}
            feedbackRating={feedbackRating}
            onFeedbackChange={setFeedbackRating}
            onSubmitFeedback={handleSubmitFeedback}
            onSkip={() => {
              setFeedbackRating(null);
              setShowFeedback(false);
            }}
            onRepeat={handleRepeat}
            onNewText={handleNewText}
          />
        )}
      </main>

      {guideOpen && (
        <TrainingGuide
          canStart={!sessionActive}
          onClose={() => setGuideOpen(false)}
          onStart={() => {
            setGuideOpen(false);
            void startTrainingSession();
          }}
        />
      )}

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
  showFeedback,
  feedbackRating,
  onFeedbackChange,
  onSubmitFeedback,
  onSkip,
  onRepeat,
  onNewText,
}: {
  stats: SessionStats;
  showFeedback: boolean;
  feedbackRating: FeedbackRating | null;
  onFeedbackChange: (rating: FeedbackRating | null) => void;
  onSubmitFeedback: () => void;
  onSkip: () => void;
  onRepeat: () => void;
  onNewText: () => void;
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

      {showFeedback && (
        <div style={{ marginTop: 24, padding: 18, border: '1px solid var(--border-soft)', borderRadius: 14, background: 'var(--surface)' }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}>
            How was the pacing?
          </p>
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {[
              { id: 'too-slow', label: 'Too slow' },
              { id: 'a-little-slow', label: 'A little slow' },
              { id: 'okay', label: 'Okay' },
              { id: 'a-little-fast', label: 'A little fast' },
              { id: 'too-fast', label: 'Too fast' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                className={`btn btn-sm${feedbackRating === option.id ? ' btn-primary' : ' btn-ghost'}`}
                onClick={() => onFeedbackChange(option.id as FeedbackRating)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 10, textAlign: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onSubmitFeedback}
              disabled={!feedbackRating}
            >
              Save feedback
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginLeft: 8 }}
              onClick={onSkip}
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
