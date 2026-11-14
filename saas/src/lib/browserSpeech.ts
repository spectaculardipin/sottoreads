import { estimateSpeechMs } from './text';
import { estimateWordTimings } from './timings';

let cachedVoices: SpeechSynthesisVoice[] | null = null;
let speechWarmed = false;

export function browserSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function getCachedBrowserVoices(): SpeechSynthesisVoice[] {
  if (!browserSpeechSupported()) return [];
  if (!cachedVoices || cachedVoices.length === 0) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
  return cachedVoices;
}

export async function loadBrowserVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!browserSpeechSupported()) return [];
  const current = window.speechSynthesis.getVoices();
  if (current.length > 0) {
    cachedVoices = current;
    return sortVoices(current);
  }

  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.speechSynthesis.removeEventListener('voiceschanged', finish);
      window.clearTimeout(timer);
      cachedVoices = window.speechSynthesis.getVoices();
      resolve();
    };
    const timer = window.setTimeout(finish, 1400);
    window.speechSynthesis.addEventListener('voiceschanged', finish);
  });

  return sortVoices(cachedVoices ?? []);
}

function sortVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const seen = new Set<string>();
  const unique = voices.filter((voice) => {
    const key = voice.voiceURI || `${voice.name}|${voice.lang}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.sort((a, b) => {
    const aEnglish = a.lang.toLowerCase().startsWith('en') ? 0 : 1;
    const bEnglish = b.lang.toLowerCase().startsWith('en') ? 0 : 1;
    if (aEnglish !== bEnglish) return aEnglish - bEnglish;
    const aNatural = /natural|neural|google|aria|jenny|samantha|zira|female/i.test(a.name)
      ? 0
      : 1;
    const bNatural = /natural|neural|google|aria|jenny|samantha|zira|female/i.test(b.name)
      ? 0
      : 1;
    if (aNatural !== bNatural) return aNatural - bNatural;
    return a.name.localeCompare(b.name);
  });
}

export function pickDefaultBrowserVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  if (voices.length === 0) return undefined;
  return (
    voices.find(
      (voice) =>
        voice.lang.toLowerCase().startsWith('en') &&
        /natural|neural|google|aria|jenny|samantha|zira|female|daniel|serena/i.test(voice.name),
    ) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('en')) ??
    voices[0]
  );
}

/**
 * The first browser utterance on some systems swallows the opening syllable.
 * Push a silent utterance through the queue once, then clear it. This runs only
 * after a user gesture, so it is safe on mobile browsers too.
 */
export async function primeSpeech(): Promise<void> {
  if (!browserSpeechSupported()) return;
  const synth = window.speechSynthesis;
  await loadBrowserVoices();
  if (speechWarmed) return;

  const utterance = new SpeechSynthesisUtterance(' ');
  utterance.volume = 0;
  utterance.rate = 2;
  utterance.lang = 'en-US';
  try {
    synth.speak(utterance);
    await delay(180);
    synth.cancel();
    await delay(110);
  } catch {
    // Priming is best-effort; the real utterance is still attempted.
  }
  speechWarmed = true;
}

function wordOffsets(text: string, words: string[]): number[] {
  const offsets: number[] = [];
  let from = 0;
  for (const word of words) {
    let index = text.indexOf(word, from);
    if (index < 0) {
      const stripped = word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
      index = stripped ? text.indexOf(stripped, from) : -1;
    }
    offsets.push(index >= 0 ? index : from);
    from = Math.max(from, index + word.length);
  }
  return offsets;
}

export interface BrowserSpeechHandle {
  cancel: () => void;
  pause: () => void;
  resume: () => void;
}

export interface BrowserSpeechOptions {
  text: string;
  voiceURI?: string;
  rate: number;
  onStart: () => void;
  onWord: (index: number) => void;
  onEnd: () => void;
  onError: (message: string) => void;
}

/**
 * Speak one batch with boundary-based word highlighting and a timed fallback
 * for engines that do not emit boundary events.
 */
export function speakBrowser(options: BrowserSpeechOptions): BrowserSpeechHandle {
  if (!browserSpeechSupported()) {
    options.onError('This browser does not support built-in speech synthesis.');
    return { cancel: () => {}, pause: () => {}, resume: () => {} };
  }

  const synth = window.speechSynthesis;
  const words = options.text.split(/\s+/).filter(Boolean);
  const offsets = wordOffsets(options.text, words);
  const utterance = new SpeechSynthesisUtterance(options.text);
  utterance.rate = Math.max(0.5, Math.min(2, options.rate));
  utterance.pitch = 1;
  utterance.lang = 'en-US';

  const voices = getCachedBrowserVoices();
  const selected =
    (options.voiceURI && voices.find((voice) => voice.voiceURI === options.voiceURI)) ||
    pickDefaultBrowserVoice(voices);
  if (selected) {
    utterance.voice = selected;
    utterance.lang = selected.lang;
  }

  let cancelled = false;
  let started = false;
  let finished = false;
  let boundarySeen = false;
  let fallbackTimers: number[] = [];
  let pausedAt = 0;

  const clearFallback = () => {
    for (const timer of fallbackTimers) window.clearTimeout(timer);
    fallbackTimers = [];
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    clearFallback();
    options.onEnd();
  };

  const startFallbackHighlight = () => {
    if (boundarySeen || cancelled || words.length === 0) return;
    const estimated = estimateSpeechMs(words, utterance.rate);
    const timings = estimateWordTimings(words, estimated / 1000);
    for (let index = 0; index < timings.length; index += 1) {
      const at = Math.max(0, timings[index].start * 1000);
      const timer = window.setTimeout(() => {
        if (cancelled || boundarySeen || finished) return;
        if (pausedAt > 0) return;
        options.onWord(index);
      }, at);
      fallbackTimers.push(timer);
    }
    const endTimer = window.setTimeout(() => {
      if (!cancelled && !boundarySeen && !finished && pausedAt === 0) finish();
    }, estimated + 900);
    fallbackTimers.push(endTimer);
  };

  utterance.onstart = () => {
    if (cancelled) return;
    started = true;
    options.onStart();
    const timer = window.setTimeout(() => {
      if (!boundarySeen) startFallbackHighlight();
    }, 420);
    fallbackTimers.push(timer);
  };

  utterance.onboundary = (event) => {
    if (cancelled || finished) return;
    if (event.name && event.name !== 'word') return;
    boundarySeen = true;
    clearFallback();
    const charIndex = event.charIndex;
    let index = 0;
    for (let i = 0; i < offsets.length; i += 1) {
      if (offsets[i] <= charIndex) index = i;
      else break;
    }
    options.onWord(Math.max(0, Math.min(words.length - 1, index)));
  };

  utterance.onend = () => {
    if (cancelled) return;
    finish();
  };

  utterance.onerror = (event) => {
    if (cancelled || finished) return;
    if (event.error === 'canceled' || event.error === 'interrupted') {
      finish();
      return;
    }
    clearFallback();
    finished = true;
    options.onError(`The browser voice stopped: ${event.error || 'unknown error'}.`);
  };

  // Chrome sometimes drops the opening of an utterance queued immediately
  // after cancel(). The short pause is part of the warm start.
  synth.cancel();
  const startTimer = window.setTimeout(() => {
    if (cancelled) return;
    try {
      synth.speak(utterance);
    } catch (error) {
      finished = true;
      options.onError(
        error instanceof Error ? error.message : 'The browser voice could not start.',
      );
      return;
    }
    // Some engines report onstart late or never; don't leave the UI hanging.
    if (!started) {
      const guard = window.setTimeout(() => {
        if (!started && !cancelled && !finished) {
          started = true;
          options.onStart();
        }
      }, 700);
      fallbackTimers.push(guard);
    }
  }, 90);
  fallbackTimers.push(startTimer);

  return {
    cancel: () => {
      cancelled = true;
      clearFallback();
      if ('speechSynthesis' in window) synth.cancel();
    },
    pause: () => {
      if (cancelled || finished) return;
      pausedAt = performance.now();
      try {
        synth.pause();
      } catch {
        // Some mobile engines do not implement pause.
      }
    },
    resume: () => {
      if (cancelled || finished) return;
      pausedAt = 0;
      try {
        synth.resume();
      } catch {
        // Some mobile engines do not implement resume.
      }
    },
  };
}
