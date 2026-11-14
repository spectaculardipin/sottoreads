import { useEffect, useRef, useState } from 'react';
import { getAudioContext, primeAudio } from '../lib/audio';
import {
  browserSpeechSupported,
  loadBrowserVoices,
  primeSpeech,
  speakBrowser,
  type BrowserSpeechHandle,
} from '../lib/browserSpeech';
import { CloudTtsError, synthesizeCloud } from '../lib/cloud';
import { loadPace, predictWritingMs, recordWritingTime, savePace } from '../lib/pace';
import { makeBatches } from '../lib/text';
import { findActiveWord } from '../lib/timings';
import type {
  Batch,
  BatchPrepState,
  PaceModel,
  PreparedAudio,
  QueueItem,
  SessionSettings,
  SessionStatus,
  TimingKind,
  WarmupState,
} from '../lib/types';

export const DEFAULT_SESSION_SETTINGS: SessionSettings = {
  voice: 'browser',
  speed: 0.92,
  batchMode: 'sentence',
  wordsPerBatch: 6,
  browserVoiceURI: '',
  cloudVoiceId: '',
  advance: 'manual',
  prefetchAhead: 4,
};

export interface DictationApi {
  batches: Batch[];
  index: number;
  status: SessionStatus;
  activeWord: number;
  error: string | null;
  warmup: WarmupState;
  remainingMs: number | null;
  timingKind: TimingKind | null;
  queue: QueueItem[];
  preparedAhead: number;
  pace: PaceModel;
  elapsedMs: number;
  settings: SessionSettings;
  start: (text: string, settings: SessionSettings) => Promise<void>;
  play: () => void;
  pause: () => void;
  replay: () => void;
  next: () => void;
  previous: () => void;
  reset: () => void;
  retry: () => void;
  goTo: (index: number) => void;
}

const QUEUE_AHEAD = 4;

export function useDictation(): DictationApi {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [activeWord, setActiveWord] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [warmup, setWarmup] = useState<WarmupState>('cold');
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [timingKind, setTimingKind] = useState<TimingKind | null>(null);
  const [queueState, setQueueState] = useState<Record<number, BatchPrepState>>({});
  const [queueErrors, setQueueErrors] = useState<Record<number, string>>({});
  const [pace, setPace] = useState<PaceModel>(() => loadPace());
  const [settings, setSettings] = useState<SessionSettings>(DEFAULT_SESSION_SETTINGS);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [sessionClock, setSessionClock] = useState(0);

  const statusRef = useRef<SessionStatus>('idle');
  const indexRef = useRef(0);
  const activeWordRef = useRef(-1);
  const batchesRef = useRef<Batch[]>([]);
  const settingsRef = useRef<SessionSettings>(DEFAULT_SESSION_SETTINGS);
  const paceRef = useRef<PaceModel>(pace);
  const tokenRef = useRef(0);
  const requestRef = useRef(0);
  const readyRef = useRef<Map<number, PreparedAudio>>(new Map());
  const promiseRef = useRef<Map<number, Promise<PreparedAudio | null>>>(new Map());
  const failedRef = useRef<Map<number, string>>(new Map());
  const abortRef = useRef<Map<number, AbortController>>(new Map());
  const runningRef = useRef(0);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const speechRef = useRef<BrowserSpeechHandle | null>(null);
  const smartTimerRef = useRef<number | null>(null);
  const smartDeadlineRef = useRef(0);
  const playbackEndedAtRef = useRef<number | null>(null);
  const recordedRef = useRef<Set<number>>(new Set());
  const sessionStartRef = useRef(0);
  const sessionEndRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const scheduledStartRef = useRef(0);
  const offsetRef = useRef(0);

  function applyStatus(next: SessionStatus) {
    statusRef.current = next;
    setStatus(next);
  }

  function setQueueEntry(batchIndex: number, state: BatchPrepState, message?: string) {
    setQueueState((current) => ({ ...current, [batchIndex]: state }));
    setQueueErrors((current) => {
      const next = { ...current };
      if (message) next[batchIndex] = message;
      else delete next[batchIndex];
      return next;
    });
  }

  function clearSmart(resetDisplay = true) {
    if (smartTimerRef.current !== null) {
      window.clearInterval(smartTimerRef.current);
      smartTimerRef.current = null;
    }
    if (resetDisplay) setRemainingMs(null);
  }

  function stopSource() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const source = sourceRef.current;
    if (source) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // Already stopped.
      }
      try {
        source.disconnect();
      } catch {
        // Already disconnected.
      }
      sourceRef.current = null;
    }
    if (gainRef.current) {
      try {
        gainRef.current.disconnect();
      } catch {
        // Already disconnected.
      }
      gainRef.current = null;
    }
  }

  function stopSpeech() {
    speechRef.current?.cancel();
    speechRef.current = null;
  }

  function stopPlayback() {
    stopSource();
    stopSpeech();
    clearSmart();
  }

  function abortInFlight() {
    for (const controller of abortRef.current.values()) controller.abort();
    abortRef.current.clear();
  }

  function teardownSession() {
    stopPlayback();
    abortInFlight();
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      tokenRef.current += 1;
      requestRef.current += 1;
      stopSource();
      stopSpeech();
      clearSmart();
      abortInFlight();
    };
    // The teardown helpers only read refs; they are intentionally captured once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sessionClock === 0) return;
    if (status === 'complete') return;
    const timer = window.setInterval(() => {
      if (sessionEndRef.current === null) {
        setElapsedMs(performance.now() - sessionStartRef.current);
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [sessionClock, status]);

  function pump(token: number) {
    if (settingsRef.current.voice === 'browser') return;
    const ahead = Math.min(QUEUE_AHEAD, Math.max(1, settingsRef.current.prefetchAhead));
    const last = Math.min(batchesRef.current.length - 1, indexRef.current + ahead);
    for (let batchIndex = indexRef.current; batchIndex <= last; batchIndex += 1) {
      if (
        readyRef.current.has(batchIndex) ||
        promiseRef.current.has(batchIndex) ||
        failedRef.current.has(batchIndex)
      ) {
        continue;
      }
      if (runningRef.current >= 2) break;
      void prepareIndex(batchIndex, token);
    }
  }

  async function prepareIndex(batchIndex: number, token: number): Promise<PreparedAudio | null> {
    const ready = readyRef.current.get(batchIndex);
    if (ready) return ready;
    const existing = promiseRef.current.get(batchIndex);
    if (existing) return existing;
    if (failedRef.current.has(batchIndex)) return null;

    const batch = batchesRef.current[batchIndex];
    const currentSettings = settingsRef.current;
    if (!batch || (currentSettings.voice !== 'fish' && currentSettings.voice !== 'openrouter')) {
      return null;
    }

    const controller = new AbortController();
    abortRef.current.set(batchIndex, controller);
    runningRef.current += 1;
    setQueueEntry(batchIndex, 'generating');

    const promise = synthesizeCloud({
      text: batch.text,
      provider: currentSettings.voice,
      voiceId: currentSettings.cloudVoiceId || undefined,
      speed: currentSettings.speed,
      signal: controller.signal,
    })
      .then((prepared) => {
        if (token !== tokenRef.current) return null;
        readyRef.current.set(batchIndex, prepared);
        setQueueEntry(batchIndex, 'ready');
        return prepared;
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return null;
        if (token !== tokenRef.current) return null;
        const message =
          caught instanceof CloudTtsError
            ? caught.message
            : caught instanceof Error
              ? caught.message
              : 'This batch could not be generated.';
        failedRef.current.set(batchIndex, message);
        setQueueEntry(batchIndex, 'error', message);
        if (batchIndex === indexRef.current) {
          setError(message);
          applyStatus('error');
        }
        return null;
      })
      .finally(() => {
        abortRef.current.delete(batchIndex);
        promiseRef.current.delete(batchIndex);
        runningRef.current = Math.max(0, runningRef.current - 1);
        if (token === tokenRef.current && mountedRef.current) pump(token);
      });

    promiseRef.current.set(batchIndex, promise);
    return promise;
  }

  function recordWritingIfEligible() {
    const endedAt = playbackEndedAtRef.current;
    if (!endedAt || recordedRef.current.has(indexRef.current)) return;
    const batch = batchesRef.current[indexRef.current];
    if (!batch) return;
    const updated = recordWritingTime(paceRef.current, batch.charCount, performance.now() - endedAt);
    if (!updated) return;
    paceRef.current = updated;
    recordedRef.current.add(indexRef.current);
    savePace(updated);
    setPace(updated);
  }

  function handlePlaybackEnd(token: number) {
    if (token !== tokenRef.current) return;
    activeWordRef.current = -1;
    setActiveWord(-1);
    playbackEndedAtRef.current = performance.now();
    applyStatus('your-turn');
    pump(token);
    if (settingsRef.current.advance === 'smart') {
      startSmartCountdown(token);
    }
  }

  function startSmartCountdown(token: number) {
    clearSmart();
    const batch = batchesRef.current[indexRef.current];
    if (!batch) return;
    const total = predictWritingMs(batch.charCount, paceRef.current);
    smartDeadlineRef.current = performance.now() + total;
    setRemainingMs(total);

    smartTimerRef.current = window.setInterval(() => {
      if (token !== tokenRef.current || statusRef.current !== 'your-turn') {
        clearSmart();
        return;
      }
      const left = smartDeadlineRef.current - performance.now();
      if (left <= 0) {
        clearSmart();
        next(true);
      } else {
        setRemainingMs(left);
      }
    }, 100);
  }

  function startCloudBatch(batchIndex: number, token: number, offsetSec: number) {
    const prepared = readyRef.current.get(batchIndex);
    if (!prepared) return;

    const context = getAudioContext();
    const bufferDuration = prepared.buffer.duration;
    const safeOffset = Math.max(0, Math.min(offsetSec, Math.max(0, bufferDuration - 0.02)));
    const startAt = context.currentTime + 0.06;

    stopSource();

    try {
      const source = context.createBufferSource();
      source.buffer = prepared.buffer;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(1, startAt + 0.018);
      source.connect(gain);
      gain.connect(context.destination);
      source.start(startAt, safeOffset);

      sourceRef.current = source;
      gainRef.current = gain;
      scheduledStartRef.current = startAt;
      offsetRef.current = safeOffset;
      applyStatus('playing');
      setTimingKind(prepared.timingKind);

      const tick = () => {
        if (sourceRef.current !== source) return;
        const elapsed = context.currentTime - startAt + safeOffset;
        const found = findActiveWord(prepared.timings, elapsed);
        if (found !== activeWordRef.current) {
          activeWordRef.current = found;
          setActiveWord(found);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      source.onended = () => {
        if (sourceRef.current !== source) return;
        sourceRef.current = null;
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        if (gainRef.current === gain) {
          gainRef.current = null;
        }
        try {
          gain.disconnect();
        } catch {
          // Already disconnected.
        }
        handlePlaybackEnd(token);
      };
    } catch {
      setError('The audio device could not start this batch. Try pressing play again.');
      applyStatus('error');
    }
  }

  async function startBatch(batchIndex: number, token: number) {
    if (token !== tokenRef.current) return;
    const batch = batchesRef.current[batchIndex];
    if (!batch) return;

    stopPlayback();
    const request = requestRef.current + 1;
    requestRef.current = request;
    indexRef.current = batchIndex;
    setIndex(batchIndex);
    activeWordRef.current = -1;
    setActiveWord(-1);
    setError(null);
    setTimingKind(null);
    offsetRef.current = 0;
    playbackEndedAtRef.current = null;

    if (settingsRef.current.voice === 'browser') {
      if (!browserSpeechSupported()) {
        setError('This browser does not support built-in speech synthesis. Try Chrome or Edge.');
        applyStatus('error');
        return;
      }
      applyStatus('preparing');
      const handle = speakBrowser({
        text: batch.text,
        voiceURI: settingsRef.current.browserVoiceURI,
        rate: settingsRef.current.speed,
        onStart: () => {
          if (token !== tokenRef.current || request !== requestRef.current) return;
          applyStatus('playing');
        },
        onWord: (wordIndex) => {
          if (token !== tokenRef.current || request !== requestRef.current) return;
          activeWordRef.current = wordIndex;
          setActiveWord(wordIndex);
        },
        onEnd: () => {
          if (token !== tokenRef.current || request !== requestRef.current) return;
          handlePlaybackEnd(token);
        },
        onError: (message) => {
          if (token !== tokenRef.current || request !== requestRef.current) return;
          setError(message);
          applyStatus('error');
        },
      });
      speechRef.current = handle;
      return;
    }

    applyStatus('preparing');
    pump(token);
    const prepared = readyRef.current.get(batchIndex) ?? (await prepareIndex(batchIndex, token));
    if (token !== tokenRef.current || request !== requestRef.current || !mountedRef.current) {
      return;
    }
    if (!prepared) {
      const message = failedRef.current.get(batchIndex) ?? 'This batch could not be generated.';
      setError(message);
      applyStatus('error');
      return;
    }
    await primeAudio();
    if (token !== tokenRef.current || request !== requestRef.current) return;
    startCloudBatch(batchIndex, token, 0);
  }

  async function start(text: string, nextSettings: SessionSettings) {
    const nextBatches = makeBatches(text, nextSettings.wordsPerBatch, nextSettings.batchMode);
    if (nextBatches.length === 0) {
      setError('Paste or upload some text first.');
      applyStatus('error');
      return;
    }

    const token = tokenRef.current + 1;
    tokenRef.current = token;
    requestRef.current += 1;
    teardownSession();
    readyRef.current.clear();
    promiseRef.current.clear();
    failedRef.current.clear();
    recordedRef.current.clear();
    runningRef.current = 0;

    settingsRef.current = nextSettings;
    setSettings(nextSettings);
    batchesRef.current = nextBatches;
    setBatches(nextBatches);
    indexRef.current = 0;
    setIndex(0);
    activeWordRef.current = -1;
    setActiveWord(-1);
    setError(null);
    setTimingKind(null);
    setRemainingMs(null);
    playbackEndedAtRef.current = null;
    sessionEndRef.current = null;
    sessionStartRef.current = performance.now();
    setSessionClock(Date.now());
    setElapsedMs(0);
    setQueueState(
      Object.fromEntries(nextBatches.map((batch) => [batch.index, 'queued' as BatchPrepState])),
    );
    setQueueErrors({});
    setWarmup('warming');
    applyStatus('preparing');

    if (nextSettings.voice === 'browser') {
      await loadBrowserVoices();
      await primeSpeech();
      if (token !== tokenRef.current) return;
      setWarmup('ready');
      await startBatch(0, token);
      return;
    }

    try {
      await primeAudio();
    } catch {
      if (token !== tokenRef.current) return;
      setError('The audio device is not available. Try the browser voice or reload the page.');
      applyStatus('error');
      return;
    }
    if (token !== tokenRef.current) return;
    setWarmup('ready');
    pump(token);
    const first = await prepareIndex(0, token);
    if (token !== tokenRef.current) return;
    if (!first) {
      const message = failedRef.current.get(0) ?? 'The first batch could not be generated.';
      setError(message);
      applyStatus('error');
      return;
    }
    startCloudBatch(0, token, 0);
  }

  function pause() {
    if (statusRef.current !== 'playing') return;
    if (settingsRef.current.voice === 'browser') {
      // Browser speech pause/resume is unreliable across engines. Stopping the
      // utterance gives a predictable state; play then replays the batch.
      speechRef.current?.cancel();
      speechRef.current = null;
      applyStatus('paused');
      return;
    }
    const context = getAudioContext();
    const prepared = readyRef.current.get(indexRef.current);
    if (!prepared) return;
    const elapsed = context.currentTime - scheduledStartRef.current + offsetRef.current;
    offsetRef.current = Math.max(0, Math.min(elapsed, prepared.buffer.duration - 0.02));
    stopSource();
    applyStatus('paused');
  }

  async function resume() {
    if (statusRef.current !== 'paused') return;
    if (settingsRef.current.voice === 'browser') {
      void startBatch(indexRef.current, tokenRef.current);
      return;
    }
    await primeAudio();
    startCloudBatch(indexRef.current, tokenRef.current, offsetRef.current);
  }

  function play() {
    if (statusRef.current === 'preparing') return;
    if (statusRef.current === 'playing') {
      pause();
      return;
    }
    if (statusRef.current === 'paused') {
      void resume();
      return;
    }
    if (statusRef.current === 'error') {
      retry();
      return;
    }
    if (batchesRef.current.length === 0) return;
    void startBatch(indexRef.current, tokenRef.current);
  }

  function replay() {
    if (batchesRef.current.length === 0) return;
    recordedRef.current.delete(indexRef.current);
    void startBatch(indexRef.current, tokenRef.current);
  }

  function previous() {
    if (indexRef.current <= 0) return;
    void startBatch(indexRef.current - 1, tokenRef.current);
  }

  function next(auto = false) {
    if (batchesRef.current.length === 0) return;
    if (!auto) recordWritingIfEligible();
    clearSmart();
    const nextIndex = indexRef.current + 1;
    if (nextIndex >= batchesRef.current.length) {
      requestRef.current += 1;
      tokenRef.current += 1;
      stopPlayback();
      abortInFlight();
      activeWordRef.current = -1;
      setActiveWord(-1);
      sessionEndRef.current = performance.now();
      setElapsedMs(performance.now() - sessionStartRef.current);
      applyStatus('complete');
      return;
    }
    void startBatch(nextIndex, tokenRef.current);
  }

  function retry() {
    const failed = failedRef.current.get(indexRef.current);
    if (!failed) {
      void startBatch(indexRef.current, tokenRef.current);
      return;
    }
    failedRef.current.delete(indexRef.current);
    setQueueEntry(indexRef.current, 'queued');
    setError(null);
    void startBatch(indexRef.current, tokenRef.current);
  }

  function goTo(batchIndex: number) {
    if (batchIndex < 0 || batchIndex >= batchesRef.current.length) return;
    recordedRef.current.delete(batchIndex);
    void startBatch(batchIndex, tokenRef.current);
  }

  function reset() {
    tokenRef.current += 1;
    requestRef.current += 1;
    teardownSession();
    readyRef.current.clear();
    promiseRef.current.clear();
    failedRef.current.clear();
    recordedRef.current.clear();
    runningRef.current = 0;
    batchesRef.current = [];
    setBatches([]);
    indexRef.current = 0;
    setIndex(0);
    activeWordRef.current = -1;
    setActiveWord(-1);
    setStatus('idle');
    statusRef.current = 'idle';
    setError(null);
    setQueueState({});
    setQueueErrors({});
    setTimingKind(null);
    setRemainingMs(null);
    setElapsedMs(0);
    setSessionClock(0);
    sessionEndRef.current = null;
    playbackEndedAtRef.current = null;
  }

  useEffect(() => {
    function onGesture() {
      void primeAudio().catch(() => {});
      if (browserSpeechSupported()) {
        // Load voices early; the full silent prime happens on session start.
        void loadBrowserVoices();
      }
    }
    window.addEventListener('pointerdown', onGesture, { once: true, passive: true });
    window.addEventListener('keydown', onGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
  }, []);

  const queue: QueueItem[] = batches.map((batch) => ({
    index: batch.index,
    text: batch.text,
    state: queueState[batch.index] ?? 'queued',
    error: queueErrors[batch.index],
  }));

  const aheadStart = index + 1;
  const aheadEnd = Math.min(batches.length, aheadStart + QUEUE_AHEAD);
  const preparedAhead = batches
    .slice(aheadStart, aheadEnd)
    .filter((batch) => queueState[batch.index] === 'ready').length;

  return {
    batches,
    index,
    status,
    activeWord,
    error,
    warmup,
    remainingMs,
    timingKind,
    queue,
    preparedAhead,
    pace,
    elapsedMs,
    settings,
    start,
    play,
    pause,
    replay,
    next: () => next(false),
    previous,
    reset,
    retry,
    goTo,
  };
}
